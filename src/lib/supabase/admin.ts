import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the SECRET key.
 * Bypasses RLS. Use only in server routes / scripts — never ship to the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
