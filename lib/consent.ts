/**
 * Analytics consent.
 *
 * Google Analytics sets cookies and sends data to a third party, so it does
 * not load until someone says yes. Nothing here is a dark pattern: the default
 * is DENIED, declining is one click, and the decision is reversible from the
 * privacy page.
 *
 * ── Why localStorage, when everything else here uses sessionStorage ─────────
 * lib/attribution.ts and lib/planner-draft.ts both chose sessionStorage
 * deliberately, so nothing persists about people who never came back. Consent
 * is the one value that has to outlive the tab: asking again on every visit is
 * both worse for the visitor and, in the regimes that require asking at all,
 * not what "consent" means. So this is a genuine exception to the pattern, and
 * it stores one of two words and no identifier.
 *
 * ── What consent does NOT gate ──────────────────────────────────────────────
 * The first-party counts in page_events keep running either way. They hold no
 * IP, no user id, no session id and no cookie, so two rows cannot be tied to
 * the same person — there is nothing to consent to, and gating them would
 * leave the business unable to answer "is anyone arriving" for the majority
 * who ignore banners. That distinction is the whole reason the counting was
 * built first-party.
 */

const KEY = "bt_analytics_consent";

export type Consent = "granted" | "denied";

/**
 * The stored decision, or null if they have not been asked yet.
 *
 * Anything other than the two known values is treated as null: a corrupted or
 * hand-edited entry must fall back to "ask again", never to "granted".
 */
export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const value = localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    // Private mode, storage disabled, quota gone. Treated as "not asked",
    // which means the banner shows and analytics stays off — the safe end.
    return null;
  }
}

export function writeConsent(value: Consent): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, value);
  } catch {
    // If it cannot be stored, the choice applies to this page view and they
    // are asked again next time. Annoying, never wrong.
  }
}

/** Used by the privacy page to let someone change their mind. */
export function clearConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}

/** True only on an explicit yes. Unasked and undecided both mean no. */
export function analyticsAllowed(): boolean {
  return readConsent() === "granted";
}
