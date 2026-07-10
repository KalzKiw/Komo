import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  BYPASS_ORDER_CUTOFF: z.enum(["true", "false"]).default("false"),
  DEMO_MODE: z.enum(["true", "false"]).default("false"),
  PRINTER_HOST: z.string().min(1).default("192.168.30.10"),
  PRINTER_PORT: z.coerce.number().int().positive().default(9100),
  PRINT_WORKER_ENABLED: z.enum(["true", "false"]).default("false"),
  PRINT_WORKER_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
  PRINT_WORKER_IGNORE_BEFORE: z.string().datetime().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
