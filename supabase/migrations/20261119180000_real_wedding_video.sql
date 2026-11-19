-- Real Weddings: an optional video, shown as an embedded player on the story
-- page (app/real-weddings/[slug]/page.tsx). Only YouTube and Vimeo links, since
-- those are the players the site's Content-Security-Policy allows in frames.

alter table public.real_weddings
  add column if not exists video_url text;

alter table public.real_weddings
  drop constraint if exists real_weddings_video_url_check;
alter table public.real_weddings
  add constraint real_weddings_video_url_check
  check (
    video_url is null
    or video_url ~ '^https://(www\.)?(youtube\.com/watch\?v=|youtu\.be/|vimeo\.com/)'
  );

comment on column public.real_weddings.video_url is
  'Optional YouTube or Vimeo link for the couple''s wedding video, embedded on the story page.';
