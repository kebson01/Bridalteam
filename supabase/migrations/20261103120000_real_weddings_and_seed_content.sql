-- Real Weddings, and phasing out Bridal Team's own starter content.
--
-- 1. Starter ("seed") content in the inspiration feed.
--    The feed launched with 20 stock photos Bridal Team picked itself
--    (source = 'curated'). They are labeled "Bridal Team Ideas" on the site and
--    are retired as real vendor and couple content arrives: lib/seed-content.ts
--    decides how many stay visible. `retired_at` lets an admin retire one by
--    hand; nothing is deleted, so a retired piece can be brought back.
--
-- 2. Real Weddings.
--    True stories of weddings that happened, told with the couple's permission
--    and their photographer credited. A story is a draft until an admin sets
--    status = 'published', and it cannot be published unless consent has been
--    recorded. Only published stories are readable with the public key.
--
-- 3. A public storage bucket for those stories' photos. Only the service role
--    (scripts/real-wedding.mjs) writes to it; there is no client upload path.

alter table public.inspiration_images
  add column if not exists is_seed boolean not null default false,
  add column if not exists retired_at timestamptz;

comment on column public.inspiration_images.is_seed is
  'Starter content Bridal Team added itself. Labeled on the site and phased out as real content arrives (lib/seed-content.ts).';
comment on column public.inspiration_images.retired_at is
  'Set by an admin to take a seed piece out of the feed by hand. Not a delete: clear it to bring the piece back.';

update public.inspiration_images set is_seed = true where source = 'curated' and is_seed = false;

create table if not exists public.real_weddings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  couple_names text not null,
  wedding_date date not null,
  city text not null,
  venue text,
  title text not null,
  summary text,
  -- Paragraphs separated by blank lines. Plain text, never HTML.
  story text not null,
  cover_url text,
  -- [{ "url": "...", "alt": "..." }]
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array'),
  -- [{ "role": "Venue", "name": "...", "url": "..." }]
  vendors jsonb not null default '[]'::jsonb check (jsonb_typeof(vendors) = 'array'),
  photographer text,
  consent_confirmed_at timestamptz,
  consent_note text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint real_weddings_publish_needs_consent
    check (status = 'draft' or consent_confirmed_at is not null)
);

comment on table public.real_weddings is
  'True wedding stories shown at /real-weddings. Drafts are private; publishing requires recorded consent.';

alter table public.real_weddings enable row level security;

drop policy if exists "Anyone can read published real weddings" on public.real_weddings;
create policy "Anyone can read published real weddings"
  on public.real_weddings for select
  using (status = 'published');

-- No insert/update/delete policies: only the service role writes.

insert into storage.buckets (id, name, public)
values ('real-weddings', 'real-weddings', true)
on conflict (id) do nothing;
