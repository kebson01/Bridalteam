-- The automated claim-your-listing email campaign (lib/outreach/, VENDOR-OUTREACH.md).
--
-- Three tables, all service-role only (RLS on, no policies, grants revoked) --
-- the same posture as vendor_claims. Nothing here is read or written by a
-- signed-in user; the daily run (/api/outreach/run), the Resend webhook and
-- the unsubscribe endpoint all use the service role.
--
--   vendor_outreach        one row per listing we have emailed: where it went,
--                          when, and where it stands. No row = not contacted.
--   outreach_suppressions  addresses that must never be emailed again:
--                          unsubscribes, hard bounces, spam complaints, and the
--                          "do not mail" addresses from VENDOR-PROSPECTS.md.
--                          Keyed by address, not listing, so a business with
--                          two listings cannot be emailed through the second.
--   outreach_events        an append-only log: every send, delivery, bounce,
--                          complaint, open, click, unsubscribe and removal
--                          request. The webhook finds the listing by
--                          message_id here, and the reports are built from it.

create table if not exists public.vendor_outreach (
  org_id uuid primary key references public.organizations(id) on delete cascade,
  email text not null,
  status text not null check (status in (
    'sent',          -- first email out, no follow-up yet
    'followed_up',   -- the one follow-up is out; nothing more will be sent
    'claimed',       -- the vendor claimed the listing; nothing more will be sent
    'bounced',       -- hard bounce; address suppressed
    'complained',    -- marked as spam; address suppressed
    'unsubscribed',  -- address suppressed
    'invalid'        -- the address's domain takes no mail (no MX); never sent
  )),
  first_sent_at timestamptz,
  followup_sent_at timestamptz,
  last_message_id text,
  detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vendor_outreach_status_idx on public.vendor_outreach (status, first_sent_at);
create index if not exists vendor_outreach_email_idx on public.vendor_outreach (lower(email));

create table if not exists public.outreach_suppressions (
  email text primary key check (email = lower(email)),
  reason text not null check (reason in ('unsubscribed', 'bounced', 'complained', 'do_not_mail', 'manual')),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.outreach_events (
  id bigint generated always as identity primary key,
  org_id uuid references public.organizations(id) on delete set null,
  email text,
  kind text not null check (kind in (
    'sent_first', 'sent_followup', 'send_failed', 'invalid_address',
    'delivered', 'opened', 'clicked', 'bounced', 'soft_bounced', 'complained',
    'unsubscribed', 'removal_requested', 'paused',
    'resumed'  -- inserted by hand after fixing whatever paused the campaign; resets its health counts
  )),
  message_id text,
  detail jsonb,
  created_at timestamptz not null default now()
);

create index if not exists outreach_events_message_idx on public.outreach_events (message_id) where message_id is not null;
create index if not exists outreach_events_kind_idx on public.outreach_events (kind, created_at);

alter table public.vendor_outreach enable row level security;
alter table public.outreach_suppressions enable row level security;
alter table public.outreach_events enable row level security;

-- By name as well as from PUBLIC: Supabase grants table privileges to anon and
-- authenticated directly through default privileges (see the note in
-- 20261006210000_claim_listing_by_email.sql), so revoking from PUBLIC alone
-- would leave them in place.
revoke all on public.vendor_outreach, public.outreach_suppressions, public.outreach_events
  from public, anon, authenticated;

-- Addresses VENDOR-PROSPECTS.md flags "do not mail": personal-looking
-- addresses, and addresses that belong to a different business than the one
-- they were found next to. Most are not anyone's contact_email, so this is
-- belt and braces; it also stops a later import from attaching one.
insert into public.outreach_suppressions (email, reason, note)
select e, 'do_not_mail', 'Flagged in VENDOR-PROSPECTS.md'
  from unnest(array[
    'alexlquijano@gmail.com', 'andy.mroc@gmail.com', 'barb_vinson@yahoo.com', 'barbvesco@me.com',
    'events@petalproductions.com', 'froberts6@cfl.rr.com', 'goldt3@comcast.net', 'htiano@gmail.com',
    'info@paulvesco.com', 'info@sweetbyholly.com', 'kellie_lefever@hotmail.com', 'kellieramsey2018@gmail.com',
    'lizoliver914@gmail.com', 'makeup_michele@yahoo.com', 'marcofotografiadigital@gmail.com',
    'mfpalmieri@gmail.com', 'mina.naddaf@gmail.com', 'naplesmidtownflowers@gmail.com',
    'rainbowpatti2020@gmail.com', 'rosyfigueroa7@gmail.com', 'rschilling6@comcast.net',
    'solour.music@gmail.com', 'stewart685@gmail.com', 'stoddardgirls@gmail.com',
    'studio@aboutfacedesignteam.com', 'wolbd@aol.com'
  ]) as t(e)
on conflict (email) do nothing;

comment on table public.vendor_outreach is
  'Automated claim-your-listing email campaign: one row per emailed listing. Service role only. See lib/outreach/ and VENDOR-OUTREACH.md.';
comment on table public.outreach_suppressions is
  'Addresses never to email again (unsubscribe, bounce, complaint, do-not-mail). Checked before every send.';
comment on table public.outreach_events is
  'Append-only log of campaign sends and Resend webhook events.';
