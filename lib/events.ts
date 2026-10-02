/**
 * First-party funnel events.
 *
 * The counting half of "is anyone arriving, and where do they stop?" — see
 * supabase/migrations/20260920060000_page_events.sql for why this is built in
 * house rather than bought, and why it holds no identifier.
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

/**
 * Reports an event. Deliberately unawaited and failure-swallowing at every
 * layer: a metrics call must never delay a render, block a navigation, or
 * surface an error to someone planning a wedding.
 *
 * `sendBeacon` where available because it survives the page being closed —
 * which is exactly when the last event of a visit fires, and exactly when a
 * normal fetch gets cancelled.
 */
export function track(name: EventName, path?: string, source?: string): void {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({ name, path, source });
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
