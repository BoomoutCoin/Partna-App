/**
 * Validated environment variables.
 *
 * Fails fast at boot if anything required is missing. Import the `env` object
 * everywhere else in the codebase; never reach for `process.env` directly.
 */

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  HOST: z.string().default("0.0.0.0"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  // ---------- Supabase ----------
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(10),
  /** Server-only. Never ship in client bundles. Bypasses RLS. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(10),

  // ---------- Auth ----------
  /** 256-bit random string used to sign API JWTs. */
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 chars (256 bits)"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  // ---------- Webhooks ----------
  ALCHEMY_WEBHOOK_SECRET: z.string().min(8).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(8).optional(),

  // ---------- Stripe ----------
  STRIPE_SECRET_KEY: z.string().min(8).optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),

  // ---------- Expo push ----------
  EXPO_ACCESS_TOKEN: z.string().optional(),

  // ---------- Misc ----------
  REDIS_URL: z.string().url().optional(),
  ADMIN_JWT_SECRET: z.string().min(32).optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // Collapse issues to readable lines, write to stderr, exit non-zero.
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    // eslint-disable-next-line no-console
    console.error(`[config] Invalid environment:\n${issues}`);
    process.exit(1);
  }
  return parsed.data;
}

export const env: Env = loadEnv();

export const isProd = env.NODE_ENV === "production";
export const isDev = env.NODE_ENV === "development";
export const isTest = env.NODE_ENV === "test";
