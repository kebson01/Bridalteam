import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * Single-admin gate for the /admin API. Checks the shared ADMIN_PASSWORD sent in
 * the `x-admin-password` header, then returns a service-role Supabase client for
 * privileged reads/writes. Returns a NextResponse (error) when not authorized —
 * callers do `if (client instanceof NextResponse) return client;`.
 */
export function adminGuard(req: Request): SupabaseClient | NextResponse {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) {
    return NextResponse.json(
      { error: "Admin isn't configured. Set ADMIN_PASSWORD and SUPABASE_SERVICE_ROLE_KEY." },
      { status: 503 },
    );
  }
  const provided = req.headers.get("x-admin-password");
  if (provided !== configured) {
    return NextResponse.json({ error: "Incorrect admin password." }, { status: 401 });
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
