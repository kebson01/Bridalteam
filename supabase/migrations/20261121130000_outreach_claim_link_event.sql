-- Logs claim links emailed from /onboarding to a listing's own contact
-- address, when a vendor signing up types the name of a business we already
-- list (app/onboarding/claim-actions.ts sendClaimLinkToListing). Used to send
-- at most one a day per listing.

alter table public.outreach_events drop constraint if exists outreach_events_kind_check;
alter table public.outreach_events add constraint outreach_events_kind_check check (kind in (
  'sent_first', 'sent_followup', 'sent_final', 'send_failed', 'invalid_address',
  'delivered', 'opened', 'clicked', 'bounced', 'soft_bounced', 'complained',
  'unsubscribed', 'removal_requested', 'paused', 'claim_link_sent',
  'resumed'  -- inserted by hand after fixing whatever paused the campaign; resets its health counts
));
