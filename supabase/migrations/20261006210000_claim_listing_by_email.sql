-- Claiming a listing by confirmed email, for vendors recruited over the phone.
--
-- The gap this fills. Most of the vendors worth listing publish a phone number
-- and no email (VENDOR-PROSPECTS.md: 19 of 117 have a number, none has an
-- address). The existing claim flow needs an email to send a token link to, so
-- those vendors could not be onboarded at all.
--
-- The new path is a call: the vendor rings, we find their listing by phone,
-- they read out the address they want to use, and we attach it. They then sign
-- up at the site normally and are offered the listing on arrival.
--
-- ── What authorises the claim, and what does not ────────────────────────────
-- Not the phone number. These numbers come from the businesses' own public
-- websites, so knowing one proves nothing, and caller ID is forgeable. The
-- call is how we LEARN the address; it is not the credential.
--
-- The credential is possession of that inbox, proven by Supabase's own signup
-- confirmation. So the match below is deliberately against
-- auth.users.email_confirmed_at IS NOT NULL -- an account with an unconfirmed
-- address matches nothing. That single condition is what stops someone typing
-- a vendor's address at signup and taking their listing; without it this
-- function would hand any listing to anyone who could spell the email.
--
-- It also means we send no mail of our own. The confirmation email is
-- Supabase's, transactional, and already part of signing up.
--
-- Same definer conventions as 20260920040000_claimable_vendor_listings.sql:
-- search_path pinned, auth.uid() rather than a passed-in id.

-- ── Revoking EXECUTE: from anon BY NAME, not just from PUBLIC ───────────────
-- Supabase sets ALTER DEFAULT PRIVILEGES in `public` granting EXECUTE on new
-- functions to anon, authenticated and service_role DIRECTLY (pg_default_acl,
-- defaclobjtype 'f', shows `anon=X/postgres`). So a fresh function is callable
-- by anon the moment it exists, and `revoke ... from public` does NOT remove
-- that -- the grant is not held by PUBLIC. Validating this migration in a
-- rolled-back transaction caught exactly that: after revoking from PUBLIC,
-- has_function_privilege('anon', ...) was still true.
--
-- This is the mirror of the bug in
-- 20260920050000_claim_vendor_listing_revoke_public_execute.sql, where a grant
-- WAS held by PUBLIC and revoking from anon by name did nothing. The lesson is
-- the same in both directions: assert the end state, never the statement.

-- ---------------------------------------------------------------------------
-- What can this account claim?
-- ---------------------------------------------------------------------------

create or replace function public.claimable_listings_for_me()
returns table (
  org_id uuid,
  business_name text,
  category text,
  city text,
  region text,
  website text
)
language sql
security definer
set search_path to 'public', 'pg_temp'
as $$
  select vp.org_id, vp.business_name, vp.category, vp.city, vp.region, vp.website
    from public.vendor_claims vc
    join public.vendor_profiles vp on vp.org_id = vc.org_id
   where vc.claimed_at is null
     and vc.expires_at > now()
     and vc.contact_email is not null
     and lower(btrim(vc.contact_email)) = (
           select lower(btrim(u.email))
             from auth.users u
            where u.id = auth.uid()
              -- The whole security model in one line; see the header.
              and u.email_confirmed_at is not null
         )
     -- Someone who already has a workspace cannot claim one (see
     -- claim_vendor_listing). Offering it would be a dead end.
     and not exists (select 1 from public.org_members m where m.user_id = auth.uid());
$$;

revoke all on function public.claimable_listings_for_me() from public, anon;
grant execute on function public.claimable_listings_for_me() to authenticated;

-- ---------------------------------------------------------------------------
-- Claiming one
-- ---------------------------------------------------------------------------

create or replace function public.claim_listing_by_email(p_org_id uuid)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_claim public.vendor_claims;
begin
  if v_uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select lower(btrim(u.email)) into v_email
    from auth.users u
   where u.id = v_uid and u.email_confirmed_at is not null;

  if v_email is null then
    raise exception 'Confirm your email address first' using errcode = '42501';
  end if;

  -- Locked for the same reason claim_vendor_listing locks: two clicks a second
  -- apart would both pass the not-yet-claimed check and race to insert.
  select * into v_claim
    from public.vendor_claims
   where org_id = p_org_id
   for update;

  if v_claim.id is null then
    raise exception 'That listing is not available to claim' using errcode = '22023';
  end if;

  if v_claim.claimed_at is not null then
    -- Idempotent for whoever already claimed it.
    if v_claim.claimed_by = v_uid then
      return v_claim.org_id;
    end if;
    raise exception 'That listing has already been claimed' using errcode = '22023';
  end if;

  if v_claim.expires_at <= now() then
    raise exception 'That listing is no longer available to claim' using errcode = '22023';
  end if;

  -- Deliberately re-checked here rather than trusted from the listing step:
  -- the caller passes an org id, so this function must prove the match itself.
  if v_claim.contact_email is null
     or lower(btrim(v_claim.contact_email)) <> v_email then
    raise exception 'That listing is not available to claim' using errcode = '22023';
  end if;

  if exists (select 1 from public.org_members where user_id = v_uid) then
    raise exception 'This account already has a workspace. Sign up with a separate email for your business.'
      using errcode = '22023';
  end if;

  insert into public.org_members (org_id, user_id, role) values (v_claim.org_id, v_uid, 'owner');

  update public.vendor_claims
     set claimed_at = now(), claimed_by = v_uid
   where id = v_claim.id;

  return v_claim.org_id;
end;
$$;

revoke all on function public.claim_listing_by_email(uuid) from public, anon;
grant execute on function public.claim_listing_by_email(uuid) to authenticated;
