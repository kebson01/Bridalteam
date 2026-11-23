import { NextResponse } from "next/server";
import { adminGuard, adminUsername } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { vendorRestoreEmail, vendorTakedownEmail } from "@/lib/vendor-site/moderation-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Vendor website moderation for /admin/vendor-sites.
 *
 * GET  ?q=  find vendor websites by address (or a pasted /biz/ link) or
 *           business name. Without q: sites currently taken down.
 * POST      { org_id, action: "takedown" | "restore", reason }
 *
 * admin_take_down_vendor_site / admin_restore_vendor_site (migration
 * 20261115190000_vendor_websites.sql) take the site offline, revoke the
 * vendor's AI keys, block republishing and log it. Nothing is deleted.
 * The vendor's team is emailed either way.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIELDS = "org_id, slug, published, live_updated_at, blocked_at, block_reason, vendor_profiles(business_name, category, city)";

type Row = {
  org_id: string;
  slug: string | null;
  published: boolean;
  live_updated_at: string | null;
  blocked_at: string | null;
  block_reason: string | null;
  vendor_profiles: { business_name: string; category: string | null; city: string | null } | null;
};

export async function GET(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  const raw = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const fromUrl = raw.match(/\/biz\/([a-z0-9-]+)/i);
  const term = (fromUrl ? fromUrl[1] : raw).toLowerCase().replace(/[^a-z0-9 '\-]/g, "").slice(0, 80);

  let rows: Row[] = [];
  if (!term) {
    const { data, error } = await admin.from("vendor_sites").select(FIELDS).not("blocked_at", "is", null).limit(50);
    if (error) return failed("list", error);
    rows = (data ?? []) as unknown as Row[];
  } else {
    if (term.length < 2) return NextResponse.json({ error: "Type an address, a /biz/ link or a business name." }, { status: 400 });
    const like = `%${term.replace(/ /g, "%")}%`;
    const { data: byName } = await admin.from("vendor_profiles").select("org_id").ilike("business_name", like).limit(25);
    const ids = (byName ?? []).map((v) => v.org_id as string);
    const { data, error } = await admin
      .from("vendor_sites")
      .select(FIELDS)
      .or([`slug.ilike.${like}`, ids.length ? `org_id.in.(${ids.join(",")})` : null].filter(Boolean).join(","))
      .limit(25);
    if (error) return failed("search", error);
    rows = (data ?? []) as unknown as Row[];
  }

  const ids = rows.map((r) => r.org_id);
  const { data: log } = ids.length
    ? await admin
        .from("site_moderation_log")
        .select("org_id, action, reason, admin, created_at")
        .in("org_id", ids)
        .order("created_at", { ascending: false })
        .limit(200)
    : { data: [] as { org_id: string; action: string; reason: string | null; admin: string | null; created_at: string }[] };

  return NextResponse.json({
    results: rows.map((r) => ({
      org_id: r.org_id,
      business: r.vendor_profiles?.business_name ?? "(no name)",
      detail: [r.vendor_profiles?.category, r.vendor_profiles?.city].filter(Boolean).join(" · "),
      slug: r.slug,
      published: r.published,
      live_at: r.live_updated_at,
      blocked_at: r.blocked_at,
      block_reason: r.block_reason,
      history: (log ?? []).filter((l) => l.org_id === r.org_id).slice(0, 5),
    })),
  });
}

export async function POST(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  let body: { org_id?: unknown; action?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const orgId = typeof body.org_id === "string" && UUID.test(body.org_id) ? body.org_id : "";
  const action = body.action === "takedown" || body.action === "restore" ? body.action : null;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!orgId || !action) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  if (action === "takedown" && !reason) {
    return NextResponse.json({ error: "Give a reason. The vendor will see it." }, { status: 400 });
  }
  // "Other" on its own tells the vendor nothing: the page sends "Other: <details>".
  if (action === "takedown" && /^other:?$/i.test(reason)) {
    return NextResponse.json({ error: "Say what \"Other\" means. The vendor will see it." }, { status: 400 });
  }

  const who = await adminUsername(admin, req);
  const { data, error } = await admin.rpc(action === "takedown" ? "admin_take_down_vendor_site" : "admin_restore_vendor_site", {
    p_org: orgId,
    [action === "takedown" ? "p_reason" : "p_note"]: reason || null,
    p_admin: who || null,
  });
  if (error) {
    if (error.code === "P0002") return NextResponse.json({ error: "That vendor has no website." }, { status: 404 });
    if (error.code === "22023") return NextResponse.json({ error: error.message }, { status: 409 });
    console.error(`admin vendor site ${action} failed:`, error.code, error.message);
    return NextResponse.json({ error: "That didn't work. Please try again." }, { status: 500 });
  }

  const result = data as { names: string | null; emails: string[] };
  const email =
    action === "takedown"
      ? vendorTakedownEmail({ business: result.names ?? "", reason })
      : vendorRestoreEmail({ business: result.names ?? "" });
  let emailed = 0;
  for (const to of result.emails ?? []) {
    if ((await sendEmail({ to, ...email })).sent) emailed++;
  }
  return NextResponse.json({ ok: true, action, emailed, notified: (result.emails ?? []).length });
}

function failed(what: string, error: { code?: string; message?: string }) {
  console.error(`admin vendor sites ${what} failed:`, error.code, error.message);
  return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
}
