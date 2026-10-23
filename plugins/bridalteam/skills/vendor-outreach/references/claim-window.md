# Opening the claim window

A listing can be claimed (by claim link, or by signing up with the address in
`vendor_claims.contact_email`) only until `vendor_claims.expires_at`. That
date defaults to 60 days after the listing was **created**, which for most
listings is long before anyone contacts the vendor. So the 60 days should start
when we reach out: open the window for a batch just before its first contact.

The window keeps its point: a claim link or an address that ends up with the
wrong person stops working on its own, and only vendors we are actively
talking to can claim at any given time.

## The rule

- **Before the first contact** (call, email or DM) with a batch, the user runs
  the SQL below for exactly those vendors.
- Only unclaimed listings change. The script never shortens a window: if a
  listing already has more than 60 days left, it is left alone.
- A follow-up 5–7 days later falls inside the same window. Don't reopen for it.
- **Reopen only when contact resumes**: a `call back <date>` that lands after
  the window closed, or a vendor who said yes and hasn't claimed by the time
  the window is about to close. Never reopen for a `no`, a deleted listing or a
  `no reply` after the one follow-up.
- Record it: append `window to <date>` (today + 60 days) to the **Sent** cell,
  e.g. `2026-10-23 call; window to 2026-12-22`.

## SQL template (the user runs it, in the Supabase SQL editor)

Fill the `values` list from the batch: the exact business name as it appears in
`VENDOR-PROSPECTS.md`, and the last 10 digits of its phone (or `''` if the row
has none). Escape single quotes in names (`'Little''s Photography'`).

```sql
-- Open a 60-day claim window for this outreach batch. Safe to run twice.
begin;

create temp table batch (business_name text, phone10 text) on commit drop;

insert into batch (business_name, phone10) values
  ('<Business name>', '<10 digits or empty>');

create temp table matched on commit drop as
select b.*, p.org_id,
       count(*) over (partition by b.business_name, b.phone10) as n
  from batch b
  join public.vendor_profiles p
    on p.business_name = b.business_name
   and (b.phone10 = '' or right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10) = b.phone10);

-- Not found (name or phone differs from the file): fix and rerun for these.
select b.business_name from batch b
 where not exists (select 1 from matched m where m.business_name = b.business_name and m.phone10 = b.phone10);

-- Ambiguous (more than one listing matches), skipped:
select business_name, n from matched where n > 1;

-- Already claimed, nothing to do:
select m.business_name from matched m
  join public.vendor_claims c on c.org_id = m.org_id
 where m.n = 1 and c.claimed_at is not null;

update public.vendor_claims c
   set expires_at = now() + interval '60 days'
  from matched m
 where m.n = 1
   and c.org_id = m.org_id
   and c.claimed_at is null
   and c.expires_at < now() + interval '60 days';

-- The batch's windows now:
select m.business_name, c.expires_at
  from matched m join public.vendor_claims c on c.org_id = m.org_id
 where m.n = 1 and c.claimed_at is null
 order by 1;

-- Change to ROLLBACK for a dry run.
commit;
```

If a listing has no `vendor_claims` row at all (created some way other than
`create_claimable_listing`), it isn't claimable by link or email and this
script can't help. Tell the user rather than inserting a claim row yourself.
