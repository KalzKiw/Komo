import { supabase } from "../config/supabase";
import { AppError } from "../errors/app-error";
import { AuthUser } from "../types/domain";

export async function addItemToOrder(user: AuthUser, orderId: string, item: any): Promise<Record<string, unknown>> {
  // Solo permitir si el usuario es dueño del pedido o es ADMIN/STAFF
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, user_id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw new AppError("Order not found", 404);
  }
  if (order.status !== "PENDING") {
    throw new AppError("Only PENDING orders can be modified", 409);
  }
  if (user.role !== "ADMIN" && user.role !== "STAFF" && order.user_id !== user.id) {
    throw new AppError("Forbidden", 403);
  }
  // Insertar el nuevo ítem
  const { error: insertError } = await supabase.from("order_items").insert({
    order_id: orderId,
    product_id: item.productId,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    line_total: item.lineTotal,
    customization_json: item.customizations,
    kitchen_note: item.kitchenNote || null
  });
  if (insertError) {
    throw new AppError("Unable to add item to order", 500);
  }
  return { success: true };
}
