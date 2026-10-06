/**
 * Remembers where someone was headed before signing up, so an email
 * confirmation can't lose it.
 *
 * ── The bug this closes ─────────────────────────────────────────────────────
 * A vendor opens a claim link and signs up from it. The CTA passes
 * `?next=/claim/<token>`, the form forwards it as `emailRedirectTo`, and
 * `/auth/callback` and `/auth/confirm` both read `next` back off the URL. That
 * chain is correct and it still broke in production: the first real
 * walkthrough went
 *
 *     /claim/<token> -> /auth/signup -> signup_success -> /onboarding
 *
 * and the vendor, finding an onboarding form, created a brand-new vendor
 * listing instead of claiming the one prepared for them. The prepared listing
 * was never claimed and the duplicate had to be cleaned up by hand.
 *
 * The break is the email round-trip. Both auth routes default to
 * `/onboarding` when `next` is absent, and whether it is present depends on
 * the confirmation email template carrying it through — configuration that
 * lives outside this repository. The same applies to `/invite/<token>`
 * (app/invite/[token]/page.tsx redirects to signup the identical way), which
 * matters more: the bridal-party invite is the growth loop.
 *
 * So the destination is also kept in the browser, and recovered on landing.
 * Belt and braces deliberately: the URL still carries `next` and is still the
 * primary path. This is the fallback for when it does not arrive.
 *
 * ── Limits, stated plainly ──────────────────────────────────────────────────
 * sessionStorage is per-tab and per-browser. Someone who confirms their email
 * on their phone, having signed up on a laptop, is not helped by this — only
 * the email template carrying `next` fixes that case. It covers the common
 * one: same browser, confirmation link opened from the same device.
 */

const KEY = "bt_pending_next";

/**
 * Destinations worth resuming, and the only ones permitted.
 *
 * An allowlist rather than a general "is this a local path" check. The stored
 * value is read back out of storage the visitor's own extensions can write to
 * and then used to navigate, so it is untrusted input. Restricting it to the
 * two token flows that actually need resuming means a hostile value cannot
 * turn this into an open redirect — there is nowhere interesting to send
 * someone inside `/claim/` or `/invite/`.
 */
const RESUMABLE = ["/claim/", "/invite/"];

/**
 * True for a root-relative path on a resumable route.
 *
 * `//evil.com` is the case worth naming: it starts with "/" and is a
 * protocol-relative URL, so a naive startsWith("/") check would hand an
 * attacker a redirect to another origin. Requiring a known prefix excludes it,
 * and the explicit "//" rejection documents why rather than relying on the
 * allowlist to catch it by accident.
 */
export function isResumable(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  return RESUMABLE.some((prefix) => path.startsWith(prefix));
}

/** Stores the destination, if it is one we would resume. Never throws. */
export function savePendingNext(path: string | null | undefined): void {
  if (typeof window === "undefined" || !path || !isResumable(path)) return;
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Private mode, storage disabled, quota gone. The URL path still works.
  }
}

/**
 * Returns the stored destination and clears it, or null.
 *
 * Reads once and removes, so a stale destination cannot redirect a later,
 * unrelated visit in the same tab. Re-validates on the way out rather than
 * trusting what was written: the value may have been edited in storage since.
 */
export function takePendingNext(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
    if (!raw || !isResumable(raw)) return null;
    return raw;
  } catch {
    return null;
  }
}
