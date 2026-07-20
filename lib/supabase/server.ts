import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

/**
 * Request-scoped Supabase client for Server Components, Route Handlers and
 * Server Actions. Reads and refreshes the auth session from cookies, so every
 * query runs as the signed-in user and is subject to RLS.
 *
 * Never use `supabaseAdmin()` to serve user data — it bypasses RLS, which is
 * the only thing keeping one couple's wedding out of another's hands.
 */
export async function supabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Components can't set cookies. Harmless: middleware refreshes
          // the session on every request, so the tokens stay current.
        }
      },
    },
  });
}

/** The signed-in user, or null. */
export async function currentUser() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
