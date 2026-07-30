import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a vendor profile view. Written with the service role because
 * vendor_events has no public insert policy (visitors must not be able to read
 * or forge each other's stats). Best-effort: any failure is swallowed so it
 * never affects the page. Vanity metric — not treated as sensitive.
 */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false });

  let body: { org?: unknown; kind?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const org = typeof body.org === "string" ? body.org : "";
  const kind = body.kind === "link_click" ? "link_click" : "view";
  if (!org) return NextResponse.json({ ok: false });

  try {
    await admin.from("vendor_events").insert({ vendor_org_id: org, kind });
  } catch {
    // Invalid org / transient error — ignore.
  }
  return NextResponse.json({ ok: true });
}
