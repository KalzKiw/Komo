import { supabase } from "../config";
import { AppError } from "../errors/app-error";
import { AuthUser, UserRole, OrderShift, OrderStatus } from "../types/domain";
import { ListMyOrdersQuery, ListProductsQuery, UpdateMyProfileBody } from "../validators/main-app.validator";
import { roundMoney } from "../utils/money";
import { ALLERGENS } from "../data/allergens";

interface UserProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_beneficiary: boolean;
  wallet_balance: number;
  phone?: string | null;
  payment_card_last4?: string | null;
  course_id: string | null;
  course: { name: string }[] | null;
}

interface UserAllergyRow {
  allergen_id: string;
}

interface AllergenRow {
  id: string;
  code: string;
  name: string;
}

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_active: boolean;
}

interface OrderRow {
  id: string;
  user_id: string;
  shift: OrderShift;
  scheduled_for: string;
  status: OrderStatus;
  total: number;
  credited_to_wallet: boolean;
  created_at: string;
}

interface WalletTransactionRow {
  id: string;
  amount: number;
  concept: string;
  created_at: string;
}

function isMissingProfileColumns(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? "");
  return message.includes("phone") || message.includes("payment_card_last4");
}

export async function getMyProfile(user: AuthUser): Promise<Record<string, unknown>> {
  let { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_beneficiary, wallet_balance, phone, payment_card_last4, course_id, course:courses(name)")
    .eq("id", user.id)
    .single();

  if (error && isMissingProfileColumns(error)) {
    const fallback = await supabase
      .from("users")
      .select("id, email, full_name, role, is_beneficiary, wallet_balance, course_id, course:courses(name)")
      .eq("id", user.id)
      .single();
    data = fallback.data as any;
    error = fallback.error;
  }

  if (error || !data) {
    throw new AppError("User profile not found", 404);
  }

  const profile = data as UserProfileRow;

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    isBeneficiary: profile.is_beneficiary,
    walletBalance: profile.wallet_balance,
    phone: profile.phone ?? null,
    paymentCardLast4: profile.payment_card_last4 ?? null,
    courseId: profile.course_id,
    courseName: profile.course?.[0]?.name ?? null
  };
}

export async function updateMyProfile(user: AuthUser, body: UpdateMyProfileBody): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {};
  if (body.phone !== undefined) payload.phone = body.phone;
  if (body.paymentCardLast4 !== undefined) payload.payment_card_last4 = body.paymentCardLast4;

  if (Object.keys(payload).length === 0) {
    return getMyProfile(user);
  }

  let { error } = await supabase
    .from("users")
    .update(payload)
    .eq("id", user.id);

  if (error && isMissingProfileColumns(error)) {
    throw new AppError("Falta aplicar la migración de perfil persistente", 500);
  }

  if (error) {
    throw new AppError("No se pudo actualizar el perfil", 500);
  }

  return getMyProfile(user);
}

export async function topUpMyWallet(user: AuthUser, amount: number): Promise<Record<string, unknown>> {
  if (!["STUDENT", "DELEGATE"].includes(user.role)) {
    throw new AppError("Solo los alumnos pueden recargar su propio monedero", 403);
  }

  const topUpAmount = roundMoney(amount);
  if (topUpAmount <= 0 || topUpAmount > 200) {
    throw new AppError("El importe debe estar entre 0.01€ y 200€", 400);
  }

  const { data: wallet, error: fetchError } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", user.id)
    .single();

  if (fetchError || !wallet) {
    throw new AppError("Unable to load wallet balance", 500);
  }

  const currentBalance = roundMoney(Number((wallet as { wallet_balance: number }).wallet_balance ?? 0));
  const newBalance = roundMoney(currentBalance + topUpAmount);

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ wallet_balance: newBalance })
    .eq("id", user.id)
    .eq("wallet_balance", currentBalance)
    .select("wallet_balance")
    .maybeSingle();

  if (updateError) {
    throw new AppError("Error al actualizar el saldo", 500);
  }

  if (!updated) {
    throw new AppError("El saldo ha cambiado. Revisa el monedero e inténtalo de nuevo.", 409);
  }

  await supabase.from("wallet_transactions").insert({
    user_id: user.id,
    amount: topUpAmount,
    concept: "Ingreso de saldo"
  });

  return {
    walletBalance: Number((updated as { wallet_balance: number }).wallet_balance),
    amount: topUpAmount
  };
}

