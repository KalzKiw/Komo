import { supabase } from "../config/supabase";
import { AppError } from "../errors/app-error";

export interface OrderSchedule {
  morning: { hour: number; minute: number };
  afternoon: { hour: number; minute: number };
  night: { hour: number; minute: number };
  graceMinutes: number;
}

function parseTime(value: string): { hour: number; minute: number } {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    throw new Error(`Invalid time format: ${value}`);
  }
  return { hour: h, minute: m };
}

export async function getOrderSchedule(): Promise<OrderSchedule> {
  const { data, error } = await supabase
    .from("settings")
    .select("key, value")
    .in("key", ["ORDER_CUTOFF_MORNING", "ORDER_CUTOFF_AFTERNOON", "ORDER_CUTOFF_NIGHT", "ORDER_GRACE_MINUTES"]);

  if (error) {
    throw new AppError("Unable to load order schedule settings", 500);
  }

  const map = new Map((data ?? []).map((row: { key: string; value: string }) => [row.key, row.value]));

  return {
    morning: parseTime(map.get("ORDER_CUTOFF_MORNING") ?? "09:00"),
    afternoon: parseTime(map.get("ORDER_CUTOFF_AFTERNOON") ?? "15:00"),
    night: parseTime(map.get("ORDER_CUTOFF_NIGHT") ?? "18:00"),
    graceMinutes: Number(map.get("ORDER_GRACE_MINUTES") ?? "5")
  };
}

export async function updateOrderSchedule(patch: Partial<{
  morning: string;
  afternoon: string;
  night: string;
  graceMinutes: number;
}>): Promise<OrderSchedule> {
  const rows: { key: string; value: string }[] = [];

  if (patch.morning !== undefined) {
    parseTime(patch.morning); // validate format
    rows.push({ key: "ORDER_CUTOFF_MORNING", value: patch.morning });
  }
  if (patch.afternoon !== undefined) {
    parseTime(patch.afternoon);
    rows.push({ key: "ORDER_CUTOFF_AFTERNOON", value: patch.afternoon });
  }
  if (patch.night !== undefined) {
    parseTime(patch.night);
    rows.push({ key: "ORDER_CUTOFF_NIGHT", value: patch.night });
  }
  if (patch.graceMinutes !== undefined) {
    rows.push({ key: "ORDER_GRACE_MINUTES", value: String(patch.graceMinutes) });
  }

  if (rows.length === 0) {
    return getOrderSchedule();
  }

  const { error } = await supabase
    .from("settings")
    .upsert(rows.map((r) => ({ ...r, updated_at: new Date().toISOString() })), { onConflict: "key" });

  if (error) {
    throw new AppError("Unable to update order schedule settings", 500);
  }

  return getOrderSchedule();
}
