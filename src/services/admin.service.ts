import { supabase } from "../config";
import { AppError } from "../errors/app-error";
import { OrderShift, OrderStatus } from "../types/domain";
import { AssignDelegateBody, CreateProductBody, UpdateProductBody } from "../validators/admin.validator";

interface ManageUserRow {
  id: string;
  email: string;
  full_name: string;
  role: "STUDENT" | "DELEGATE";
  course_id: string | null;
}

interface KdsOrderRow {
  id: string;
  user_id: string;
  shift: OrderShift;
  status: OrderStatus;
  total: number;
  created_at: string;
  order_items:
    | {
        quantity: number;
        kitchen_note: string | null;
        customization_json: string[] | null;
        product: { name: string }[] | null;
      }[]
    | null;
}

interface ProductRow {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  product_info?: Record<string, unknown> | null;
  price: number;
  is_active: boolean;
  created_at: string;
  product_allergens?: Array<{
    allergen_id: string;
    allergens?: { id: string; code: string; name: string } | { id: string; code: string; name: string }[] | null;
  }>;
}

const PRODUCT_SELECT_WITH_DETAILS = `id, name, description, image_url, product_info, price, is_active, created_at,
  product_allergens (
    allergen_id,
    allergens!product_allergens_allergen_id_fkey (id, code, name)
  )`;
const PRODUCT_SELECT_LEGACY = `id, name, description, price, is_active, created_at,
  product_allergens (
    allergen_id,
    allergens!product_allergens_allergen_id_fkey (id, code, name)
  )`;

function isMissingProductInfoColumns(error: unknown): boolean {
  const message = String((error as { message?: string } | null)?.message ?? "");
  return message.includes("image_url") || message.includes("product_info");
}

function mapProduct(row: ProductRow): Record<string, unknown> {
  const allergens = (row.product_allergens ?? [])
    .map((pa) => Array.isArray(pa.allergens) ? pa.allergens[0] : pa.allergens)
    .filter(Boolean);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.image_url ?? null,
    productInfo: row.product_info ?? null,
    price: row.price,
    isActive: row.is_active,
    createdAt: row.created_at,
    allergens,
    allergenIds: allergens.map((allergen) => allergen?.id).filter(Boolean)
  };
}

async function syncProductAllergens(productId: string, allergenIds: string[] | undefined): Promise<void> {
  if (allergenIds === undefined) return;

  const { error: deleteError } = await supabase
    .from("product_allergens")
    .delete()
    .eq("product_id", productId);

  if (deleteError) {
    throw new AppError("Unable to update product allergens", 500);
  }

  if (allergenIds.length === 0) return;

  const rows = allergenIds.map((allergen_id) => ({ product_id: productId, allergen_id }));
  const { error: insertError } = await supabase.from("product_allergens").insert(rows);

  if (insertError) {
    throw new AppError("Unable to update product allergens", 500);
  }
}

export async function listStudentsForAdmin(): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, role, course_id")
    .in("role", ["STUDENT", "DELEGATE"])
    .order("full_name", { ascending: true });

  if (error) {
    throw new AppError("Unable to list students", 500);
  }

  const rows = (data ?? []) as ManageUserRow[];

  return {
    data: rows.map((row) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      courseId: row.course_id,
      isDelegate: row.role === "DELEGATE"
    }))
  };
}

export async function assignDelegateRole(
  studentId: string,
  body: AssignDelegateBody
): Promise<Record<string, unknown>> {
  const { data: target, error: targetError } = await supabase
    .from("users")
    .select("id, role")
    .eq("id", studentId)
    .single();

  if (targetError || !target) {
    throw new AppError("Alumno no encontrado", 404);
  }

  if (!["STUDENT", "DELEGATE"].includes(target.role)) {
    throw new AppError("Solo se puede gestionar rol delegado para alumnos", 409);
  }

  const nextRole = body.isDelegate ? "DELEGATE" : "STUDENT";

  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ role: nextRole })
    .eq("id", studentId)
    .select("id, role")
    .single();

  if (updateError || !updated) {
    throw new AppError("No se pudo actualizar rol delegado", 500);
  }

  return {
    id: updated.id,
    role: updated.role,
    isDelegate: updated.role === "DELEGATE"
  };
}

