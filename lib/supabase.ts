import { createClient } from "@supabase/supabase-js";

/*
  These are the PUBLIC Bridal Team Supabase credentials. The publishable
  (anon) key is designed to be exposed in client/server code — all access is
  guarded by row-level security (public read only). Env vars override them so
  you can point at a different project without touching code.
*/
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://yubcwyfhgxjnqydhgjit.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_WHCmykSyWQunFvmTG8FDvA_JCq56kTf";

export interface Venue {
  id: string;
  name: string;
  category: string;
  city: string | null;
  state: string | null;
  price: string | null;
  capacity: number | null;
  tag: string | null;
  description: string | null;
  image_url: string | null;
  website: string | null;
  featured: boolean;
  created_at: string;
}

/** Public client — read-only access to the venues directory. */
export function supabasePublic() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Server-only admin client using the service-role key (bypasses RLS).
 * Returns null when SUPABASE_SERVICE_ROLE_KEY isn't set, so callers can
 * fail gracefully. NEVER import this into client components.
 */
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return null;
  return createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
  });
}
