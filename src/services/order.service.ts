// Reexportar addItemToOrder para mantener consistencia de imports
export { addItemToOrder } from "./add-item.service";
import { supabase } from "../config/supabase";
import { AppError } from "../errors/app-error";
import { AuthUser, OrderShift, OrderStatus } from "../types/domain";
import { CreateOrderInput, createOrderSchema } from "../validators/order.validator";
import { ListOrdersQuery } from "../validators/order.validator";
import { getOrderSchedule } from "./settings.service";
import { roundMoney } from "../utils/money";
import { buildCancellationDeadline } from "../utils/schedule";

interface ProductRow {
  id: string;
  price: number;
}

interface WalletRow {
  wallet_balance: number;
}

interface OrderRow {
  id: string;
  user_id: string;
  status: "PENDING" | "IN_PREPARATION" | "READY" | "DELIVERED" | "CANCELLED";
  total: number;
  cancellation_deadline: string;
  credited_to_wallet: boolean;
}

type ManageTargetStatus = Extract<OrderStatus, "IN_PREPARATION" | "DELIVERED" | "CANCELLED">;

interface ListOrderRow {
  id: string;
  user_id: string;
  shift: OrderShift;
  scheduled_for: string;
  status: OrderStatus;
  total: number;
  credited_to_wallet: boolean;
  created_at: string;
}

interface ListUserRow {
  id: string;
  full_name: string | null;
}

interface ListOrderItemRow {
  order_id: string;
  quantity: number;
  product: { name: string | null }[] | { name: string | null } | null;
}

interface OrderDetailItemRow {
  quantity: number;
  unit_price: number;
  line_total: number;
  customization_json: string[] | null;
  kitchen_note: string | null;
  product:
    | {
        id: string;
        name: string;
        description: string | null;
      }[]
    | {
        id: string;
        name: string;
        description: string | null;
      }
    | null;
}

interface OrderDetailRow {
  id: string;
  user_id: string;
  shift: OrderShift;
  scheduled_for: string;
  status: OrderStatus;
  subtotal: number;
  total: number;
  cancellation_deadline: string;
  credited_to_wallet: boolean;
  created_at: string;
  order_items: OrderDetailItemRow[];
}

