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
| M4 | 🟡 Low | No security headers (CSP / HSTS / X-Frame-Options / nosniff) | ✅ Enforcing in production |
| M5 | 🟡 Low | Supabase leaked-password protection (HIBP) disabled | ✅ Enabled |
| M6 | 🟡 Low | `vendor/track` inserts arbitrary `org` stats with service role, unauthenticated | ✅ Fixed |
| M7 | ⚪ Info | 56 SECURITY DEFINER advisor warnings — reviewed, all authorize internally | ✅ Narrowed (25 → 17 anon; 18 since the claim flow) |
| M8 | 🟡 Low | `consume_ai_quota` is anon-callable, so the global AI ceiling can be tripped on purpose | ✅ Closed — both phases |
| M9 | 🔴 High | **Live abuse**: unprotected auth endpoints used for fake signups, credential stuffing and password-reset mail | ✅ Closed — Turnstile live and verified |

> **Status as of 2026-09-18. All nine findings are closed.** M4 enforces in
> production, M8 phase 2 has been applied, and M9 — the one that was live — is
> shut: Cloudflare Turnstile now guards signup, sign-in and password reset, and
> the whole chain was verified end to end by a real password grant at 00:56 UTC.
> Live Supabase security advisors report **0 ERROR-level** findings.
>
> Two caveats worth carrying forward rather than forgetting. The Turnstile wall
> has never been *directly* observed rejecting the attacker — it went quiet
> before the control went live, so what we have is 12h+ of silence against
> earlier 20–53 minute gaps, plus proof the mechanism rejects tokenless requests
> (our own attempts, caught during setup). And per-IP rate limits would not have
> stopped this actor anyway: it rotated Tor exits every ~3 requests. A new row in
> `auth.users` is the signal to watch.

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

**✅ Live and enforcing** (confirmed 2026-09-17). `curl -sI https://bridalteam.com/` returns `content-security-policy`, not `-Report-Only`, carrying both the `frame-src` and `form-action` additions. Worth appreciating what that means: with enforcement on and `frame-src` still missing, `default-src 'self'` would have been blocking every YouTube and Vimeo embed in the inspiration gallery, and Firefox and Safari would have been killing the Stripe checkout redirect.

The header doubles as a deploy fingerprint. No CSP at all = pre-Aug-3 build; `nonce-…` in `script-src` = the Aug 3–24 build that could never have been enforced; `'unsafe-inline'` with no `frame-src` = Aug 24 to Sep 15; `frame-src … youtube … vimeo` = current.

**⬜ One check outstanding:** the 15-route sweep covered signed-out pages only, because a local signed-in session wasn't possible. Open one workspace page and glance at the console for violations.

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

**Re-checked 2026-09-20**, after the claim-your-listing flow added three
functions. Still **0 ERROR-level** advisories. The anon count went 17 → 18, the
new entry being `get_claim_preview` — intentional: the outreach link is opened
before anyone signs in, so the unguessable 32-byte token is what stands in for a
session there. `claim_vendor_listing` is *not* in the anon list, and that took
two attempts.

The first migration said `revoke execute ... from anon` and had no effect,
because EXECUTE on a new function is granted to `PUBLIC`, which `anon` inherits
— the precise trap the closing note of this document warns about. It was caught
by reading `has_function_privilege('anon', …)` back after applying rather than
by reading the SQL, which is the lesson worth keeping: with grants, assert the
end state, never the statement. Fixed in
`supabase/migrations/20260920050000_claim_vendor_listing_revoke_public_execute.sql`.

`vendor_claims` joins `admin_sessions`, `admin_login_attempts` and `ai_usage` as
a fourth RLS-enabled-no-policy INFO lint. Same posture and same reason: no
policies means no one reaches it but the service role and the SECURITY DEFINER
functions.

Two things that analysis turned up, both worth remembering before anyone extends this:

1. **`revoke ... from anon` is usually a no-op here.** Most of these functions grant EXECUTE to `PUBLIC` (`=X/postgres` in `proacl`), not to `anon`, so you must revoke from `public` as well or nothing changes — while `has_function_privilege('anon', …)` keeps reporting `true` and looks like a failed revoke.
2. **13 of the flagged functions are RLS policy predicates** (`can_edit_wedding`, `is_org_member`, `can_see_post`, …). Policy expressions evaluate as the *calling* role, so revoking those from `anon` does not "quiet the linter without behavior change" — it breaks every public read on the site. They must stay.

