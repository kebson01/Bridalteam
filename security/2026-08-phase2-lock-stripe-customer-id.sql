-- Security fix (M1 — Phase 2): lock stripe_customer_id to the service role.
--
-- Phase 1 (already applied, migration `restrict_org_billing_column_updates`) revoked
-- blanket UPDATE on public.organizations and re-granted only the columns the app
-- writes via the user's authenticated client — which at the time still included
-- `stripe_customer_id`, because checkout wrote it with the user's client.
--
-- Phase 2 moves that write to the service role. The code change in
-- `app/vendor/billing/actions.ts` (startCheckoutFor) now persists stripe_customer_id
-- via `supabaseAdmin()` instead of the user's client, so `authenticated` no longer
-- needs UPDATE on that column. Revoking it closes the last billing-identifier tamper
-- vector (a signed-in vendor pointing their org at another Stripe customer id).
--
-- ⚠️ ORDERING — APPLY ONLY AFTER THE CODE CHANGE IS DEPLOYED.
-- The currently-deployed code writes stripe_customer_id with the user's client. If you
-- run this revoke before the new billing/actions.ts is live, the "create Stripe
-- customer" step of checkout will fail with a permission error for any vendor who
-- doesn't yet have a customer id. Deploy first, verify a checkout, then run this.
--
-- After this runs, `authenticated` keeps UPDATE only on: name, logo_url, brand_color,
-- cancel_at_period_end. The service_role (checkout write + Stripe webhook) bypasses
-- column grants, so billing sync is unaffected. Idempotent.

begin;

revoke update (stripe_customer_id) on public.organizations from authenticated;

commit;

-- Verify — stripe_customer_id must be gone from the authenticated grant list:
--   select grantee, column_name from information_schema.column_privileges
--   where table_schema='public' and table_name='organizations'
--     and privilege_type='UPDATE' and grantee in ('anon','authenticated')
--   order by grantee, column_name;
--   -- expected authenticated: brand_color, cancel_at_period_end, logo_url, name
--
-- Functional re-test after applying:
--   * New vendor starts checkout (creates Stripe customer)  -> succeeds (service role writes id)
--   * Existing vendor starts checkout (reuses customer id)   -> succeeds
--   * Vendor edits name/logo/brand color                     -> succeeds
--   * Vendor cancels/resumes (cancel_at_period_end)          -> succeeds
--   * update({ stripe_customer_id: '...' }) as vendor        -> 0 rows / permission denied
--   * Stripe webhook sets plan/subscription fields           -> still works (service role)
