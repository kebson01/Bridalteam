import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/ai-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Light per-IP rate limit. The app runs as a persistent Node process, so a
// module-level fixed-window counter is enough to blunt automated stat inflation
// without any external store. Not a security boundary — this is a vanity metric.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  // Occasional prune so the map can't grow without bound.
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  const e = hits.get(ip);
  if (!e || now > e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

/**
 * Records a vendor profile view/click. Written with the service role because
 * vendor_events has no public insert policy (visitors must not be able to read
 * or forge each other's stats). Best-effort: failures are swallowed so it never
 * affects the page. Vanity metric — not treated as sensitive.
 *
 * Hardening (M6): the org id must be a UUID that belongs to a PUBLISHED vendor,
 * so callers can't inflate stats for arbitrary/nonexistent orgs or bloat the
 * table with junk rows; plus a light per-IP rate limit.
 */
export async function POST(req: Request) {
  const admin = supabaseAdmin();
  if (!admin) return NextResponse.json({ ok: false });

  if (rateLimited(clientIp(req))) return NextResponse.json({ ok: false });

  let body: { org?: unknown; kind?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const org = typeof body.org === "string" ? body.org : "";
  const kind = body.kind === "link_click" ? "link_click" : "view";
  if (!UUID_RE.test(org)) return NextResponse.json({ ok: false });

  // Only count events for a real, published vendor.
  const { data: published } = await admin
    .from("vendor_profiles")
    .select("org_id")
    .eq("org_id", org)
    .eq("status", "published")
    .maybeSingle();
  if (!published) return NextResponse.json({ ok: false });

  try {
    await admin.from("vendor_events").insert({ vendor_org_id: org, kind });
  } catch {
    // Transient error — ignore.
  }
  return NextResponse.json({ ok: true });
}
