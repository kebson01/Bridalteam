import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

/** Constant-time string comparison, so password checks don't leak length/content via timing. */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Still do a comparison of equal-length buffers to avoid an early-exit timing signal.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

type Credential = { username: string | null; password: string };

/**
 * The set of valid admin credentials, from two sources (either or both):
 *   1. ADMIN_USERNAME / ADMIN_PASSWORD — a single admin. ADMIN_USERNAME is
 *      optional; if unset, only the password is checked (backward compatible).
 *   2. ADMIN_USERS — multiple admins, as "username:password" pairs separated by
 *      commas or newlines, e.g. "alice:pw1, bob:pw2". Username is required here;
 *      the password is everything after the first colon (so passwords may
 *      contain colons, but avoid commas/newlines).
 */
function validCredentials(): Credential[] {
  const creds: Credential[] = [];

  const singlePassword = process.env.ADMIN_PASSWORD;
  if (singlePassword) {
    creds.push({ username: process.env.ADMIN_USERNAME ?? null, password: singlePassword });
  }

  const list = process.env.ADMIN_USERS;
  if (list) {
    for (const entry of list.split(/[,\n]/)) {
      const trimmed = entry.trim();
      if (!trimmed) continue;
      const colon = trimmed.indexOf(":");
      if (colon === -1) continue;
      const username = trimmed.slice(0, colon).trim();
      const password = trimmed.slice(colon + 1);
      if (username && password) creds.push({ username, password });
    }
  }

  return creds;
}

/**
 * Admin gate for the /admin API. Validates the credentials sent in the
 * `x-admin-user` / `x-admin-password` headers against the configured admins,
 * then returns a service-role Supabase client for privileged reads/writes.
 * Returns a NextResponse (error) when not authorized — callers do
 * `if (client instanceof NextResponse) return client;`.
 */
export function adminGuard(req: Request): SupabaseClient | NextResponse {
  const creds = validCredentials();
  if (creds.length === 0) {
    return NextResponse.json(
      {
        error:
          "Admin isn't configured. Set ADMIN_PASSWORD (and optionally ADMIN_USERNAME), or ADMIN_USERS, plus SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const providedUser = req.headers.get("x-admin-user") ?? "";
  const providedPassword = req.headers.get("x-admin-password") ?? "";
  const ok = creds.some(
    (c) => safeEqual(c.password, providedPassword) && (c.username === null || c.username === providedUser),
  );
  if (!ok) {
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
