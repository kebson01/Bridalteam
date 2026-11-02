/**
 * First-party funnel events.
 *
 * The counting half of "is anyone arriving, and where do they stop?" — see
 * supabase/migrations/20260920060000_page_events.sql for why this is built in
 * house rather than bought, and 20261102120000_page_events_visits.sql for the
 * one identifier it does hold: a random per-tab visit id, never linked across
 * visits. The numbers are read on /admin/analytics.
 *
 * Keep the list short. Every event added here is a number someone has to
 * interpret later, and a funnel with thirty stages tells you less than one
 * with five.
 */
export const EVENT_NAMES = [
  /** A page was rendered. `path` says which. */
  "page_view",
  /** Someone sent a message to the AI planner — the first real engagement. */
  "planner_message",
  /** They hit the anonymous demo ceiling. The moment the CTA has to work. */
  "planner_limit",
  /** An account was created. The end of the funnel. */
  "signup_success",
  /** The visitor left a page (navigated, hid the tab or closed it). Carries the on-screen time. */
  "page_leave",
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export function isEventName(value: unknown): value is EventName {
  return typeof value === "string" && (EVENT_NAMES as readonly string[]).includes(value);
}

/** Values land in a shared table and are read by eye; nothing useful is long. */
export const MAX_FIELD = 120;

/**
 * Route prefixes whose next path segment IS a credential.
 *
 * Each of these is reached only by holding a secret that lives in the URL
 * itself: a vendor claim link, a bridal-party invite, a guest's personal RSVP
 * link. Their whole security model is that the secret is unguessable and that
 * the database stores only a hash of it — `vendor_claims` keeps a SHA-256 and
 * nothing else precisely so that a database read cannot reconstruct a working
 * link.
 *
 * Recording the full path defeated that. A real claim token was found sitting
 * in `page_events.path` in plaintext:
 *
 *     /claim/byBpTTbetDHkjbaX-84zW9pWQwaH3N5gXK05hNIv52A
 *
 * Nobody could read it without service-role access — the table has RLS on and
 * neither `anon` nor `authenticated` is granted SELECT — so this was never a
 * public leak. It was still a live credential copied into an analytics table
 * that exists to be read by eye, and it meant the hash-only design protected
 * one table while another quietly kept the plaintext.
 *
 * The analytics value is in knowing *that* a claim page was opened, never
 * which one, so the segment is dropped rather than hashed or truncated.
 */
const CREDENTIAL_ROUTES = ["/claim", "/invite", "/rsvp"] as const;

/**
 * Strips a path down to what is worth storing: no origin, no query string, no
 * fragment, and no credential-bearing segment.
 *
 * Query strings carry UTM values and whatever else a referrer appended, and
 * the useful part of that is recorded separately as `source`.
 */
export function cleanPath(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const path = input.split("?")[0].split("#")[0].trim();
  if (!path.startsWith("/")) return undefined;

  // Redaction runs before the length cap, so a long token cannot be preserved
  // in part by truncation.
  for (const prefix of CREDENTIAL_ROUTES) {
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      return `${prefix}/[token]`;
    }
  }

  return path.slice(0, MAX_FIELD);
}

// ── Visits ────────────────────────────────────────────────────────────────────
//
// One visit = one browser tab until it closes or sits idle for 30 minutes. The
// id is random, lives in sessionStorage (not a cookie, not localStorage), and
// is never linked to an account, an IP or any earlier visit. See
// supabase/migrations/20261102120000_page_events_visits.sql.

const VISIT_KEY = "bt_visit";
export const VISIT_IDLE_MS = 30 * 60 * 1000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The current visit's id, starting a new visit after 30 idle minutes. Undefined if storage is blocked. */
export function visitId(now: number = Date.now()): string | undefined {
  try {
    const saved = JSON.parse(sessionStorage.getItem(VISIT_KEY) ?? "null") as { id?: string; last?: number } | null;
    const id =
      saved?.id && UUID_RE.test(saved.id) && typeof saved.last === "number" && now - saved.last < VISIT_IDLE_MS
        ? saved.id
        : crypto.randomUUID();
    sessionStorage.setItem(VISIT_KEY, JSON.stringify({ id, last: now }));
    return id;
  } catch {
    return undefined;
  }
}

// Opening /admin marks this browser as the owner's, so testing the site and
// checking the dashboard don't show up as visitor traffic. Undo from the
// analytics page.
const NO_TRACK_KEY = "bt_no_track";

export function trackingDisabled(): boolean {
  try {
    return localStorage.getItem(NO_TRACK_KEY) === "1";
  } catch {
    return false;
  }
}

/** An explicit choice from the analytics page. "0" is remembered too, so it sticks. */
export function setTrackingDisabled(disabled: boolean): void {
  try {
    localStorage.setItem(NO_TRACK_KEY, disabled ? "1" : "0");
  } catch {
    // Storage blocked: nothing to remember, nothing to undo.
  }
}

/**
 * Called on every /admin page: excludes this browser unless its owner has
 * already chosen (on /admin/analytics) to be counted. Without the "unless",
 * switching counting back on would be silently undone by the next admin visit.
 */
export function excludeAdminBrowserByDefault(): void {
  try {
    if (localStorage.getItem(NO_TRACK_KEY) === null) localStorage.setItem(NO_TRACK_KEY, "1");
  } catch {
    // Storage blocked: this browser will be counted, which is the safe default.
  }
}

// ── Server-side validation of the two new fields ──────────────────────────────

/** A visit id the server will store: a v4-shaped UUID, nothing else. */
export function cleanVisitId(value: unknown): string | undefined {
  return typeof value === "string" && UUID_RE.test(value) ? value.toLowerCase() : undefined;
}

/** On-screen milliseconds, capped at 30 minutes so a forgotten tab can't skew averages. */
export const MAX_DURATION_MS = 30 * 60 * 1000;

export function cleanDuration(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
  return Math.min(Math.round(value), MAX_DURATION_MS);
}

/**
 * Reports an event. Deliberately unawaited and failure-swallowing at every
 * layer: a metrics call must never delay a render, block a navigation, or
 * surface an error to someone planning a wedding.
 *
 * `sendBeacon` where available because it survives the page being closed —
 * which is exactly when the last event of a visit fires, and exactly when a
 * normal fetch gets cancelled.
 */
export function track(name: EventName, path?: string, source?: string, durationMs?: number): void {
  if (typeof window === "undefined") return;
  try {
    if (trackingDisabled()) return;
    const body = JSON.stringify({ name, path, source, visit_id: visitId(), duration_ms: durationMs });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Blocked by an extension, storage disabled, offline — all fine. A number
    // we don't get is not worth an error anybody sees.
  }
}
