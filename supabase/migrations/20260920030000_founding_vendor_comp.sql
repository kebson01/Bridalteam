-- Founding-vendor comps.
--
-- A plan we grant, as distinct from a plan Stripe sold. The directory launched
-- with no couples in it, so the honest pitch to an early vendor cannot be
-- leads; comping Pro costs nothing while nobody is paying, and it un-hides the
-- one asset a vendor cares most about -- the link to their own website, which
-- the Free tier withholds (lib/tiers.ts).
--
-- Deliberately NOT written into organizations.plan. That column means "what
-- Stripe says", and M1 in SECURITY-AUDIT-MAIN.md rests on it: UPDATE on `plan`
-- was revoked from `authenticated` so a vendor could not award themselves a
-- paid tier. A row reading plan = 'pro' with no stripe_subscription_id is
-- precisely the residue that exploit leaves, so comping through `plan` would
-- make a gift indistinguishable from a theft in the data. Separate columns keep
-- `plan` honest, make every comp greppable, and let comps expire.
--
-- Resolution lives in lib/tiers.ts::effectivePlan(), which takes the higher of
-- the two so a comped vendor who later subscribes to Featured is not dragged
-- back down to a leftover Pro comp.

alter table public.organizations
  add column if not exists comp_plan text,
  add column if not exists comp_expires_at timestamptz,
  add column if not exists comp_note text;

-- Only the paid tiers are comp-able. 'free' as a comp would be meaningless and
-- would read as "downgraded", which is not a thing this column does.
alter table public.organizations
  drop constraint if exists organizations_comp_plan_check;
alter table public.organizations
  add constraint organizations_comp_plan_check
  check (comp_plan is null or comp_plan in ('pro', 'featured'));

comment on column public.organizations.comp_plan is
  'Plan granted without payment (founding vendors). NULL = none. organizations.plan stays whatever Stripe last said; resolve the two with lib/tiers.ts::effectivePlan().';
comment on column public.organizations.comp_expires_at is
  'When the comp lapses. NULL = open-ended. An expired comp falls back to organizations.plan with no further action.';
comment on column public.organizations.comp_note is
  'Why this comp exists, for whoever reads the row in a year. Free text, never shown to the vendor.';

-- No grant to anon or authenticated. Column-level UPDATE privileges are not
-- inherited by columns added later, so the M1 revoke still holds and these are
-- service-role-only by construction -- but that is worth VERIFYING rather than
-- assuming after this runs:
--
--   select column_name from information_schema.column_privileges
--    where table_name = 'organizations' and privilege_type = 'UPDATE'
--      and grantee in ('anon', 'authenticated');
--
-- Expected: name, logo_url, brand_color, cancel_at_period_end -- and no comp_*.
--
-- To grant a comp (service role / SQL editor only):
--
--   update public.organizations
--      set comp_plan = 'pro',
--          comp_expires_at = now() + interval '1 year',
--          comp_note = 'Founding vendor, onboarded by hand Sept 2026'
--    where id = '<org uuid>';
--
-- To end one early, set comp_plan = null.