The **17 remaining anon advisories are all correct and should stay**: those 13 predicates, plus the 4 genuinely public RPCs (`get_public_wedding`, `list_public_registry`, `get_guest_invite`, `submit_guest_rsvp`). `consume_ai_quota` was on this list until M8 phase 2 dropped its anon-reachable overload on 2026-09-18; it is no longer reachable signed-out, so the count fell 18 → 17. The 34 `authenticated` advisories are the design working as intended — those functions are *for* signed-in users.

---

## M8 — 🟡 Low: the anon AI ceiling can be tripped deliberately

*Found 2026-09-14 while working M7, not part of the original audit.*

`consume_ai_quota(p_kind, p_ip)` has to stay executable by `anon`, because `app/api/plan/route.ts` meters anonymous chat through the caller's own Supabase client, and the function reads `auth.uid()` to decide the tier. So it is callable directly at `/rest/v1/rpc/consume_ai_quota` with the publishable key and any `p_ip` the caller likes. Each call inserts a row into `ai_usage`.

The M3 fix stopped this being a *cost* problem — `clientIp()` is no longer forgeable, so an attacker can't mint themselves unlimited real chat turns. What's left is an **availability** problem, and it comes from the M3 backstop itself: `anonChatCeilingExceeded()` counts every `ai_usage` row with a `subject` like `ip:%` in the last 24h and cuts anonymous chat off above `AI_ANON_DAILY_GLOBAL_CAP` (default 1000). Those rows don't have to come from the app. Roughly a thousand direct RPC calls — trivially scripted, no account needed — turn the planner off for every signed-out visitor for a day. The same trick can burn a chosen visitor's 5-a-day bucket by passing their IP, and bloats the table.

**Fix — phase 1 (✅ applied).** Added an overload `consume_ai_quota(p_kind, p_ip, p_uid)` that takes the user id as an argument instead of reading `auth.uid()`, granted to `service_role` **only** (migration `add_service_role_only_consume_ai_quota_with_uid`). `lib/ai-quota.ts` and both API routes now meter through `supabaseAdmin()`, passing the uid from the session and the IP from the trusted proxy hop — both of which the server already had. Quota rows can no longer be written by anyone but us.

**Phase 2 (✅ applied 2026-09-18, migration `drop_anon_reachable_consume_ai_quota`).** The 2-arg overload is gone — [`security/2026-09-phase2-lock-consume-ai-quota.sql`](security/2026-09-phase2-lock-consume-ai-quota.sql). The ordering discipline M1 phase 2 needed was followed: the deploy went first, and the gate was evidence rather than elapsed time — a signed-out chat on `/planner` wrote `ai_usage` row `ip:104.23.248.116` at 22:44:25, proving the routes now meter through the 3-arg version via `supabaseAdmin()` and nothing calls the 2-arg one. Running the drop before that would not have broken chat (metering fails open) but would have left it un-metered, which is a spend risk.

Verified after applying, impersonating the role with `set local role anon`: `to_regprocedure('public.consume_ai_quota(text,text)')` is null, and `anon` holds no EXECUTE on the 3-arg overload. `service_role` keeps it; `anon` and `authenticated` hold nothing. The RPC is no longer reachable at `/rest/v1/rpc/consume_ai_quota` with the publishable key, so `ai_usage` rows can only be written by us.

## M9 — 🔴 High: the auth endpoints are being actively abused

*Found 2026-09-17, in production. Not a theoretical finding — this was happening while it was diagnosed.*

**What.** The site went live around 11 September. By the 17th it had 49 accounts and looked like early organic traction. It wasn't. Reading `auth_logs` and `edge_logs`:

- **Every single `/signup` request** came from a Tor exit or a datacenter IP. Cloudflare reported country `T1` (its code for Tor) across ~14 different exit operators — Emerald Onion, DFRI, Artikel10, Foundation for Applied Privacy, CIA Triad Security, QuxLabs, StealthVM — all sharing one malformed user-agent whose string literally begins with a `"` character, at trust score 29/100, three requests per address before rotating. Exactly one request in 24 hours scored above 90.
- **48 credential-stuffing attempts** against `/token` in 24 hours, same infrastructure.
- **28 password-reset sends** through `/recover` in 24 hours, to addresses the attacker chooses.
- The handful of accounts that *looked* real (business and university domains) were confirmed by **corporate email security scanners** auto-fetching the link — visible as repeated `/verify` hits, one success followed by several "One-time token not found". No human was ever present: confirm and sign-in within 30–60 seconds, then nothing, ever.

