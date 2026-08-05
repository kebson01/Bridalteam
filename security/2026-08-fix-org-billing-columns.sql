-- Security fix (M1): stop authenticated users from writing their own entitlement state.
--
-- Problem: `authenticated` had table-level UPDATE on public.organizations, and the
-- UPDATE RLS policy is only `is_org_admin(id)`. Because every vendor is created as
-- their org's owner, any signed-in vendor could self-set plan='featured' directly
-- through the anon client — a free upgrade to the paid tier.
--
-- Fix: revoke blanket UPDATE and re-grant it only on columns the app legitimately
-- lets a user write. RLS (is_org_admin) still applies on top, so a member still
-- can't edit another org. The service_role (Stripe webhook) bypasses column grants,
-- so billing sync is unaffected.
--
-- IMPORTANT — columns kept user-writable to avoid breaking the LIVE billing flow
-- (these are written via the user's authenticated client in the current code):
--   * stripe_customer_id   -> app/vendor/billing/actions.ts (startCheckoutFor)
--   * cancel_at_period_end -> app/vendor/billing/actions.ts + app/vendor/actions.ts
--   * name, logo_url, brand_color -> vendor branding (safe, non-billing)
--
-- Columns LOCKED (webhook/service-role only) — this is what closes the bypass:
--   * plan, subscription_status, stripe_subscription_id
--
-- Apply in the Supabase SQL editor (or via apply_migration) after review. Idempotent.

begin;

revoke update on public.organizations from anon;
revoke update on public.organizations from authenticated;

grant update (
  name,
  logo_url,
  brand_color,
  stripe_customer_id,
  cancel_at_period_end
) on public.organizations to authenticated;

commit;

-- Verify — the authenticated grant list must NOT contain plan, subscription_status,
-- or stripe_subscription_id:
--   select grantee, column_name from information_schema.column_privileges
--   where table_schema='public' and table_name='organizations'
--     and privilege_type='UPDATE' and grantee in ('anon','authenticated')
--   order by grantee, column_name;
--
-- Functional re-test after applying:
--   * Vendor edits name/logo/brand color              -> succeeds
--   * Vendor starts checkout (sets stripe_customer_id) -> succeeds
--   * Vendor cancels/resumes (cancel_at_period_end)    -> succeeds
--   * update({ plan: 'featured' }) as vendor           -> 0 rows / permission denied
--   * Stripe webhook sets plan=featured on payment     -> still works (service role)
--
-- PHASE 2 (needs a coordinated code change, not done here): move the
-- stripe_customer_id write in billing/actions.ts to the service role, then also
-- revoke UPDATE(stripe_customer_id) from authenticated — it's lower severity
-- (a user pointing their org at another Stripe customer id) but worth closing.
