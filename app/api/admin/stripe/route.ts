import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-auth";
import { stripeStatus } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Stripe readiness: key mode, webhook secret, and whether each price resolves. */
export async function GET(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;
  return NextResponse.json(await stripeStatus());
}
