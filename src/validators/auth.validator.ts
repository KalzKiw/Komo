import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3),
  role: z.enum(["STUDENT", "PARENT"]),
  password: z.string().min(6),
  allergenIds: z.array(z.string()).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