export async function createOrder(user: AuthUser, payload: unknown): Promise<Record<string, unknown>> {
  const data: CreateOrderInput = createOrderSchema.parse(payload);

  const productIds = data.items.map((item) => item.productId);

  const [{ data: products, error: productsError }, { data: userAllergies, error: allergyError }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, price, is_active")
        .in("id", productIds),
      supabase.from("user_allergies").select("allergen_id").eq("user_id", user.id)
    ]);

  if (productsError || allergyError) {
    throw new AppError("Unable to load products or user allergies", 500);
  }

  const productMap = new Map((products as ProductRow[]).map((p) => [p.id, p]));
  const missingProducts = productIds.filter((id) => !productMap.has(id));

  if (missingProducts.length > 0) {
    throw new AppError("One or more products do not exist", 404);
  }

  const hasInactiveProduct = (products as (ProductRow & { is_active: boolean })[]).some((p) => !p.is_active);

  if (hasInactiveProduct) {
    throw new AppError("One or more selected products are inactive", 409);
  }

  const { data: productAllergens, error: productAllergensError } = await supabase
    .from("product_allergens")
    .select("product_id, allergen_id")
    .in("product_id", productIds);

  if (productAllergensError) {
    throw new AppError("Unable to validate allergens", 500);
  }

  const userAllergenSet = new Set((userAllergies ?? []).map((row) => row.allergen_id));
  const allergicConflict = (productAllergens ?? []).some((link) => userAllergenSet.has(link.allergen_id));

  if (allergicConflict && !data.acknowledgedAllergenWarning) {
    throw new AppError("Order rejected: selected products contain allergens in your profile", 409);
  }

  const orderItems = data.items.map((item) => {
    const product = productMap.get(item.productId);

    if (!product) {
      throw new AppError("One or more products do not exist", 404);
    }

    const effectiveUnitPrice = product.price;
    const unitPrice = roundMoney(effectiveUnitPrice);
    const lineTotal = roundMoney(unitPrice * item.quantity);
    const customizations = [...new Set((item.customizations ?? []).map((value) => value.trim()).filter(Boolean))];
    const kitchenNote = item.kitchenNote?.trim() || null;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      lineTotal,
      customizations,
      kitchenNote
    };
  });

  const subtotal = roundMoney(orderItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const total = subtotal;

  let debitedWallet = false;

  if (total > 0) {
    const { data: wallet, error: walletError } = await supabase
      .from("users")
      .select("wallet_balance")
      .eq("id", user.id)
      .single();

    if (walletError || !wallet) {
      throw new AppError("Unable to load wallet balance", 500);
    }

    const currentBalance = roundMoney(Number((wallet as WalletRow).wallet_balance ?? 0));

    if (currentBalance < total) {
      throw new AppError("Saldo insuficiente en el monedero", 409);
    }

    const nextBalance = roundMoney(currentBalance - total);
    const { data: updatedWallet, error: debitError } = await supabase
      .from("users")
      .update({ wallet_balance: nextBalance })
      .eq("id", user.id)
      .eq("wallet_balance", currentBalance)
      .select("id")
      .maybeSingle();

    if (debitError) {
      throw new AppError("Unable to debit wallet", 500);
    }

    if (!updatedWallet) {
      throw new AppError("El saldo ha cambiado. Revisa el monedero e inténtalo de nuevo.", 409);
    }

    debitedWallet = true;
  }

  const schedule = await getOrderSchedule();
  const shiftScheduleMap: Record<OrderShift, { hour: number; minute: number }> = {
    MORNING: schedule.morning,
    AFTERNOON: schedule.afternoon,
    NIGHT: schedule.night
  };
  const cutoff = shiftScheduleMap[data.shift];
  const cancellationDeadline = buildCancellationDeadline(
    data.scheduledFor,
    data.shift,
    cutoff.hour,
    cutoff.minute,
    schedule.graceMinutes
  );

  const { data: insertedOrder, error: orderInsertError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      placed_by_user_id: user.id,
      shift: data.shift,
      scheduled_for: data.scheduledFor,
      status: "PENDING",
      subtotal,
      total,
      cancellation_deadline: cancellationDeadline
    })
    .select("id, user_id, shift, scheduled_for, status, subtotal, total, cancellation_deadline, created_at")
    .single();

  if (orderInsertError || !insertedOrder) {
    if (debitedWallet) {
      await refundWallet(user.id, total);
    }
    throw new AppError("Unable to persist order", 500);
  }

  const { error: itemsInsertError } = await supabase.from("order_items").insert(
    orderItems.map((item) => ({
      order_id: insertedOrder.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      line_total: item.lineTotal,
      // Temporarily omit customization_json and kitchen_note if they're causing schema cache issues
      ...(item.customizations.length > 0 && { customization_json: item.customizations }),
      ...(item.kitchenNote && { kitchen_note: item.kitchenNote })
    }))
  );

  if (itemsInsertError) {
    console.error("❌ Order items insert error:", {
      error: itemsInsertError,
      message: itemsInsertError?.message,
      details: itemsInsertError?.details,
      hint: itemsInsertError?.hint,
      code: itemsInsertError?.code
    });
    await supabase.from("orders").delete().eq("id", insertedOrder.id);
    if (debitedWallet) {
      await refundWallet(user.id, total);
    }
    throw new AppError(
      `Unable to persist order items: ${itemsInsertError?.message || "Unknown error"}`,
      500
    );
  }

  return {
    id: insertedOrder.id,
    userId: insertedOrder.user_id,
    shift: insertedOrder.shift,
    scheduledFor: insertedOrder.scheduled_for,
    status: insertedOrder.status,
    cancellationDeadline: insertedOrder.cancellation_deadline,
    subtotal,
    total,
    items: orderItems
  };
}

async function refundWallet(userId: string, amount: number): Promise<void> {
  if (amount <= 0) return;

  const { data: wallet } = await supabase
    .from("users")
    .select("wallet_balance")
    .eq("id", userId)
    .single();

  if (!wallet) return;

  const currentBalance = roundMoney(Number((wallet as WalletRow).wallet_balance ?? 0));
  await supabase
    .from("users")
    .update({ wallet_balance: roundMoney(currentBalance + amount) })
    .eq("id", userId);
}

export async function cancelOrder(user: AuthUser, orderId: string): Promise<Record<string, unknown>> {
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new AppError("Only admin/staff can cancel orders", 403);
  }
  const { data, error } = await supabase.rpc("cancel_order_atomic", {
    p_order_id: orderId,
    p_actor_user_id: user.id,
    p_actor_role: user.role
  });
  if (error) {
    if (error.message.includes("ORDER_NOT_FOUND")) {
      throw new AppError("Order not found", 404);
    }
    if (error.message.includes("FORBIDDEN")) {
      throw new AppError("You are not allowed to cancel this order", 403);
    }
    if (error.message.includes("ALREADY_CANCELLED")) {
      throw new AppError("Order is already cancelled", 409);
    }
    if (error.message.includes("INVALID_STATUS")) {
      throw new AppError("Order cannot be cancelled in current state", 409);
    }
    throw new AppError("Unable to cancel order", 500);
  }
  const result = (data as { order_id: string; status: string; credited_to_wallet: boolean }[] | null)?.[0];
  if (!result) {
    throw new AppError("Unable to cancel order", 500);
  }
  return {
    id: result.order_id,
    status: result.status,
    creditedToWallet: result.credited_to_wallet
  };
}

