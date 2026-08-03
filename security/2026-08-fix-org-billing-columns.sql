-- Security fix (M1): stop authenticated users from writing their own billing state.
--
-- Problem: `authenticated` had table-level UPDATE on public.organizations, and the
-- UPDATE RLS policy is only `is_org_admin(id)`. Because every vendor is created as
-- their org's owner, any signed-in vendor could self-set plan='featured' (and tamper
-- with the stripe_* columns) directly through the anon client — a free upgrade to the
-- paid tier and corruption of billing reconciliation.
--
-- Fix: revoke blanket UPDATE and re-grant it only on the columns a user legitimately
-- edits. RLS still applies on top (is_org_admin), so a member still can't edit another
-- org. The service_role (Stripe webhook) bypasses column grants, so billing sync is
-- unaffected.
--
-- Apply in the Supabase SQL editor (or via apply_migration) after review. Idempotent.

begin;

revoke update on public.organizations from anon;
revoke update on public.organizations from authenticated;

-- Columns a vendor may edit about their own organization.
grant update (name, logo_url, brand_color) on public.organizations to authenticated;

commit;

-- Verify (should NOT list plan / subscription_status / stripe_* for authenticated):
--   select grantee, column_name from information_schema.column_privileges
--   where table_schema='public' and table_name='organizations'
--     and privilege_type='UPDATE' and grantee in ('anon','authenticated')
--   order by grantee, column_name;
--
-- Functional re-test after applying:
--   * Vendor edits name/logo/brand color  -> succeeds
--   * update({ plan: 'featured' }) as vendor -> 0 rows / permission denied
--   * Stripe checkout completed webhook -> still flips plan to pro/featured