export async function listMyWalletMovements(user: AuthUser, limit = 30): Promise<Record<string, unknown>> {
  const [ordersResult, transactionsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, user_id, shift, scheduled_for, status, total, credited_to_wallet, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("wallet_transactions")
      .select("id, amount, concept, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit)
  ]);

  if (ordersResult.error) {
    throw new AppError("Unable to list wallet movements", 500);
  }

  const orders = ((ordersResult.data ?? []) as OrderRow[]).map((order) => ({
    id: order.id,
    shift: order.shift,
    scheduledFor: order.scheduled_for,
    status: order.status,
    total: order.total,
    creditedToWallet: order.credited_to_wallet,
    createdAt: order.created_at
  }));

  const transactions = transactionsResult.error
    ? []
    : ((transactionsResult.data ?? []) as WalletTransactionRow[]).map((tx) => ({
        id: tx.id,
        shift: "TOPUP",
        scheduledFor: tx.created_at,
        status: "TOPUP",
        total: Number(tx.amount),
        creditedToWallet: true,
        createdAt: tx.created_at,
        concept: tx.concept
      }));

  return {
    data: [...orders, ...transactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  };
}

export async function listMyAllergies(user: AuthUser): Promise<Record<string, unknown>> {
  const { data: userAllergies, error: userAllergiesError } = await supabase
    .from("user_allergies")
    .select("allergen_id")
    .eq("user_id", user.id);

  if (userAllergiesError) {
    throw new AppError("Unable to list allergies", 500);
  }

  const ids = ((userAllergies ?? []) as UserAllergyRow[]).map((row) => row.allergen_id);

  if (ids.length === 0) {
    return { data: [] };
  }

  const { data: allergens, error: allergensError } = await supabase
    .from("allergens")
    .select("id, code, name")
    .in("id", ids);

  if (allergensError) {
    throw new AppError("Unable to list allergies", 500);
  }

  const rows = (allergens ?? []) as AllergenRow[];

  return {
    data: rows.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name
    }))
  };
}

export async function listProductsForMainApp(
  user: AuthUser,
  query: ListProductsQuery
): Promise<Record<string, unknown>> {
  const productSelectWithDetails = `id, name, description, image_url, product_info, price, is_active,
       product_allergens (
         allergen_id,
         allergens!product_allergens_allergen_id_fkey (id, code, name)
       )`;
  const productSelectLegacy = `id, name, description, price, is_active,
       product_allergens (
         allergen_id,
         allergens!product_allergens_allergen_id_fkey (id, code, name)
       )`;
  let statement = supabase
    .from("products")
    .select(productSelectWithDetails)
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(query.limit ?? 100);

  let { data, error } = await statement;

  if (error) {
    const message = error.message ?? "";
    if (message.includes("image_url") || message.includes("product_info")) {
      const fallback = await supabase
        .from("products")
        .select(productSelectLegacy)
        .eq("is_active", true)
        .order("name", { ascending: true })
        .limit(query.limit ?? 100);
      data = fallback.data as any;
      error = fallback.error;
    }
  }

  if (error) {
    throw new AppError("Unable to list products", 500);
  }

  const products = (data ?? []) as any[];

  return {
    data: products.map((product) => {
      const displayPrice = roundMoney(Number(product.price));
      const allergenList = (product.product_allergens ?? []).map((pa: any) => ({
        id: pa.allergens?.id,
        code: pa.allergens?.code,
        name: pa.allergens?.name
      })).filter((a: any) => a.id);

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.image_url ?? null,
        productInfo: product.product_info ?? null,
        price: displayPrice,
        originalPrice: roundMoney(Number(product.price)),
        allergens: allergenList
      };
    })
  };
}

export async function listMyOrders(user: AuthUser, query: ListMyOrdersQuery): Promise<Record<string, unknown>> {
  let statement = supabase
    .from("orders")
    .select("id, user_id, shift, scheduled_for, status, total, credited_to_wallet, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(query.limit ?? 100);

  if (query.scheduledFor) {
    statement = statement.eq("scheduled_for", query.scheduledFor);
  }

  if (query.shift) {
    statement = statement.eq("shift", query.shift);
  }

  if (query.status) {
    statement = statement.eq("status", query.status);
  }

  const { data, error } = await statement;

  if (error) {
    throw new AppError("Unable to list your orders", 500);
  }

  const orders = (data ?? []) as OrderRow[];

  return {
    data: orders.map((order) => ({
      id: order.id,
      shift: order.shift,
      scheduledFor: order.scheduled_for,
      status: order.status,
      total: order.total,
      creditedToWallet: order.credited_to_wallet,
      createdAt: order.created_at
    }))
  };
}

// ─── List ALL available allergens ───────────────────────────────────────────────

async function ensureAllergensSeeded(): Promise<void> {
  const { error } = await supabase
    .from("allergens")
    .upsert(ALLERGENS, { onConflict: "code" });

  if (error) {
    throw new AppError("Unable to seed allergens", 500);
  }
}

export async function listAllAllergens(): Promise<Record<string, unknown>> {
  await ensureAllergensSeeded();

  const { data, error } = await supabase
    .from("allergens")
    .select("id, code, name")
    .order("name", { ascending: true });

  if (error) {
    throw new AppError("Unable to list allergens", 500);
  }

  return {
    data: (data ?? []).map((a: any) => ({ id: a.id, code: a.code, name: a.name }))
  };
}

// ─── Replace user allergens (PUT) ───────────────────────────────────────────────

export async function updateMyAllergies(
  user: AuthUser,
  allergenIds: string[]
): Promise<Record<string, unknown>> {
  const { error: deleteError } = await supabase
    .from("user_allergies")
    .delete()
    .eq("user_id", user.id);

  if (deleteError) {
    throw new AppError("Error al actualizar los alérgenos", 500);
  }

  if (allergenIds.length > 0) {
    const rows = allergenIds.map((allergen_id) => ({ user_id: user.id, allergen_id }));
    const { error: insertError } = await supabase.from("user_allergies").insert(rows);
    if (insertError) {
      throw new AppError("Error al guardar los alérgenos", 500);
    }
  }

  return { success: true, count: allergenIds.length };
}