export async function listOrders(user: AuthUser, query: ListOrdersQuery): Promise<Record<string, unknown>> {
  let statement = supabase
    .from("orders")
    .select("id, user_id, shift, scheduled_for, status, total, credited_to_wallet, created_at")
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

  const canViewAll = user.role === "ADMIN" || user.role === "STAFF";

  if (!canViewAll) {
    statement = statement.eq("user_id", user.id);
  }

  const { data, error } = await statement;

  if (error) {
    throw new AppError(`Unable to list orders: ${error.message}`, 500);
  }

  const rows = (data ?? []) as ListOrderRow[];
  const orderIds = rows.map((row) => row.id);
  const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];

  const [usersResult, itemsResult] = await Promise.all([
    userIds.length > 0
      ? supabase.from("users").select("id, full_name").in("id", userIds)
      : Promise.resolve({ data: [], error: null }),
    orderIds.length > 0
      ? supabase.from("order_items").select("order_id, quantity, product:products(name)").in("order_id", orderIds)
      : Promise.resolve({ data: [], error: null })
  ]);

  if (usersResult.error) {
    throw new AppError(`Unable to list orders: ${usersResult.error.message}`, 500);
  }

  if (itemsResult.error) {
    throw new AppError(`Unable to list orders: ${itemsResult.error.message}`, 500);
  }

  const usersRows = (usersResult.data ?? []) as ListUserRow[];
  const orderItemsRows = (itemsResult.data ?? []) as ListOrderItemRow[];
  const userNameById = new Map(usersRows.map((entry) => [entry.id, entry.full_name || "Alumno"]));
  const itemsByOrderId = new Map<string, ListOrderItemRow[]>();

  orderItemsRows.forEach((entry) => {
    const group = itemsByOrderId.get(entry.order_id) || [];
    group.push(entry);
    itemsByOrderId.set(entry.order_id, group);
  });

  return {
    data: rows.map((row) => ({
      studentName: userNameById.get(row.user_id) || "Alumno",
      productSummary: (itemsByOrderId.get(row.id) || [])
        .map((item) => {
          const qty = Number(item.quantity || 1);
          const name = Array.isArray(item.product)
            ? item.product?.[0]?.name || "Producto"
            : item.product?.name || "Producto";
          return `${qty}x ${name}`;
        })
        .join(" · "),
      id: row.id,
      userId: row.user_id,
      shift: row.shift,
      scheduledFor: row.scheduled_for,
      status: row.status,
      total: row.total,
      creditedToWallet: row.credited_to_wallet,
      createdAt: row.created_at
    }))
  };
}

export async function getOrderDetail(user: AuthUser, orderId: string): Promise<Record<string, unknown>> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, shift, scheduled_for, status, subtotal, total, cancellation_deadline, credited_to_wallet, created_at, order_items(quantity, unit_price, line_total, customization_json, kitchen_note, product:products(id, name, description))"
    )
    .eq("id", orderId)
    .single();

  if (error || !data) {
    throw new AppError("Order not found", 404);
  }

  const order = data as OrderDetailRow;
  const canViewAll = user.role === "ADMIN" || user.role === "STAFF";

  if (!canViewAll && order.user_id !== user.id) {
    throw new AppError("You are not allowed to view this order", 403);
  }

  return {
    id: order.id,
    userId: order.user_id,
    shift: order.shift,
    scheduledFor: order.scheduled_for,
    status: order.status,
    subtotal: order.subtotal,
    total: order.total,
    cancellationDeadline: order.cancellation_deadline,
    creditedToWallet: order.credited_to_wallet,
    createdAt: order.created_at,
    items: (order.order_items ?? []).map((item) => ({
      productId: Array.isArray(item.product) ? item.product?.[0]?.id ?? null : item.product?.id ?? null,
      name: Array.isArray(item.product) ? item.product?.[0]?.name ?? null : item.product?.name ?? null,
      description: Array.isArray(item.product)
        ? item.product?.[0]?.description ?? null
        : item.product?.description ?? null,
      quantity: item.quantity,
      unitPrice: item.unit_price,
      lineTotal: item.line_total,
      customizations: item.customization_json ?? [],
      kitchenNote: item.kitchen_note
    }))
  };
}

export async function updateOrderStatus(
  user: AuthUser,
  orderId: string,
  targetStatus: ManageTargetStatus
): Promise<Record<string, unknown>> {
  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    throw new AppError("Only admin/staff can manage order status", 403);
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new AppError("Order not found", 404);
  }

  const currentStatus = order.status as OrderStatus;
  const allowedTransitions: Record<OrderStatus, ManageTargetStatus[]> = {
    PENDING: ["IN_PREPARATION", "CANCELLED"],
    IN_PREPARATION: ["DELIVERED", "CANCELLED"],
    READY: ["DELIVERED", "CANCELLED"],
    DELIVERED: [],
    CANCELLED: []
  };

  if (!allowedTransitions[currentStatus]?.includes(targetStatus)) {
    throw new AppError(`Invalid status transition: ${currentStatus} -> ${targetStatus}`, 409);
  }

  const { data: updatedOrder, error: updateError } = await supabase
    .from("orders")
    .update({ status: targetStatus })
    .eq("id", orderId)
    .select("id, status")
    .single();

  if (updateError || !updatedOrder) {
    throw new AppError("Unable to update order status", 500);
  }

  return {
    id: updatedOrder.id,
    status: updatedOrder.status
  };
}
