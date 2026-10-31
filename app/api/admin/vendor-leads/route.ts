import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Reviewing vendor leads -- every business found by research, a data file, or
 * a couple's recommendation, before it becomes a listing.
 *
 * GET  ?status=new&source=couple_referral   list leads (newest first, 200 max)
 * POST { id, action: "import" | "reject" }  one lead
 * POST { action: "import_all", source? }     every new researched lead
 *
 * Importing goes through import_vendor_lead() in
 * supabase/migrations/20261031120000_vendor_leads.sql, which dedupes against
 * the directory and never touches a claimed listing. This route only decides
 * which leads to hand it.
 */

const STATUSES = new Set(["new", "duplicate", "imported", "rejected"]);
const SOURCES = new Set([
  "web_search", "google_places", "county_btr", "dbpr",
  "association", "venue_preferred", "couple_referral", "vendor_referral",
]);

export async function GET(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  const params = new URL(req.url).searchParams;
  const status = params.get("status") ?? "new";
  const source = params.get("source");
  if (!STATUSES.has(status)) return NextResponse.json({ error: "Unknown status." }, { status: 400 });
  if (source && !SOURCES.has(source)) return NextResponse.json({ error: "Unknown source." }, { status: 400 });

  let query = admin
    .from("vendor_leads")
    .select("id, source, source_ref, source_url, business_name, category, city, website, phone, email, note, status, org_id, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(200);
  if (source) query = query.eq("source", source);

  const [{ data, error }, { data: counts, error: countErr }] = await Promise.all([
    query,
    admin.from("vendor_leads").select("source, status"),
  ]);
  if (error || countErr) {
    const e = error ?? countErr!;
    console.error("vendor-leads list failed:", e.code, e.message);
    return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
  }

  // Small table (hundreds of rows), so counting here beats a second function.
  const summary: Record<string, Record<string, number>> = {};
  for (const r of counts ?? []) {
    summary[r.source] ??= {};
    summary[r.source][r.status] = (summary[r.source][r.status] ?? 0) + 1;
  }

  return NextResponse.json({ leads: data ?? [], summary });
}

export async function POST(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  let body: { id?: unknown; action?: unknown; source?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  if (body.action === "import_all") {
    const source = typeof body.source === "string" && SOURCES.has(body.source) ? body.source : null;
    const { data, error } = await admin.rpc("import_vendor_leads", { p_source: source });
    if (error) {
      console.error("import_vendor_leads failed:", error.code, error.message);
      return NextResponse.json({ error: "Import failed." }, { status: 500 });
    }
    return NextResponse.json({ results: data ?? [] });
  }

  const id = typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Missing lead." }, { status: 400 });

  if (body.action === "reject") {
    const { data, error } = await admin
      .from("vendor_leads")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", id)
      .eq("status", "new")
      .select("id")
      .maybeSingle();
    if (error) {
      console.error("vendor-leads reject failed:", error.code, error.message);
      return NextResponse.json({ error: "Couldn't update that lead." }, { status: 500 });
    }
    if (!data) return NextResponse.json({ error: "That lead was already reviewed." }, { status: 409 });
    return NextResponse.json({ status: "rejected" });
  }

  if (body.action === "import") {
    // Corrections made on the review page (a couple's "Naples, FL" tidied to
    // "Naples", a category picked) are saved to the lead before importing, so
    // the lead stays a true record of what became the listing.
    const edits = (body as { edits?: Record<string, unknown> }).edits ?? {};
    const patch: Record<string, string | null> = {};
    for (const k of ["business_name", "category", "city", "website", "phone"] as const) {
      if (typeof edits[k] === "string") patch[k] = (edits[k] as string).trim() || null;
    }
    if (patch.business_name === null) {
      return NextResponse.json({ error: "A business name is required." }, { status: 400 });
    }
    if (Object.keys(patch).length) {
      const { error: editErr } = await admin.from("vendor_leads").update(patch).eq("id", id).eq("status", "new");
      if (editErr) {
        console.error("vendor-leads edit failed:", editErr.code, editErr.message);
        return NextResponse.json({ error: "Couldn't save those changes." }, { status: 500 });
      }
    }

    const { data, error } = await admin.rpc("import_vendor_lead", { p_lead: id });
    if (error) {
      console.error("import_vendor_lead failed:", error.code, error.message);
      return NextResponse.json({ error: "Import failed." }, { status: 500 });
    }
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ status: row?.status ?? null, org_id: row?.org_id ?? null });
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
