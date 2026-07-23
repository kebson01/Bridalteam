import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Single-admin gate for the /admin API. Validates the credentials sent in the
 * `x-admin-user` / `x-admin-password` headers against ADMIN_USERNAME /
 * ADMIN_PASSWORD, then returns a service-role Supabase client for privileged
 * reads/writes. Returns a NextResponse (error) when not authorized — callers do
 * `if (client instanceof NextResponse) return client;`.
 *
 * ADMIN_USERNAME is optional: if it isn't set, only the password is checked
 * (backward compatible). If it is set, both must match.
 */
export function adminGuard(req: Request): SupabaseClient | NextResponse {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json(
      {
        error:
          "Admin isn't configured. Set ADMIN_PASSWORD (and optionally ADMIN_USERNAME) plus SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }
  const username = process.env.ADMIN_USERNAME; // optional
  const passwordOk = req.headers.get("x-admin-password") === password;
  const usernameOk = !username || req.headers.get("x-admin-user") === username;
  if (!passwordOk || !usernameOk) {
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }
  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server." },
      { status: 503 },
    );
  }
  return admin;
}
