import { z } from "zod";

export const assignDelegateParamsSchema = z.object({
  studentId: z.string().uuid()
});

export const assignDelegateBodySchema = z.object({
  isDelegate: z.boolean()
});

export type AssignDelegateBody = z.infer<typeof assignDelegateBodySchema>;

export const createProductBodySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  price: z.coerce.number().min(0),
  isActive: z.boolean().default(true)
});

export const updateProductParamsSchema = z.object({
  productId: z.string().uuid()
});

export const updateProductBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  price: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional()
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
