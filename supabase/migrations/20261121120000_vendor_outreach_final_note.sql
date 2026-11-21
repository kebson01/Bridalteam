-- A final note in the vendor claim campaign: 15 days after the follow-up, to
-- vendors who still haven't claimed (lib/outreach/run.ts, plan.ts). It's the
-- last email a vendor gets.
--
-- Only vendors whose follow-up left room for it get one. Follow-ups sent
-- before this change ended "This is the last email you'll get from me about
-- it", so those rows keep final_allowed = false and are never sent a final
-- note. The new follow-up wording sets it to true when it goes out.

alter table public.vendor_outreach
  add column if not exists final_allowed boolean not null default false,
  add column if not exists final_sent_at timestamptz;

comment on column public.vendor_outreach.final_allowed is
  'True when the follow-up was sent with wording that allows a final note. False for follow-ups that told the vendor they were the last email.';
comment on column public.vendor_outreach.final_sent_at is
  'When the final note went out. Nothing is sent after it.';

alter table public.vendor_outreach drop constraint if exists vendor_outreach_status_check;
alter table public.vendor_outreach add constraint vendor_outreach_status_check check (status in (
  'sent',          -- first email out, no follow-up yet
  'followed_up',   -- follow-up out; a final note follows only if final_allowed
  'final_sent',    -- the final note is out; nothing more will be sent
  'claimed',       -- the vendor claimed the listing; nothing more will be sent
  'bounced',       -- hard bounce; address suppressed
  'complained',    -- marked as spam; address suppressed
  'unsubscribed',  -- address suppressed
  'invalid'        -- the address's domain takes no mail (no MX); never sent
));

alter table public.outreach_events drop constraint if exists outreach_events_kind_check;
alter table public.outreach_events add constraint outreach_events_kind_check check (kind in (
  'sent_first', 'sent_followup', 'sent_final', 'send_failed', 'invalid_address',
  'delivered', 'opened', 'clicked', 'bounced', 'soft_bounced', 'complained',
  'unsubscribed', 'removal_requested', 'paused',
  'resumed'  -- inserted by hand after fixing whatever paused the campaign; resets its health counts
));
