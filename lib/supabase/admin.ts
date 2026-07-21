import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/supabase";

/**
 * Service-role Supabase client — bypasses RLS. Server-only, and ONLY for trusted
 * contexts with no user session, like the Stripe webhook (which is authenticated
 * by Stripe's signature instead). Returns null if the key isn't configured.
 *
 * Never import this into anything that serves user requests directly.
 */
export function supabaseAdmin(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}
