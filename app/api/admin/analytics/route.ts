import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = [1, 7, 30, 90, 365];

/**
 * Data for /admin/analytics: everything comes from public.analytics_summary()
 * (supabase/migrations/20261102120000_page_events_visits.sql), which does the
 * counting in the database and returns one JSON document.
 *
 *   ?days=1|7|30|90|365   window, default 30
 *   ?scope=public|all     website pages only (default), or website plus the signed-in app
 */
export async function GET(req: Request) {
  const admin = await adminGuard(req);
  if (admin instanceof NextResponse) return admin;

  const params = new URL(req.url).searchParams;
  const requested = Number.parseInt(params.get("days") ?? "30", 10);
  const days = DAYS.includes(requested) ? requested : 30;
  const scope = params.get("scope") === "all" ? "all" : "public";

  const { data, error } = await admin.rpc("analytics_summary", { p_days: days, p_scope: scope, p_tz: "America/New_York" });
  if (error) {
    console.error("analytics_summary failed:", error.code, error.message);
    return NextResponse.json({ error: "Couldn't load analytics." }, { status: 500 });
  }
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
