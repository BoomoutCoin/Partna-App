/**
 * Supabase clients.
 *
 *   - `supabaseAdmin`: SERVICE ROLE key, bypasses RLS. NEVER exposed to
 *     request-level user code unless the route has explicit admin intent
 *     (webhooks, system-level writes).
 *   - `supabaseAnon`: anon key. Safe for RLS-respecting reads.
 *
 * Both clients are created once per process and reused.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isProd } from "./config.js";

const commonOptions = {
  auth: {
    // API issues its own JWTs; we don't use Supabase Auth session storage.
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      "x-client-info": "partna-api",
    },
  },
} as const;

export const supabaseAdmin: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  commonOptions,
);

export const supabaseAnon: SupabaseClient = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_ANON_KEY,
  commonOptions,
);

if (!isProd) {
  // eslint-disable-next-line no-console
  console.info(`[db] Supabase clients initialised (${env.SUPABASE_URL})`);
}
