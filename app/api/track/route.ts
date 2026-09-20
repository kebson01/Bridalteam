import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/ai-quota";
import { isEventName, cleanPath, MAX_FIELD } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Records a first-party funnel event. Modelled on /api/vendor/track, which
 * solved the same problem for vendor listing views (and was hardened in M6).
 *
 * Written with the service role because page_events has no public insert
 * policy: visitors must not be able to read or forge the numbers the business
 * is steered by.
 *
 * The response is always 204, whatever happened. A metrics endpoint that
 * reports failure teaches a caller to retry, and there is nothing here worth
 * retrying.
 */

// Fixed-window per-IP limit, same shape as /api/vendor/track. The app runs as
// a persistent Node process, so a module-level counter is enough to blunt
// automated inflation without an external store. Not a security boundary.
//
// Higher ceiling than the vendor endpoint's 60: a single reader moving through
// guides legitimately fires a handful of page_views a minute, and a shared
// office or campus NAT multiplies that by everyone behind it.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 120;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
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
 * Crawlers execute JavaScript now — Googlebot certainly does — so without this
 * the first thing these numbers would measure is search engines indexing the
 * 22 guides, which is precisely the traffic that must not be mistaken for
 * couples arriving. Substring match on the usual self-identifying tokens: it
 * will not catch a crawler that lies about its user agent, but the ones that
 * matter here do not.
 */
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|quora link preview|pinterest|whatsapp|telegram|headlesschrome|lighthouse|pagespeed|gtmetrix|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|curl|wget|python-requests|node-fetch|axios|go-http-client/i;

let warnedMissingKey = false;
function warnMissingKey() {
  if (warnedMissingKey) return;
  warnedMissingKey = true;
  console.error(
    "track: SUPABASE_SERVICE_ROLE_KEY is not set — funnel events are being discarded.",
  );
}

export async function POST(req: Request) {
  try {
    const ua = req.headers.get("user-agent") ?? "";
    // No user agent at all is a script, not a browser.
    if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });
    if (rateLimited(clientIp(req))) return new NextResponse(null, { status: 204 });

    const body = (await req.json()) as { name?: unknown; path?: unknown; source?: unknown };
    // Allowlisted, so a caller cannot invent event names and turn the table
    // into a junk drawer that quietly costs money to store.
    if (!isEventName(body.name)) return new NextResponse(null, { status: 204 });

    const path = typeof body.path === "string" ? cleanPath(body.path) : undefined;
    const source =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim().slice(0, MAX_FIELD)
        : undefined;

    const admin = supabaseAdmin();
    if (!admin) {
      // supabaseAdmin() returns null when SUPABASE_SERVICE_ROLE_KEY is unset,
      // and this endpoint would then record nothing while still answering 204
      // — a funnel that reads as "no traffic" because it is not writing. That
      // is the exact "degrades quietly" failure the README warns about, so say
      // it out loud, once, rather than every request.
      warnMissingKey();
      return new NextResponse(null, { status: 204 });
    }

    // No IP, no user id, no session id — see the migration for why. clientIp()
    // above is used for the rate-limit window and then discarded.
    const { error } = await admin
      .from("page_events")
      .insert({ name: body.name, path: path ?? null, source: source ?? null });
    if (error) console.error("track insert failed:", error.code, error.message);
  } catch (err) {
    console.error("track failed:", err);
  }
  return new NextResponse(null, { status: 204 });
}
