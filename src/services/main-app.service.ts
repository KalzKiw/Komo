import { supabase } from "../config";
import { AppError } from "../errors/app-error";
import { AuthUser, UserRole, OrderShift, OrderStatus } from "../types/domain";
import { ListMyOrdersQuery, ListProductsQuery } from "../validators/main-app.validator";
import { roundMoney } from "../utils/money";

interface UserProfileRow {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_beneficiary: boolean;
  wallet_balance: number;
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

export async function getMyProfile(user: AuthUser): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, is_beneficiary, wallet_balance, course_id, course:courses(name)")
    .eq("id", user.id)
    .single();

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
    courseId: profile.course_id,
    courseName: profile.course?.[0]?.name ?? null
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
  let statement = supabase
    .from("products")
    .select("id, name, description, price, is_active")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(query.limit ?? 100);

  const { data, error } = await statement;

  if (error) {
    throw new AppError("Unable to list products", 500);
  }

  const products = (data ?? []) as ProductRow[];

  return {
    data: products.map((product) => {
      const displayPrice = roundMoney(Number(product.price));

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: displayPrice,
        originalPrice: roundMoney(Number(product.price))
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

export async function listAllAllergens(): Promise<Record<string, unknown>> {
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


