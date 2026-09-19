/**
 * First-party signup attribution — "which ad brought this person here?"
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 * Paid campaigns tag their links with UTM parameters, but those parameters land
 * on the page the ad points at (/planner) and are gone two clicks later when
 * the person reaches /auth/signup. Without something carrying them across that
 * gap, the only attribution available is "accounts created while the ads were
 * running", which cannot tell one ad from another and breaks the moment any
 * other traffic source exists.
 *
 * ── Why not a tracker ───────────────────────────────────────────────────────
 * The published privacy policy says, in bold, that the site runs no
 * third-party advertising or analytics trackers, and that is worth keeping
 * true. Nothing here talks to a third party: the values are read from our own
 * URL, held in the visitor's own browser, and attached to their own account at
 * signup. No pixel, no network call, no shared identifier.
 *
 * ── Why sessionStorage ──────────────────────────────────────────────────────
 * It is the least that answers the question. A cold ad click converts in the
 * same browsing session or usually not at all, and sessionStorage dies with the
 * tab — so nothing persists about people who never signed up, and there is no
 * cross-visit identifier to disclose or defend.
 *
 * The trade-off is real and worth naming: someone who clicks an ad today and
 * signs up from a bookmark next week is recorded as untracked, which
 * understates the campaign. If that matters later, the upgrade is localStorage
 * with an explicit expiry — but that is a cross-visit record of people who are
 * not users yet, so it needs a line in the privacy policy before it ships.
 *
 * ── First touch wins ────────────────────────────────────────────────────────
 * capture() never overwrites an existing entry. The ad click is the first page
 * load of the session; every internal navigation after it has no UTM
 * parameters, and letting those write would erase the answer with a blank.
 */

const KEY = "bt_attribution";

/** Keep values short: this ends up on the user record, and nothing legitimate is long. */
const MAX_LEN = 120;

/**
 * What we keep. Deliberately not the full URL or full referrer — the path and
 * the referring host answer "where from" without recording a browsing trail.
 */
export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  /** Meta and Google click ids, present on ad clicks even when UTMs are not. */
  click_id?: string;
  /** The path the visitor first landed on, e.g. "/planner". */
  landing_path?: string;
  /** Referring host only, never the full referring URL. */
  referrer_host?: string;
}

const UTM_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

function clean(value: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim().slice(0, MAX_LEN);
  return trimmed || undefined;
}

/**
 * Reads attribution out of a URL's query string. Exported for testing so the
 * parsing can be exercised without a DOM or a storage backend.
 */
export function parseAttribution(url: string, referrer = ""): Attribution | null {
  let params: URLSearchParams;
  let pathname = "";
  try {
    const parsed = new URL(url);
    params = parsed.searchParams;
    pathname = parsed.pathname;
  } catch {
    return null;
  }

  const found: Attribution = {};
  for (const key of UTM_KEYS) {
    const value = clean(params.get(key));
    if (value) found[key] = value;
  }

  // fbclid (Meta) and gclid (Google) ride along on ad clicks even when someone
  // forgets the UTM tags, so a click is still distinguishable from organic.
  const clickId = clean(params.get("fbclid")) ?? clean(params.get("gclid"));
  if (clickId) found.click_id = clickId;

  // Nothing that marks this as a campaign visit — don't record anything. An
  // empty record would still count as "first touch" and block the real one.
  if (Object.keys(found).length === 0) return null;

  found.landing_path = pathname.slice(0, MAX_LEN);

  if (referrer) {
    try {
      found.referrer_host = new URL(referrer).host.slice(0, MAX_LEN);
    } catch {
      // Malformed referrer; the UTM values are the part that matters.
    }
  }

  return found;
}

/**
 * Records attribution for this session if the current URL carries any and
 * nothing has been recorded yet. Safe to call on every page load.
 *
 * Every storage access is wrapped: sessionStorage throws outright in some
 * privacy modes, and attribution is never worth breaking a page load over.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  try {
    if (window.sessionStorage.getItem(KEY)) return; // first touch already held
  } catch {
    return; // storage unavailable — nothing to capture into
  }

  const found = parseAttribution(window.location.href, document.referrer);
  if (!found) return;

  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(found));
  } catch {
    // Quota or a privacy mode. The signup still works; it is just unattributed.
  }
}

/** Returns what was captured this session, or null. Never throws. */
export function readAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    return parsed as Attribution;
  } catch {
    return null;
  }
}
