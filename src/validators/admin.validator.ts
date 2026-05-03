import { z } from "zod";

export const assignDelegateParamsSchema = z.object({
  studentId: z.string().uuid()
});

export const assignDelegateBodySchema = z.object({
  isDelegate: z.boolean()
});

export type AssignDelegateBody = z.infer<typeof assignDelegateBodySchema>;

const productNutritionSchema = z.object({
  kcal: z.coerce.number().min(0).optional(),
  grasas: z.coerce.number().min(0).optional(),
  hidratos: z.coerce.number().min(0).optional(),
  azucares: z.coerce.number().min(0).optional(),
  proteinas: z.coerce.number().min(0).optional(),
  sal: z.coerce.number().min(0).optional()
});

const productInfoSchema = z.object({
  ingredientes: z.array(z.string().min(1)).default([]),
  alergenos: z.array(z.string().min(1)).default([]),
  trazas: z.array(z.string().min(1)).default([]),
  informacionNutricional: productNutritionSchema.default({}),
  conservacion: z.string().max(500).optional(),
  caducidad: z.string().max(500).optional(),
  fuente: z.array(z.string().min(1)).default([])
}).optional();

export const createProductBodySchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(500).optional(),
  imageUrl: z.string().url().max(1000).nullable().optional(),
  productInfo: productInfoSchema,
  allergenIds: z.array(z.string().uuid()).optional(),
  price: z.coerce.number().min(0),
  isActive: z.boolean().default(true)
});

export const updateProductParamsSchema = z.object({
  productId: z.string().uuid()
});

export const updateProductBodySchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(500).nullable().optional(),
  imageUrl: z.string().url().max(1000).nullable().optional(),
  productInfo: productInfoSchema.nullable(),
  allergenIds: z.array(z.string().uuid()).optional(),
  price: z.coerce.number().min(0).optional(),
  isActive: z.boolean().optional()
});

export type CreateProductBody = z.infer<typeof createProductBodySchema>;
export type UpdateProductBody = z.infer<typeof updateProductBodySchema>;