export async function listKdsQueue(): Promise<Record<string, unknown>> {
  // Try full query with new columns
  let { data, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, shift, status, total, created_at, order_items(quantity, kitchen_note, customization_json, product_id, products(name))"
    )
    .in("status", ["PENDING", "IN_PREPARATION", "READY"])
    .order("created_at", { ascending: true })
    .limit(100);

  // If columns don't exist, try without them
  if (error && error?.message?.includes("does not exist")) {
    console.warn("⚠️  New columns not found, using fallback query");
    
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("orders")
      .select(
        "id, user_id, shift, status, total, created_at, order_items(quantity, product_id, products(name))"
      )
      .in("status", ["PENDING", "IN_PREPARATION", "READY"])
      .order("created_at", { ascending: true })
      .limit(100);

    if (fallbackError) {
      console.error("❌ Fallback KDS query failed:", fallbackError);
      throw new AppError(`Unable to load KDS queue: ${fallbackError?.message}`, 500);
    }

    data = fallbackData as any;
    error = null;
  }

  if (error) {
    console.error("❌ KDS queue error:", error);
    throw new AppError(`Unable to load KDS queue: ${error?.message || "Unknown error"}`, 500);
  }

  const rows = (data ?? []) as any[];
  console.log(`✅ KDS queue: ${rows.length} orders`);

  return {
    data: rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      shift: row.shift,
      status: row.status,
      total: row.total,
      createdAt: row.created_at,
      items: (row.order_items ?? []).map((item: any) => {
        // Extract product name - can come as array or object
        let productName = "Producto sin nombre";
        
        if (item.products) {
          // If products is array
          if (Array.isArray(item.products)) {
            productName = item.products[0]?.name || "Producto";
          } else {
            // If products is object
            productName = item.products.name || "Producto";
          }
        }

        return {
          name: productName,
          quantity: item.quantity,
          customizations: item.customization_json ?? [],
          kitchenNote: item.kitchen_note ?? null
        };
      })
    }))
  };
}

export async function listProductsForAdmin(): Promise<Record<string, unknown>> {
  let { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_DETAILS)
    .order("created_at", { ascending: false })
    .limit(300);

  if (error && isMissingProductInfoColumns(error)) {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_LEGACY)
      .order("created_at", { ascending: false })
      .limit(300);
    data = fallback.data as any;
    error = fallback.error;
  }

  if (error) {
    throw new AppError("Unable to list products", 500);
  }

  const rows = (data ?? []) as unknown as ProductRow[];

  return {
    data: rows.map(mapProduct)
  };
}

export async function createProductForAdmin(body: CreateProductBody): Promise<Record<string, unknown>> {
  let insertPayload: Record<string, unknown> = {
    name: body.name,
    description: body.description ?? null,
    image_url: body.imageUrl ?? null,
    product_info: body.productInfo ?? null,
    price: body.price,
    is_active: body.isActive
  };

  let { data, error } = await supabase
    .from("products")
    .insert(insertPayload)
    .select("id, name, description, image_url, product_info, price, is_active, created_at")
    .single();

  if (error && isMissingProductInfoColumns(error)) {
    insertPayload = {
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      is_active: body.isActive
    };
    const fallback = await supabase
      .from("products")
      .insert(insertPayload)
      .select("id, name, description, price, is_active, created_at")
      .single();
    data = fallback.data as any;
    error = fallback.error;
  }

  if (error || !data) {
    throw new AppError("Unable to create product", 500);
  }

  await syncProductAllergens(data.id, body.allergenIds);

  return mapProduct(data as ProductRow);
}

export async function updateProductForAdmin(
  productId: string,
  body: UpdateProductBody
): Promise<Record<string, unknown>> {
  const payload: Record<string, unknown> = {};

  if (body.name !== undefined) {
    payload.name = body.name;
  }

  if (body.description !== undefined) {
    payload.description = body.description;
  }

  if (body.imageUrl !== undefined) {
    payload.image_url = body.imageUrl;
  }

  if (body.productInfo !== undefined) {
    payload.product_info = body.productInfo;
  }

  if (body.price !== undefined) {
    payload.price = body.price;
  }

  if (body.isActive !== undefined) {
    payload.is_active = body.isActive;
  }

  if (Object.keys(payload).length === 0 && body.allergenIds === undefined) {
    throw new AppError("No product fields to update", 400);
  }

  let updatedProduct: ProductRow | null = null;

  if (Object.keys(payload).length > 0) {
    let { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", productId)
    .select("id, name, description, image_url, product_info, price, is_active, created_at")
    .single();

    if (error && isMissingProductInfoColumns(error)) {
      delete payload.image_url;
      delete payload.product_info;
      const fallback = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId)
        .select("id, name, description, price, is_active, created_at")
        .single();
      data = fallback.data as any;
      error = fallback.error;
    }

    if (error || !data) {
      throw new AppError("Unable to update product", 500);
    }

    updatedProduct = data as ProductRow;
  }

  await syncProductAllergens(productId, body.allergenIds);

  let { data: fresh, error: freshError } = await supabase
    .from("products")
    .select(PRODUCT_SELECT_WITH_DETAILS)
    .eq("id", productId)
    .single();

  if (freshError && isMissingProductInfoColumns(freshError)) {
    const fallback = await supabase
      .from("products")
      .select(PRODUCT_SELECT_LEGACY)
      .eq("id", productId)
      .single();
    fresh = fallback.data as any;
    freshError = fallback.error;
  }

  if (freshError || !fresh) {
    if (updatedProduct) return mapProduct(updatedProduct);
    throw new AppError("Unable to update product", 500);
  }

  return mapProduct(fresh as unknown as ProductRow);
}
