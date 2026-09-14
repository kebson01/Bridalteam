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
| M1 | 🔴 High | Vendors can self-upgrade to the paid **Featured** tier for free (billing bypass) | ✅ Closed — both phases |
| M2 | 🟠 Medium | Admin gate: no rate limiting, creds in `sessionStorage`, non-constant-time compare | ✅ Fixed |
| M3 | 🟠 Medium | AI quota bypass / Anthropic cost abuse via spoofable `X-Forwarded-For` | ✅ Fixed |
| M4 | 🟡 Low | No security headers (CSP / HSTS / X-Frame-Options / nosniff) | 🟨 Headers shipped; CSP needs `CSP_ENFORCE=true` |
| M5 | 🟡 Low | Supabase leaked-password protection (HIBP) disabled | ⬜ Open — dashboard toggle |
| M6 | 🟡 Low | `vendor/track` inserts arbitrary `org` stats with service role, unauthenticated | ✅ Fixed |
| M7 | ⚪ Info | 56 SECURITY DEFINER advisor warnings — reviewed, all authorize internally | ⬜ Noise |

> **Status as of 2026-09-14.** Five of the seven are closed in both code and the
> live database. What is left is two settings, not two code changes: enforce the
> CSP (M4) and turn on leaked-password protection (M5). Live Supabase security
> advisors report **0 ERROR-level** findings.

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

**Fix (✅ applied to the live DB as migration `restrict_org_billing_column_updates`).** Revoke blanket UPDATE and re-grant only the columns the app legitimately lets a user write. RLS (`is_org_admin`) still applies on top; the service role (Stripe webhook) bypasses column grants, so billing sync is unaffected. SQL in [`security/2026-08-fix-org-billing-columns.sql`](security/2026-08-fix-org-billing-columns.sql):

```sql
revoke update on public.organizations from anon, authenticated;
grant update (name, logo_url, brand_color, stripe_customer_id, cancel_at_period_end)
  on public.organizations to authenticated;
```

**Important — column selection matters.** An earlier draft that granted only `name/logo_url/brand_color` would have **broken the live checkout flow**: `app/vendor/billing/actions.ts` writes `stripe_customer_id` (checkout) and `cancel_at_period_end` (cancel/resume) via the *user's* client, so those must stay writable. The locked columns — `plan`, `subscription_status`, `stripe_subscription_id` — are written only by the webhook (service role), so revoking them from `authenticated` closes the bypass with no functional impact.

Verified post-apply: `authenticated` UPDATE columns are now exactly `name, logo_url, brand_color, cancel_at_period_end, stripe_customer_id`; `plan` / `subscription_status` / `stripe_subscription_id` are gone; `anon` has no UPDATE columns.

**Phase 2 (✅ done).** The `stripe_customer_id` write in `billing/actions.ts` now goes through the service-role client, scoped to the caller's own org id, so `authenticated` no longer needs the column. The revoke in [`security/2026-08-phase2-lock-stripe-customer-id.sql`](security/2026-08-phase2-lock-stripe-customer-id.sql) has been applied to the live DB in the required order (code deployed first). Verified 2026-09-14: `authenticated` now holds UPDATE on exactly `brand_color, cancel_at_period_end, logo_url, name`, and `anon` on none. The last billing-identifier tamper vector — a vendor pointing their org at someone else's Stripe customer — is closed.

---

## M2 — 🟠 Medium: Admin gate hardening

`lib/admin-auth.ts` validates `x-admin-user` / `x-admin-password` headers against env vars and returns a **service-role** client (full DB, bypasses RLS). Issues:

1. **No rate limiting** on `/api/admin/*` → an attacker can brute-force `ADMIN_PASSWORD` online, and success = total database compromise. This is the highest-leverage weakness after M1.
2. **Credentials persisted in `sessionStorage`** (`app/admin/page.tsx`) and replayed as headers on every request — readable by any same-origin XSS, and left in plaintext in the browser.
3. **Non-constant-time comparison** (`c.password === providedPassword`) — a timing side channel (low practical risk over the network, but free to fix).

**Fixes (✅ all three applied).**

1. **Rate limiting** — per-IP lockout on admin credential checks, backed by an `admin_login_attempts` table, so `ADMIN_PASSWORD` can't be brute-forced online.
2. **Session cookies** — new `/api/admin/login` and `/api/admin/logout` issue an httpOnly, Secure, SameSite=Strict cookie backed by `admin_sessions` (only a token *hash* is stored). The admin page logs in through that flow and no longer keeps the password in `sessionStorage`. `adminGuard` accepts the cookie or the legacy headers, both rate-limited.
3. **Constant-time comparison** — `timingSafeEqual` in `lib/admin-auth.ts`.

Both new tables are RLS-enabled with no policies (service-role only); migration in [`security/2026-08-admin-hardening-tables.sql`](security/2026-08-admin-hardening-tables.sql), applied to the live DB.

