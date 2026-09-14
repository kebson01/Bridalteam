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
| M4 | 🟡 Low | No security headers (CSP / HSTS / X-Frame-Options / nosniff) | 🟨 Policy fixed + verified; needs `CSP_ENFORCE=true` |
| M5 | 🟡 Low | Supabase leaked-password protection (HIBP) disabled | ✅ Enabled |
| M6 | 🟡 Low | `vendor/track` inserts arbitrary `org` stats with service role, unauthenticated | ✅ Fixed |
| M7 | ⚪ Info | 56 SECURITY DEFINER advisor warnings — reviewed, all authorize internally | ✅ Narrowed (25 → 18 anon) |
| M8 | 🟡 Low | `consume_ai_quota` is anon-callable, so the global AI ceiling can be tripped on purpose | ⬜ Open — found 2026-09-14 |

> **Status as of 2026-09-14.** Six of the seven are closed. The only thing left
> is flipping `CSP_ENFORCE=true` in the environment (M4) — the policy itself has
> been corrected and verified enforcing in a real browser. Live Supabase security
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

**Two directives were missing, and both would have broken silently on enforce** (found 2026-09-14 by walking the app, not by reading the policy):

- **`frame-src` was absent entirely**, so frames fell back to `default-src 'self'`. The inspiration gallery embeds YouTube and Vimeo players (`components/inspiration-gallery.tsx::toEmbed`), so every embedded video would have rendered as an empty box. Now `frame-src 'self' https://www.youtube.com https://player.vimeo.com`.
- **`form-action 'self'`** would have blocked vendor checkout. `startCheckoutFor` redirects to `checkout.stripe.com` and the portal to `billing.stripe.com`; Chrome exempts redirects from `form-action`, but Firefox and Safari do not, so a no-JS "Subscribe" POST would have died mid-redirect on those browsers. Both hosts are now named.

**Verified enforcing.** Built the app, served it with `CSP_ENFORCE=true`, and drove Chromium across 15 routes (`/`, `/pricing`, `/for-vendors`, `/about`, `/contact`, `/guides`, `/blog`, `/terms`, `/privacy`, `/planner`, `/signup`, `/login`, `/vendors`, `/auth/login`, `/auth/signup`): **zero `securitypolicyviolation` events, React hydrated on every one**. A targeted probe then confirmed the additions do real work — YouTube and Vimeo iframes load, while an unlisted host is still blocked by `frame-src`.

**⬜ Remaining:** the policy still ships as `Content-Security-Policy-Report-Only`. Set `CSP_ENFORCE=true` in the environment to enforce it. Note the verification above covered signed-out routes only — a local signed-in session wasn't possible here — so walk one authenticated workspace page after flipping it.

## M5 — 🟡 Low: Enable leaked-password protection

Supabase advisor: HaveIBeenPwned check was off, so known-breached passwords were accepted at signup and password change.

**✅ Enabled** (2026-09-14). Confirmed in the dashboard under Authentication → Bot and Abuse Protection ("Prevent use of leaked passwords" reads ENABLED), and the `auth_leaked_password_protection` advisory no longer appears.

**Worth noting while you're on that screen:** *Enable Captcha protection* is still **off**. It wasn't in the original audit's scope and isn't a vulnerability, but it is the control that stops scripted signups, and it starts mattering the moment accounts open to the public.

## M6 — 🟡 Low: `vendor/track` accepts arbitrary org

`app/api/vendor/track/route.ts` inserted a `vendor_events` row with a caller-supplied `org`, unauthenticated, using the service role and no rate limit. The code notes it's a vanity metric, but anyone could inflate any vendor's view/click counts or bloat the table.

**Fix (✅ applied).** The org id must now be a well-formed UUID belonging to a **published** vendor before anything is inserted, plus a light per-IP fixed-window rate limit (60/min). That limit is a module-level in-memory counter, which works because the app runs as a persistent Node process on App Platform — it would need an external store if this ever moved to per-request serverless isolates. It blunts automated inflation; it is not a security boundary, and doesn't need to be for a vanity metric.

## M7 — ⚪ Info: SECURITY DEFINER advisor warnings

The `*_security_definer_function_executable` advisories are expected for this design — the functions are the RLS-authorization layer and each checks `auth.uid()` / ownership internally (spot-checked ~12, including every state-changing one).

