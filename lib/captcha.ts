/**
 * Cloudflare Turnstile — bot protection on the Supabase Auth endpoints.
 *
 * ── Why ─────────────────────────────────────────────────────────────────────
 * Between 2026-09-11 and 2026-09-17, every single /signup request reaching
 * Supabase came from a Tor exit or a datacenter IP: ~14 different Tor exit
 * operators sharing one malformed user-agent, Cloudflare trust score 29/100,
 * three requests per address before rotating. The same actor also ran 48
 * credential-stuffing attempts against /token and 28 password-reset sends
 * through /recover in a single day — the latter being the expensive one, since
 * it mails addresses the attacker chooses and burns our sending reputation.
 * Of 49 accounts created, none were a real person.
 *
 * Turnstile is the control that closes all three at once.
 *
 * ── Deploy order matters ────────────────────────────────────────────────────
 * Supabase's captcha protection REJECTS any signup / sign-in / password-reset
 * that arrives without a token once it is switched on. So:
 *
 *   1. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY and deploy. The widget renders and
 *      starts sending tokens; Supabase ignores them, so nothing changes yet.
 *   2. THEN enable Authentication → Bot and Abuse Protection in Supabase,
 *      with the matching Turnstile SECRET key.
 *
 * Doing it the other way round breaks every real signup and login in the gap.
 *
 * With no site key set this module reports "not required" and the forms behave
 * exactly as they did before, which is what makes step 1 safe to ship ahead of
 * step 2. Because it is a NEXT_PUBLIC_* value it is read at build time, so
 * setting it needs a redeploy rather than just an env change.
 *
 * To switch to hCaptcha instead, swap the script URL and the global in
 * components/auth/captcha.tsx, and pick hCaptcha in the Supabase dashboard —
 * the token still travels as `options.captchaToken`, so nothing else changes.
 */
export const CAPTCHA_SITE_KEY = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

/** True when a captcha token should be obtained before calling Supabase Auth. */
export const CAPTCHA_REQUIRED = CAPTCHA_SITE_KEY.length > 0;
