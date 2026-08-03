# Bridal Team (Next.js rebuild) — Security Audit

**Date:** 2026-08-03
**Scope:** White-box review of the `main` branch (Next.js 16 / React 19 / Supabase) **and** read-only inspection of the live Supabase project `Bridal Team` (`yubcwyfhgxjnqydhgjit`). No writes were made to the database; no production exploitation was performed.

## Overall

This is a **well-built, security-conscious** codebase — a marked contrast to the legacy Laravel app on `master`. Verified good practices:

- **RLS is enabled on all 40 public tables**; Supabase security advisors report **0 ERROR-level** findings.
- Per-request Supabase client runs as the signed-in user (`getUser()`, not `getSession()`); the service-role client is confined to the Stripe webhook and a couple of clearly-marked server-only spots.
- Every `SECURITY DEFINER` RPC I inspected authorizes internally (`auth.uid()`, `is_org_owner`, `can_edit_wedding`, …).
- No secrets are committed; the anon key in `lib/supabase.ts` is the publishable key (safe by design).
- Admin API routes gate with `adminGuard` before touching the service role (the legacy app's unauthenticated-admin bug does **not** recur here).

The findings below are real but narrower than the Laravel set.

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| M1 | 🔴 High | Vendors can self-upgrade to the paid **Featured** tier for free (billing bypass) | ⛔ Needs DB change (SQL ready) |
| M2 | 🟠 Medium | Admin gate: no rate limiting, creds in `sessionStorage`, non-constant-time compare | 🟨 Partial |
| M3 | 🟠 Medium | AI quota bypass / Anthropic cost abuse via spoofable `X-Forwarded-For` | 🟨 Recommend |
| M4 | 🟡 Low | No security headers (CSP / HSTS / X-Frame-Options / nosniff) | ✅ Fixed (headers, ex-CSP) |
| M5 | 🟡 Low | Supabase leaked-password protection (HIBP) disabled | ⬜ Dashboard toggle |
| M6 | 🟡 Low | `vendor/track` inserts arbitrary `org` stats with service role, unauthenticated | ⬜ Open |
| M7 | ⚪ Info | 56 SECURITY DEFINER advisor warnings — reviewed, all authorize internally | ⬜ Noise |

---

## M1 — 🔴 High: Vendor self-upgrade to a paid tier (billing bypass)

**What.** `organizations.plan` (`free` | `pro` | `featured` — $0 / $29 / $79 per month) is the single source of truth for entitlements (`lib/tiers.ts`: gallery limits, Inspiration-feed posting, outbound links, lead inbox, stats, featured placement, badge). It is meant to be written **only** by the Stripe webhook (service role).

**The hole.** On the live DB:
- The `authenticated` role holds table-level `UPDATE` on **every** column of `organizations`, including `plan`, `subscription_status`, `stripe_customer_id`, `stripe_subscription_id`, `cancel_at_period_end`.
- The only `UPDATE` RLS policy is `USING is_org_admin(id) WITH CHECK is_org_admin(id)`.
- `is_org_admin` returns true for `role in ('owner','admin')`, and every vendor is created as `owner` (`create_vendor_account`).
- There is **no trigger** guarding the billing columns.

So any signed-in vendor can run, straight from the browser's anon client:

```js
await supabase.from('organizations')
  .update({ plan: 'featured', subscription_status: 'active' })
  .eq('id', MY_ORG_ID);
```

…and unlock the entire $79/mo Featured tier for free. They can also overwrite `stripe_customer_id` / `stripe_subscription_id`, corrupting billing reconciliation (or pointing their org at someone else's Stripe customer).

**Fix (DB — needs to be applied to the Supabase project).** Take the billing columns out of reach of `anon`/`authenticated`; leave the user-editable branding columns. The service role bypasses column grants, so the Stripe webhook keeps working. SQL is in [`security/2026-08-fix-org-billing-columns.sql`](security/2026-08-fix-org-billing-columns.sql):

```sql
revoke update on public.organizations from anon, authenticated;
grant update (name, logo_url, brand_color) on public.organizations to authenticated;
```

After applying, re-test: a vendor can still edit name/logo/brand color; a direct `update({plan:'featured'})` returns 0 rows / permission error; Stripe checkout still flips the plan.

> Not applied by this audit — the engagement was scoped to **read-only** Supabase access. Apply via the Supabase SQL editor or `apply_migration` once reviewed.

---

## M2 — 🟠 Medium: Admin gate hardening

`lib/admin-auth.ts` validates `x-admin-user` / `x-admin-password` headers against env vars and returns a **service-role** client (full DB, bypasses RLS). Issues:

1. **No rate limiting** on `/api/admin/*` → an attacker can brute-force `ADMIN_PASSWORD` online, and success = total database compromise. This is the highest-leverage weakness after M1.
2. **Credentials persisted in `sessionStorage`** (`app/admin/page.tsx`) and replayed as headers on every request — readable by any same-origin XSS, and left in plaintext in the browser.
3. **Non-constant-time comparison** (`c.password === providedPassword`) — a timing side channel (low practical risk over the network, but free to fix).

**Fixes.** ✅ Constant-time comparison applied (`timingSafeEqual`) in `lib/admin-auth.ts`. **Still recommended:** (a) add rate limiting / lockout on the admin endpoints (e.g. a small `admin_login_attempts` table or an edge KV counter keyed by IP), and (b) replace the `sessionStorage` password with a short-lived, httpOnly, server-set session cookie so the raw password never lives in the browser. Ensure `ADMIN_PASSWORD` is long and random regardless.

---

## M3 — 🟠 Medium: AI quota bypass / Anthropic cost abuse

`lib/ai-quota.ts::clientIp()` returns the **leftmost** `X-Forwarded-For` entry, which a client can set arbitrarily. Anonymous AI chat is metered per IP (`consume_ai_quota`, 5/day). By rotating a spoofed `X-Forwarded-For`, an anonymous user resets the bucket every request → **unbounded calls against your `ANTHROPIC_API_KEY`**. (The `consume_ai_quota` RPC is also directly anon-callable with an arbitrary `p_ip`, same root cause.)

**Fix (recommended — platform-specific).** Derive the client IP from a source the client can't forge: on Vercel use `x-vercel-forwarded-for` / the `@vercel/functions` `ipAddress()`; behind a single trusted proxy take the **right-most** XFF hop, not the left-most. As defense in depth, add a small global anon ceiling so a spoofed-IP flood still can't run the key up. Left as a recommendation because the correct trusted source depends on the deploy platform (unknown from the repo) and I can't verify it without a staging deploy.

---

## M4 — 🟡 Low: Missing security headers

`next.config.ts` sets no security headers. ✅ Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, and a minimal `Permissions-Policy` via `headers()`. **A Content-Security-Policy was intentionally left out** — a wrong CSP breaks the app (Supabase, Stripe, Anthropic, Next inline runtime), and I can't test it here. Add a CSP as a separate, staging-tested change.

## M5 — 🟡 Low: Enable leaked-password protection

Supabase advisor: HaveIBeenPwned check is off. Enable **Auth → Passwords → "Leaked password protection"** in the dashboard. One toggle, no code.

## M6 — 🟡 Low: `vendor/track` accepts arbitrary org

`app/api/vendor/track/route.ts` inserts a `vendor_events` row with a caller-supplied `org`, unauthenticated, using the service role and no rate limit. The code notes it's a vanity metric, but anyone can inflate any vendor's view/click counts or bloat the table. Consider validating the org exists + is published and adding a light rate limit.

## M7 — ⚪ Info: SECURITY DEFINER advisor warnings

The 56 `*_security_definer_function_executable` advisories are expected for this design — the functions are the RLS-authorization layer and each checks `auth.uid()` / ownership internally (spot-checked ~12, including every state-changing one). No action needed beyond awareness; revoking `EXECUTE` from `anon` on the purely-authenticated ones (e.g. `add_group_members_by_email`, `set_wedding_website`) would quiet the linter without behavior change.

---

## Remediation priority

1. **Apply M1** (billing column grants) — active, trivially exploitable revenue loss. SQL is ready.
2. **M2** rate-limit + session-cookie the admin gate; ensure a strong `ADMIN_PASSWORD`.
3. **M3** trusted client IP + global anon AI ceiling.
4. **M5** (one toggle), **M4** CSP follow-up, **M6** hardening.
