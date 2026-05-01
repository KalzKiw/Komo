import { z } from "zod";

export const createOrderSchema = z.object({
  shift: z.enum(["MORNING", "AFTERNOON", "NIGHT"]),
  scheduledFor: z.string().date(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
        customizations: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
        kitchenNote: z.string().trim().max(280).optional()
      })
    )
    .min(1),
  acknowledgedAllergenWarning: z.boolean().optional().default(false)
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const cancelOrderParamsSchema = z.object({
  orderId: z.string().uuid()
});

export type CancelOrderParams = z.infer<typeof cancelOrderParamsSchema>;

export const getOrderDetailParamsSchema = z.object({
  orderId: z.string().uuid()
});

export type GetOrderDetailParams = z.infer<typeof getOrderDetailParamsSchema>;

export const updateOrderStatusParamsSchema = z.object({
  orderId: z.string().uuid()
});

export const updateOrderStatusBodySchema = z.object({
  status: z.enum(["IN_PREPARATION", "DELIVERED", "CANCELLED"])
});

export type UpdateOrderStatusParams = z.infer<typeof updateOrderStatusParamsSchema>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;

export const listOrdersQuerySchema = z.object({
  scheduledFor: z.string().date().optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "NIGHT"]).optional(),
  status: z.enum(["PENDING", "IN_PREPARATION", "READY", "DELIVERED", "CANCELLED"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
