import { NextResponse } from "next/server";
import { adminGuard, adminUsername } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Is the admin signed in? The /admin layout asks once on load to choose
 * between the sign-in card and the admin app; 401 means "show sign-in".
 */
export async function GET(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json({ ok: true, username: await adminUsername(admin, req) });
}
