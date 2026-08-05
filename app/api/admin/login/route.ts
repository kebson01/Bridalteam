import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import {
  adminClientIp,
  adminConfigured,
  createAdminSession,
  isLockedOut,
  recordAttempt,
  verifyAdminCredentials,
  ADMIN_COOKIE,
} from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin login. Verifies credentials, rate-limits by IP to stop online
 * brute-force, and on success sets a short-lived httpOnly session cookie — so
 * the raw password never has to be stored in the browser.
 */
export async function POST(req: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Admin isn't configured on the server." },
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

  const ip = adminClientIp(req);
  if (await isLockedOut(admin, ip)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a few minutes." },
      { status: 429 },
    );
  }

  let body: { username?: unknown; password?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";

  const matchedUser = verifyAdminCredentials(username, password);
  if (matchedUser === null) {
    await recordAttempt(admin, ip, false);
    return NextResponse.json({ error: "Incorrect username or password." }, { status: 401 });
  }

  const session = await createAdminSession(admin, matchedUser);
  if (!session) {
    return NextResponse.json({ error: "Couldn't start a session." }, { status: 500 });
  }
  await recordAttempt(admin, ip, true);

  const res = NextResponse.json({ ok: true, username: matchedUser });
  res.cookies.set(ADMIN_COOKIE, session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: session.maxAgeSeconds,
  });
  return res;
}
