import { NextResponse } from "next/server";
import { adminGuard, adminUsername } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { restoreEmail, takedownEmail, searchTerm } from "@/lib/custom-site/moderation-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Guest website moderation for /admin/sites.
 *
 * GET  ?q=  find weddings by address (or a pasted guest link), couple names
 *           or wedding id. Without q: the sites currently taken down.
 * POST      { wedding_id, action: "takedown" | "restore", reason }
 *
 * The work is done by admin_take_down_site / admin_restore_site (migration
 * 20261101180000_admin_site_takedown.sql): switch the site off, revoke the
 * couple's AI keys, block republishing, and log who did it and why. Nothing
 * is deleted. The couple is emailed either way.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const FIELDS =
  "id, partner_one, partner_two, event_date, public_slug, website_published, site_mode, site_blocked_at, site_block_reason, created_at";

type WeddingRow = {
  id: string;
  partner_one: string | null;
  partner_two: string | null;
  event_date: string | null;
  public_slug: string | null;
  website_published: boolean | null;
  site_mode: string | null;
  site_blocked_at: string | null;
  site_block_reason: string | null;
};

export async function GET(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  const raw = (new URL(req.url).searchParams.get("q") ?? "").trim();
  const ids = new Set<string>();
  let rows: WeddingRow[] = [];

  if (!raw) {
    const { data, error } = await admin
      .from("weddings")
      .select(FIELDS)
      .not("site_blocked_at", "is", null)
      .order("site_blocked_at", { ascending: false })
      .limit(50);
    if (error) return failed("list", error);
    rows = (data ?? []) as WeddingRow[];
  } else if (UUID.test(raw)) {
    const { data, error } = await admin.from("weddings").select(FIELDS).eq("id", raw).limit(1);
    if (error) return failed("id lookup", error);
    rows = (data ?? []) as WeddingRow[];
  } else {
    const term = searchTerm(raw);
    if (term.length < 2) return NextResponse.json({ error: "Type an address, a guest link or a couple's name." }, { status: 400 });
    const like = `%${term.replace(/ /g, "%")}%`;
    const { data, error } = await admin
      .from("weddings")
      .select(FIELDS)
      .or(`public_slug.ilike.${like},partner_one.ilike.${like},partner_two.ilike.${like}`)
      .order("created_at", { ascending: false })
      .limit(25);
    if (error) return failed("search", error);
    rows = (data ?? []) as WeddingRow[];

    // A reported link may point at an address the couple has since changed.
    const { data: retired } = await admin
      .from("retired_wedding_slugs")
      .select("wedding_id")
      .eq("slug", term.replace(/ /g, "-"))
      .not("wedding_id", "is", null);
    const extra = (retired ?? []).map((r) => r.wedding_id as string).filter((id) => !rows.some((w) => w.id === id));
    if (extra.length) {
      const { data: more } = await admin.from("weddings").select(FIELDS).in("id", extra);
      rows = [...rows, ...((more ?? []) as WeddingRow[])];
    }
  }
  rows.forEach((w) => ids.add(w.id));

  // Whether each has a live custom site, and its moderation history.
  const [{ data: sites }, { data: log }] = await Promise.all([
    ids.size
      ? admin.from("wedding_custom_sites").select("wedding_id, live_updated_at").in("wedding_id", [...ids])
      : Promise.resolve({ data: [] as { wedding_id: string; live_updated_at: string | null }[] }),
    ids.size
      ? admin
          .from("site_moderation_log")
          .select("wedding_id, action, reason, admin, created_at")
          .in("wedding_id", [...ids])
          .order("created_at", { ascending: false })
          .limit(200)
      : Promise.resolve({ data: [] as { wedding_id: string; action: string; reason: string | null; admin: string | null; created_at: string }[] }),
  ]);
  const liveAt = new Map((sites ?? []).map((s) => [s.wedding_id as string, s.live_updated_at as string | null]));

  return NextResponse.json({
    results: rows.map((w) => ({
      id: w.id,
      names: [w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "(no names)",
      event_date: w.event_date,
      slug: w.public_slug,
      published: Boolean(w.website_published),
      site_mode: w.site_mode === "custom" ? "custom" : "standard",
      custom_live_at: liveAt.get(w.id) ?? null,
      blocked_at: w.site_blocked_at,
      block_reason: w.site_block_reason,
      history: (log ?? []).filter((l) => l.wedding_id === w.id).slice(0, 5),
    })),
  });
}

export async function POST(req: Request) {
  const guard = await adminGuard(req);
  if (guard instanceof NextResponse) return guard;
  const admin = guard;

  let body: { wedding_id?: unknown; action?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const weddingId = typeof body.wedding_id === "string" && UUID.test(body.wedding_id) ? body.wedding_id : "";
  const action = body.action === "takedown" || body.action === "restore" ? body.action : null;
  const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 500) : "";
  if (!weddingId || !action) return NextResponse.json({ error: "Bad request." }, { status: 400 });
  if (action === "takedown" && !reason) {
    return NextResponse.json({ error: "Give a reason. The couple will see it." }, { status: 400 });
  }

  const who = await adminUsername(admin, req);
  const { data, error } = await admin.rpc(action === "takedown" ? "admin_take_down_site" : "admin_restore_site", {
    p_wid: weddingId,
    [action === "takedown" ? "p_reason" : "p_note"]: reason || null,
    p_admin: who || null,
  });
  if (error) {
    if (error.code === "P0002") return NextResponse.json({ error: "That wedding no longer exists." }, { status: 404 });
    if (error.code === "22023") return NextResponse.json({ error: error.message }, { status: 409 });
    console.error(`admin ${action} failed:`, error.code, error.message);
    return NextResponse.json({ error: "That didn't work. Please try again." }, { status: 500 });
  }

  const result = data as { names: string; slug: string | null; emails: string[] };
  const email =
    action === "takedown"
      ? takedownEmail({ weddingId, names: result.names, reason })
      : restoreEmail({ weddingId, names: result.names });
  let emailed = 0;
  for (const to of result.emails ?? []) {
    if ((await sendEmail({ to, ...email })).sent) emailed++;
  }

  return NextResponse.json({ ok: true, action, emailed, notified: (result.emails ?? []).length });
}

function failed(what: string, error: { code?: string; message?: string }) {
  console.error(`admin sites ${what} failed:`, error.code, error.message);
  return NextResponse.json({ error: "Lookup failed." }, { status: 500 });
}
