import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { destroyAdminSession, ADMIN_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Ends the admin session: deletes it server-side and clears the cookie. */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (admin) await destroyAdminSession(admin, req);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });
  return res;
}
