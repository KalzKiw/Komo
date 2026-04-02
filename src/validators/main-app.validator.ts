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
