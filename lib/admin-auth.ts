import { NextResponse } from "next/server";
import { timingSafeEqual, randomBytes, createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { clientIp } from "@/lib/ai-quota";

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

/** True when at least one admin credential is configured. */
export function adminConfigured(): boolean {
  return validCredentials().length > 0;
}

/**
 * Verifies a username/password against the configured admins (constant-time).
 * Returns the matched username (or "" for the single-password admin) on success,
 * or null on failure.
 */
export function verifyAdminCredentials(user: string, password: string): string | null {
  const creds = validCredentials();
  for (const c of creds) {
    if (safeEqual(c.password, password) && (c.username === null || c.username === user)) {
      return c.username ?? "";
    }
  }
  return null;
}

// ---- Sessions (httpOnly cookie) --------------------------------------------

export const ADMIN_COOKIE = "bt_admin_session";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

/**
 * Creates a server-side admin session and returns the raw token to set as an
 * httpOnly cookie. Only the token's hash is stored, so the DB never holds a
 * usable cookie value.
 */
export async function createAdminSession(
  admin: SupabaseClient,
  username: string,
): Promise<{ token: string; maxAgeSeconds: number } | null> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const { error } = await admin.from("admin_sessions").insert({
    token_hash: sha256(token),
    username: username || null,
    expires_at: expiresAt.toISOString(),
  });
  if (error) {
    console.error("admin session insert failed:", error.code, error.message);
    return null;
  }
  return { token, maxAgeSeconds: Math.floor(SESSION_TTL_MS / 1000) };
}

/** Reads the admin session cookie from the request, if present. */
function sessionTokenFromRequest(req: Request): string | null {
  const cookie = req.headers.get("cookie");
  if (!cookie) return null;
  for (const part of cookie.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_COOKIE) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/** True when the request carries a valid, unexpired admin session cookie. */
async function hasValidSession(admin: SupabaseClient, req: Request): Promise<boolean> {
  const token = sessionTokenFromRequest(req);
  if (!token) return false;
  const { data } = await admin
    .from("admin_sessions")
    .select("expires_at")
    .eq("token_hash", sha256(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return Boolean(data);
}

/** Deletes the session for the request's cookie, if any (used by logout). */
export async function destroyAdminSession(admin: SupabaseClient, req: Request): Promise<void> {
  const token = sessionTokenFromRequest(req);
  if (!token) return;
  await admin.from("admin_sessions").delete().eq("token_hash", sha256(token));
}

// ---- Rate limiting (online brute-force lockout) ----------------------------

const MAX_FAILED_ATTEMPTS = 8;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/** True if this IP has too many recent failed attempts and should be locked out. */
export async function isLockedOut(admin: SupabaseClient, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
  const { count } = await admin
    .from("admin_login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("ip", ip)
    .eq("ok", false)
    .gt("created_at", since);
  return (count ?? 0) >= MAX_FAILED_ATTEMPTS;
}

/** Records an admin credential attempt for rate-limiting. Best-effort. */
export async function recordAttempt(admin: SupabaseClient, ip: string, ok: boolean): Promise<void> {
  const { error } = await admin.from("admin_login_attempts").insert({ ip, ok });
  if (error) console.error("admin attempt log failed:", error.code, error.message);
}

/** The trusted client IP for admin rate-limiting (same source as AI metering). */
export function adminClientIp(req: Request): string {
  return clientIp(req);
}

// ---- Guard -----------------------------------------------------------------

/**
 * Admin gate for the /admin API. Authorizes a request by EITHER:
 *   1. a valid httpOnly session cookie (set by POST /api/admin/login), or
 *   2. the legacy `x-admin-user` / `x-admin-password` headers (kept for
 *      backward compatibility / programmatic clients) — this path is
 *      rate-limited per IP to stop online brute-force.
 * On success returns a service-role Supabase client; otherwise a NextResponse
 * error, so callers do `if (client instanceof NextResponse) return client;`.
 *
 * Async (hits the DB for the session / rate-limit checks) — callers must await.
 */
export async function adminGuard(req: Request): Promise<SupabaseClient | NextResponse> {
  if (!adminConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin isn't configured. Set ADMIN_PASSWORD (and optionally ADMIN_USERNAME), or ADMIN_USERS, plus SUPABASE_SERVICE_ROLE_KEY.",
      },
      { status: 503 },
    );
  }

  const admin = supabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not set on the server." },
      { status: 503 },
    );
  }

  // 1) Cookie session — the preferred path (no password in the browser).
  if (await hasValidSession(admin, req)) return admin;

  // 2) Legacy header credentials, rate-limited.
  const providedUser = req.headers.get("x-admin-user") ?? "";
  const providedPassword = req.headers.get("x-admin-password") ?? "";
  // No credentials at all (e.g. the login page's initial load) → unauthorized
  // without touching the DB for a rate-limit check.
  if (!providedPassword) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const ip = adminClientIp(req);
  if (await isLockedOut(admin, ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  if (verifyAdminCredentials(providedUser, providedPassword) === null) {
    await recordAttempt(admin, ip, false);
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  return admin;
}
