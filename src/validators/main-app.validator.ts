import { z } from "zod";

export const listProductsQuerySchema = z.object({
  officialMenuOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

export const listMyOrdersQuerySchema = z.object({
  scheduledFor: z.string().date().optional(),
  shift: z.enum(["MORNING", "AFTERNOON", "NIGHT"]).optional(),
  status: z.enum(["PENDING", "IN_PREPARATION", "READY", "DELIVERED", "CANCELLED"]).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional()
});

export type ListMyOrdersQuery = z.infer<typeof listMyOrdersQuerySchema>;

export const updateMyProfileBodySchema = z.object({
  phone: z.string().max(40).nullable().optional(),
  paymentCardLast4: z.string().regex(/^\d{4}$/).nullable().optional()
});

export const topUpMyWalletBodySchema = z.object({
  amount: z.coerce.number().min(0.01).max(200)
});

export type UpdateMyProfileBody = z.infer<typeof updateMyProfileBodySchema>;