**Why it matters more than the fake rows.** The `/recover` abuse means our domain sends unsolicited mail to harvested addresses at scale. That earns spam complaints against our sending reputation, and when that goes, the confirmation emails real customers need start landing in spam — a failure that is slow to notice and slow to undo.

**Fix (🟨 built, not yet active).** Cloudflare Turnstile on all three abused endpoints — signup, login and password reset — wired through `options.captchaToken`. See [`lib/captcha.ts`](lib/captcha.ts) and [`components/auth/captcha.tsx`](components/auth/captcha.tsx). `challenges.cloudflare.com` is added to `script-src`, `frame-src` and `connect-src`, without which the enforcing CSP would silently block the widget.

**⚠️ Two-step activation, and the order is not optional.** Supabase rejects any auth request lacking a token the moment its captcha setting is enabled:

1. Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and deploy. Tokens start flowing; Supabase ignores them, so nothing changes for users.
2. **Then** enable Authentication → Bot and Abuse Protection with the Turnstile *secret* key.

Reversing those steps locks out every real signup and login until the deploy catches up. With no key set the widget doesn't render and the forms behave exactly as before, which is what makes step 1 safe to ship alone.

**Also worth doing:** tighten Authentication → Rate Limits for `/signup`, `/token` and `/recover` (there are no real users to inconvenience), and purge the fake accounts once the tap is closed — not before, or they simply come back.

## Remediation priority

1. **M4's last check** — 🟨 mostly done 2026-09-20, one gap left. The app was
   walked in a real Chromium with `CSP_ENFORCE=true`, built with the production
   flags on (`NEXT_PUBLIC_SHOW_PLANNER_APP`, the vendor directory, a Turnstile
   site key), listening for `securitypolicyviolation`: **38 route loads, 0
   violations**, every response carrying the enforcing header. The same walk
   logged every request the browser attempted and found exactly **one** external
   origin — `challenges.cloudflare.com`, for the Turnstile script, which the
   browser *tried* to fetch, and a fetch attempted is a fetch the policy
   allowed. Five more directives the signed-in surfaces depend on are now
   regression-tested in [`lib/csp.test.ts`](lib/csp.test.ts) (img-src
   blob:/data:/https:, worker-src, manifest-src, font-src, plus a guard that
   fails if any host is added to the policy without a deliberate edit).

   **What is still unchecked:** the pages behind the login gate —
   `/dashboard`, `/onboarding` and `/w/[id]/*` — redirect to `/auth/login`
   without a session, and Supabase now requires a Turnstile token, so no
   session could be minted outside a real browser. They redirected correctly
   with the enforcing header attached, but their own rendered content was never
   loaded. The one external connection unique to them is the Supabase realtime
   websocket (`components/notifications-bell.tsx`,
   `components/community/community.tsx`), which `connect-src` names by deriving
   it from `SUPABASE_URL` rather than hand-typing it — so it cannot drift — and
   which is asserted in the test file. Residual risk is low but not zero:
   **sign in once and glance at the console** to close it for good.
2. **Auth rate limits** — reviewed 2026-09-18 and deliberately left at their
   current values. Worth revisiting before a public announcement, in the units
   the dashboard actually uses: token refresh and verification are per **5
   minutes** there, not per hour as the docs table implies. The highest-value
   field is *sending emails*, because it is the only project-wide limit and the
   only one the Tor actor could not dodge by rotating addresses.
3. **Re-check the Turnstile widget's hostname list** if the site ever moves or
   gains a subdomain. A missing hostname is error `110200`, which Cloudflare
   renders as "Unable to connect to website" — indistinguishable from an ad
   blocker unless you read the code. `components/auth/captcha.tsx` now logs and
   surfaces it.

Then re-run the advisors after the first week of real traffic. The design that
makes SECURITY DEFINER functions the authorization layer (M7) is sound but
unforgiving: every new RPC has to authorize internally, and the linter won't tell
you which one forgot. Two rules for anyone extending it — never revoke `anon`
EXECUTE on a function used in an RLS policy, and remember the grant usually lives
on `PUBLIC` rather than on `anon`.
