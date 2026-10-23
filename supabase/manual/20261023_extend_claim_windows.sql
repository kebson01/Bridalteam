-- Extend the claim window for every unclaimed listing.
--
-- Run it by hand in the Supabase SQL editor (service role). It is not a
-- migration and nothing applies it automatically.
--
-- Why: vendor_claims.expires_at defaults to 60 days after a listing was
-- CREATED (20260920040000_claimable_vendor_listings.sql). The listings were
-- created between about 2026-09-20 and 2026-10-20, so their windows close
-- between about 2026-11-19 and 2026-12-19, mostly before outreach reaches the
-- vendor. Once a window closes, neither the claim link nor the email match in
-- claim_listing_by_email() works.
--
-- What it does: sets expires_at to now() + 60 days on every claim that is
-- still unclaimed, unless it already ends later than that. It never shortens a
-- window and never touches a claimed listing. Safe to run twice.
--
-- To use a different length, change both "60 days" below.

begin;

-- Before: unclaimed listings by when their window closes.
select date_trunc('week', expires_at)::date as window_closes_week,
       count(*) as unclaimed
  from public.vendor_claims
 where claimed_at is null
 group by 1 order by 1;

update public.vendor_claims
   set expires_at = now() + interval '60 days'
 where claimed_at is null
   and expires_at < now() + interval '60 days';

-- After: every unclaimed listing should now close on or after this date.
select min(expires_at) as earliest_close,
       max(expires_at) as latest_close,
       count(*)        as unclaimed
  from public.vendor_claims
 where claimed_at is null;

-- Change to ROLLBACK for a dry run that only prints the reports above.
commit;
