-- Reminders for guests who were invited and haven't replied.
--
-- The risk here isn't the sending, it's the re-sending: a "Send reminders"
-- button that can be pressed repeatedly is a way to mail someone's wedding
-- guests five times in a minute. So the schema records when each household was
-- last nudged and how many times, and the cooldown is enforced by the query
-- that picks recipients rather than by the UI hiding the button.
alter table public.wedding_guests
  add column if not exists reminded_at    timestamptz,
  add column if not exists reminder_count integer not null default 0;

-- "Invited, still silent, and not nudged recently" is the only query this
-- feature makes, and it runs over one wedding at a time.
create index if not exists wedding_guests_pending_idx
  on public.wedding_guests (wedding_id, responded_at, reminded_at)
  where responded_at is null;

comment on column public.wedding_guests.reminded_at is
  'When a reminder was last emailed. Used to enforce a cooldown so guests cannot be nudged repeatedly.';
comment on column public.wedding_guests.reminder_count is
  'How many reminders this household has been sent, so the couple can see who has been chased and how often.';
