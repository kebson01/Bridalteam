/**
 * Google Analytics 4 — consent-gated.
 *
 * ── Why the gate, and why it is not optional ────────────────────────────────
 * GA sets first-party cookies (_ga, _ga_<id>) and sends behavioural data to a
 * third party. That is exactly the thing /privacy used to promise this site
 * did not do, so switching it on is a deliberate reversal of a published
 * commitment, not a drop-in. §6 of both app/privacy/page.tsx and PRIVACY.md
 * were rewritten in the same change; if you ever remove GA, put the stronger
 * promise back rather than leaving a policy that over-discloses.
 *
 * The gate is the part that keeps the new promise honest. Nothing loads until
 * someone actively accepts: no script tag, no cookie, no network request. A
 * banner that only says "OK" while already tracking is not consent, and under
 * the CCPA/FDBR framing the policy now cites, the opt-out has to actually work.
 *
 * ── Why load-on-consent rather than Consent Mode ────────────────────────────
 * Google's Consent Mode v2 loads gtag immediately with `denied` defaults and
 * sends cookieless "pings" regardless. That is defensible, and it is what most
 * sites do, but it means a visitor who has refused still has their browser
 * talking to Google on every page. Refusing to load the script at all is
 * simpler to reason about and simpler to describe truthfully in the policy,
 * which matters more here than the modelling fidelity Consent Mode buys.
 *
 * ── Why localStorage, not sessionStorage ────────────────────────────────────
 * Deliberately different from lib/attribution.ts, which uses sessionStorage so
 * that nothing persists about people who never sign up. A consent decision is
 * the opposite case: re-asking someone who already said no, every single visit,
 * is both worse for them and a weaker claim to having honoured the choice.
 *
 * ── The unset case ──────────────────────────────────────────────────────────
 * With no NEXT_PUBLIC_GA_MEASUREMENT_ID there is no tracker, so there is also
 * no banner. Showing a cookie prompt for cookies you do not set trains people
 * to dismiss prompts without reading them, and would make the site's own
 * privacy page read as a lie in the other direction.
 */

/**
 * Inlined into the client bundle at build time, like every NEXT_PUBLIC_ value,
 * so changing it needs a rebuild and not just a restart.
 */
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "";

/** No id configured means no analytics and, importantly, no consent banner. */
export const analyticsConfigured = (): boolean => GA_MEASUREMENT_ID.trim() !== "";

const KEY = "bt_consent";

export type Consent = "granted" | "denied";

/**
 * Fired on the window when the decision changes, so the banner and the
 * loader can live in separate components without one importing the other.
 */
export const CONSENT_EVENT = "bt:consent";

/**
 * The stored decision, or null if they have not been asked yet.
 *
 * Every storage read is wrapped: localStorage throws outright in some privacy
 * modes, and the safe reading of a throw is "no consent on record", which
 * leaves the tracker off.
 */
export function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw === "granted" || raw === "denied" ? raw : null;
  } catch {
    return null;
  }
}

/** Records a decision and tells the rest of the page about it. */
export function writeConsent(value: Consent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, value);
  } catch {
    // Private mode. The choice still applies for this page view via the event
    // below; it just will not be remembered, so they will be asked again.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}

/**
 * Forgets the decision so the banner reappears. This is what "Manage cookie
 * choices" on /privacy calls, and it is the mechanism that makes the policy's
 * opt-out claim true rather than decorative.
 *
 * Note what this does NOT do: a page that has already loaded gtag keeps it in
 * memory until navigation. Clearing the GA cookies here would be theatre —
 * Google's script re-sets them on the next event — so the honest behaviour is
 * that opting out stops collection from the next page load, which is what the
 * privacy copy says.
 */
export function resetConsent(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing stored to remove.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}