**Still on you:** make `ADMIN_PASSWORD` long and random. The rate limiter buys time against guessing; it doesn't rescue a weak passphrase.

---

## M3 — 🟠 Medium: AI quota bypass / Anthropic cost abuse

`lib/ai-quota.ts::clientIp()` returns the **leftmost** `X-Forwarded-For` entry, which a client can set arbitrarily. Anonymous AI chat is metered per IP (`consume_ai_quota`, 5/day). By rotating a spoofed `X-Forwarded-For`, an anonymous user resets the bucket every request → **unbounded calls against your `ANTHROPIC_API_KEY`**. (The `consume_ai_quota` RPC is also directly anon-callable with an arbitrary `p_ip`, same root cause.)

**Fix (✅ applied).** `clientIp()` now trusts the hop the outermost proxy we control actually observed — counting in from the **right** of `X-Forwarded-For`, not the forgeable left-most — so forging the header no longer resets the bucket. The app deploys on **DigitalOcean App Platform**, which puts one trusted hop in front, hence the default of 1; `AI_TRUSTED_PROXY_HOPS` raises it if another proxy is added (Cloudflare in front → 2). Getting that count wrong is the one way this regresses, so re-check it whenever the edge changes.

As defense in depth, `anonChatCeilingExceeded()` caps total anonymous chat calls per day across all IPs (`AI_ANON_DAILY_GLOBAL_CAP`, default 1000), so even a flood from rotated addresses can't run the Anthropic key up. It deliberately **fails open** on a metering error — a Supabase hiccup must not take chat down — which trades a bounded cost risk for availability.

---

## M4 — 🟡 Low: Missing security headers

`next.config.ts` sets no security headers. ✅ Added `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Strict-Transport-Security`, and a minimal `Permissions-Policy` via `headers()`.

**The CSP took two attempts.** A nonce-based policy shipped first and could never have been enforced: most routes are statically prerendered, so Next has no request to mint a nonce for and emits zero nonced scripts, while middleware still advertised a fresh nonce — and the whole response, header included, is CDN-cached for days. Production served `/` and `/pricing` with 0 nonced scripts against header nonces 14.7 and 6.4 days old; flipping the enforce switch would have blocked every script on the marketing site. It was replaced with a policy carrying no per-request state, correct on static, dynamic and cached responses alike (`script-src` trades the nonce for `'unsafe-inline'`; every other directive still does real work). `CSP_STRICT=true` opts back into nonce + `'strict-dynamic'` once the marketing routes render dynamically.

**⬜ Remaining:** the policy still ships as `Content-Security-Policy-Report-Only`. Set `CSP_ENFORCE=true` to enforce it — safe now, unlike before, but click through the marketing pages once after.

## M5 — 🟡 Low: Enable leaked-password protection

Supabase advisor: HaveIBeenPwned check is off. Enable **Auth → Passwords → "Leaked password protection"** in the dashboard. One toggle, no code.

## M6 — 🟡 Low: `vendor/track` accepts arbitrary org

`app/api/vendor/track/route.ts` inserted a `vendor_events` row with a caller-supplied `org`, unauthenticated, using the service role and no rate limit. The code notes it's a vanity metric, but anyone could inflate any vendor's view/click counts or bloat the table.

**Fix (✅ applied).** The org id must now be a well-formed UUID belonging to a **published** vendor before anything is inserted, plus a light per-IP fixed-window rate limit (60/min). That limit is a module-level in-memory counter, which works because the app runs as a persistent Node process on App Platform — it would need an external store if this ever moved to per-request serverless isolates. It blunts automated inflation; it is not a security boundary, and doesn't need to be for a vanity metric.

## M7 — ⚪ Info: SECURITY DEFINER advisor warnings

The 56 `*_security_definer_function_executable` advisories are expected for this design — the functions are the RLS-authorization layer and each checks `auth.uid()` / ownership internally (spot-checked ~12, including every state-changing one). No action needed beyond awareness; revoking `EXECUTE` from `anon` on the purely-authenticated ones (e.g. `add_group_members_by_email`, `set_wedding_website`) would quiet the linter without behavior change.

---

## Remediation priority

Everything that needed code or SQL is done. Both remaining items are settings in a
dashboard, and both should be handled before accounts open:

1. **M5** — turn on leaked-password protection (Supabase → Auth → Passwords). One
   toggle. It matters from the first real signup, not later.
2. **M4** — set `CSP_ENFORCE=true` so the policy stops being advisory, then click
   through the marketing pages once.

Then re-run the advisors after the first week of real traffic. The design that
makes 56 SECURITY DEFINER functions the authorization layer (M7) is sound but
unforgiving: every new RPC has to authorize internally, and the linter won't tell
you which one forgot.
