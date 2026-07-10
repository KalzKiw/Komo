import { env } from "../config/env";
import { supabase } from "../config/supabase";
import { printOrderTicket, TicketItem } from "./ticket-printer.service";

type AllergenRelation = { id: string; code: string; name: string } | { id: string; code: string; name: string }[] | null;
type ProductRelation = { name: string | null } | { name: string | null }[] | null | undefined;

interface UserAllergyRow {
  allergens?: AllergenRelation;
}

interface PendingTicketOrderRow {
  id: string;
  user_id: string;
  shift: string;
  total: number;
  created_at: string;
  ticket_print_attempts: number | null;
  order_items?: Array<{
    quantity: number;
    line_total: number;
    customization_json: string[] | null;
    kitchen_note: string | null;
    products?: { name: string | null } | { name: string | null }[] | null;
  }> | null;
}

interface TicketStudentInfo {
  studentName: string | null;
  studentAllergens: string[];
}

let timer: NodeJS.Timeout | null = null;
let running = false;
let schemaAvailable = true;

function firstRelation<T>(value?: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function productName(value: ProductRelation): string {
  return firstRelation(value)?.name ?? "Producto";
}

async function loadTicketStudentInfo(userId: string): Promise<TicketStudentInfo> {
  const [{ data: student }, { data: allergyRows, error: allergiesError }] = await Promise.all([
    supabase
      .from("users")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("user_allergies")
      .select("allergens(id, code, name)")
      .eq("user_id", userId)
  ]);

  if (allergiesError) {
    console.error("Unable to load student allergens for ticket", allergiesError);
  }

  const studentAllergens = ((allergyRows ?? []) as unknown as UserAllergyRow[])
    .map((row) => firstRelation(row.allergens)?.name)
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b, "es"));

  return {
    studentName: typeof student?.full_name === "string" ? student.full_name : null,
    studentAllergens
  };
}

function mapTicketItems(row: PendingTicketOrderRow): TicketItem[] {
  return (row.order_items ?? []).map((item) => ({
    name: productName(item.products),
    quantity: item.quantity,
    lineTotal: Number(item.line_total ?? 0),
    customizations: item.customization_json ?? [],
    kitchenNote: item.kitchen_note ?? null
  }));
}

async function claimPrintJob(order: PendingTicketOrderRow): Promise<boolean> {
  const attempts = Number(order.ticket_print_attempts ?? 0) + 1;
  const { data, error } = await supabase
    .from("orders")
    .update({
      ticket_print_attempts: attempts,
      ticket_print_last_attempt_at: new Date().toISOString(),
      ticket_print_error: null
    })
    .eq("id", order.id)
    .eq("ticket_print_attempts", Number(order.ticket_print_attempts ?? 0))
    .is("ticket_printed_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Unable to claim ticket print job", error);
    return false;
  }

  return Boolean(data);
}

async function markPrinted(orderId: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      ticket_printed_at: new Date().toISOString(),
      ticket_print_error: null
    })
    .eq("id", orderId);

  if (error) {
    console.error("Unable to mark ticket as printed", error);
  }
}

async function markPrintError(orderId: string, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error);
  const { error: updateError } = await supabase
    .from("orders")
    .update({ ticket_print_error: message.slice(0, 500) })
    .eq("id", orderId);

  if (updateError) {
    console.error("Unable to mark ticket print error", updateError);
  }
}

export async function printPendingTickets(limit = 10): Promise<void> {
  let query = supabase
    .from("orders")
    .select(
      "id, user_id, shift, total, created_at, ticket_print_attempts, order_items(quantity, line_total, customization_json, kitchen_note, products(name))"
    )
    .is("ticket_printed_at", null)
    .neq("status", "CANCELLED")
    .lt("ticket_print_attempts", 10);

  if (env.PRINT_WORKER_IGNORE_BEFORE) {
    query = query.gte("created_at", env.PRINT_WORKER_IGNORE_BEFORE);
  }

  const { data, error } = await query
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (String(error.message ?? "").includes("ticket_print")) {
      schemaAvailable = false;
      console.error("Ticket print queue columns are missing. Apply db/migrations/20260515_ticket_print_queue.sql and restart the local server.");
      stopTicketPrintWorker();
      return;
    }
    console.error("Unable to load pending ticket print queue", error);
    return;
  }

  for (const order of (data ?? []) as unknown as PendingTicketOrderRow[]) {
    try {
      const claimed = await claimPrintJob(order);
      if (!claimed) {
        continue;
      }

      const student = await loadTicketStudentInfo(order.user_id);
      await printOrderTicket({
        id: order.id,
        createdAt: order.created_at,
        studentName: student.studentName,
        studentAllergens: student.studentAllergens,
        shift: order.shift,
        total: Number(order.total ?? 0),
        items: mapTicketItems(order)
      });
      await markPrinted(order.id);
      console.log(`Printed ticket for order ${order.id}`);
    } catch (error) {
      console.error(`Unable to print queued ticket for order ${order.id}`, error);
      await markPrintError(order.id, error);
    }
  }
}

export async function queueTicketReprint(orderId: string): Promise<{ queued: true }> {
  const { error } = await supabase
    .from("orders")
    .update({
      ticket_printed_at: null,
      ticket_print_error: null,
      ticket_print_attempts: 0,
      ticket_print_last_attempt_at: null
    })
    .eq("id", orderId);

  if (error) {
    throw error;
  }

  return { queued: true };
}

export function startTicketPrintWorker(): void {
  if (env.PRINT_WORKER_ENABLED !== "true" || env.NODE_ENV === "test") {
    return;
  }

  if (timer) {
    return;
  }

  const tick = () => {
    if (running || !schemaAvailable) return;
    running = true;
    void printPendingTickets().finally(() => {
      running = false;
    });
  };

  tick();
  timer = setInterval(tick, env.PRINT_WORKER_INTERVAL_MS);
  console.log(`Ticket print worker enabled every ${env.PRINT_WORKER_INTERVAL_MS}ms`);
}

export function stopTicketPrintWorker(): void {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}