**✅ Narrowed** (2026-09-14). `EXECUTE` is revoked from `anon` on the seven functions only signed-in users ever call: `add_group_members_by_email`, `is_group_owner`, `join_public_group`, `list_group_members`, `list_suggested_groups`, `remove_group_member`, `set_wedding_website`. SQL and full reasoning in [`security/2026-09-revoke-anon-execute-on-signed-in-rpcs.sql`](security/2026-09-revoke-anon-execute-on-signed-in-rpcs.sql); applied to the live DB. The anon advisory count fell **25 → 18**.

Two things that analysis turned up, both worth remembering before anyone extends this:

1. **`revoke ... from anon` is usually a no-op here.** Most of these functions grant EXECUTE to `PUBLIC` (`=X/postgres` in `proacl`), not to `anon`, so you must revoke from `public` as well or nothing changes — while `has_function_privilege('anon', …)` keeps reporting `true` and looks like a failed revoke.
2. **13 of the flagged functions are RLS policy predicates** (`can_edit_wedding`, `is_org_member`, `can_see_post`, …). Policy expressions evaluate as the *calling* role, so revoking those from `anon` does not "quiet the linter without behavior change" — it breaks every public read on the site. They must stay.

The **18 remaining anon advisories are all correct and should stay**: those 13 predicates, plus the 5 genuinely public RPCs (`get_public_wedding`, `list_public_registry`, `get_guest_invite`, `submit_guest_rsvp`, `consume_ai_quota`). The 34 `authenticated` advisories are the design working as intended — those functions are *for* signed-in users.

---

## M8 — 🟡 Low: the anon AI ceiling can be tripped deliberately

*Found 2026-09-14 while working M7, not part of the original audit.*

`consume_ai_quota(p_kind, p_ip)` has to stay executable by `anon`, because `app/api/plan/route.ts` meters anonymous chat through the caller's own Supabase client, and the function reads `auth.uid()` to decide the tier. So it is callable directly at `/rest/v1/rpc/consume_ai_quota` with the publishable key and any `p_ip` the caller likes. Each call inserts a row into `ai_usage`.

The M3 fix stopped this being a *cost* problem — `clientIp()` is no longer forgeable, so an attacker can't mint themselves unlimited real chat turns. What's left is an **availability** problem, and it comes from the M3 backstop itself: `anonChatCeilingExceeded()` counts every `ai_usage` row with a `subject` like `ip:%` in the last 24h and cuts anonymous chat off above `AI_ANON_DAILY_GLOBAL_CAP` (default 1000). Those rows don't have to come from the app. Roughly a thousand direct RPC calls — trivially scripted, no account needed — turn the planner off for every signed-out visitor for a day. The same trick can burn a chosen visitor's 5-a-day bucket by passing their IP, and bloats the table.

**Proposed fix (not applied — it changes a function signature and a call site, so it wants its own change):** pass the user id in explicitly, `consume_ai_quota(p_kind, p_ip, p_uid)`, call it with the service-role client from the two API routes that already derive both values server-side, then revoke EXECUTE from `anon` and `authenticated` so only the service role can write quota rows at all. That closes the hole rather than raising the cap, and it also drops `consume_ai_quota` off the anon advisory list.

Until then the exposure is a disabled demo chat, not data loss or spend — which is why this is Low and not a launch blocker.

## Remediation priority

1. **M4** — set `CSP_ENFORCE=true`. The policy is corrected and verified across 15
   signed-out routes; walk one signed-in workspace page after flipping it, since
   that path couldn't be exercised locally.
2. **M8** — close the quota RPC when convenient. Low severity, and the fix is
   small, but it is the last thing an anonymous stranger can still reach.
3. **Captcha** — not an audit finding, but Supabase's Captcha protection is off
   and accounts are about to open to the public.

Then re-run the advisors after the first week of real traffic. The design that
makes SECURITY DEFINER functions the authorization layer (M7) is sound but
unforgiving: every new RPC has to authorize internally, and the linter won't tell
you which one forgot. Two rules for anyone extending it — never revoke `anon`
EXECUTE on a function used in an RLS policy, and remember the grant usually lives
on `PUBLIC` rather than on `anon`.
