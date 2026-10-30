# Facebook queue

Posts waiting to go out on the Bridal Team Facebook Page. The
`bridalteam:facebook-posting` skill plans them a month at a time and
publishes them through the Zapier connector, one post per run, on a
schedule. Each published post moves to `marketing/facebook/posted/` with a
`result.json` holding its Facebook link.

- **Approve** a month's posts by merging its pull request. Only posts on
  `main` are published.
- **Cancel** a post by deleting its folder before its time.
- **Change** a post by editing its `post.json` on `main`.

## A post

One folder per post, named `YYYY-MM-DD-<am|pm>-short-name`, holding a
`post.json`:

```json
{
  "publish_at": "2026-11-04T19:13:00-05:00",
  "message": "The post text. With images, put the tagged link at the end:\n\nhttps://bridalteam.com/wedding-checklist?utm_source=facebook&utm_medium=social&utm_campaign=2026-11&utm_content=2026-11-04-pm-checklist",
  "images": ["../../../pinterest/2026-10-29-batch-2/01-wedding-checklist-with-dates.png"]
}
```

- **`publish_at`** must include the time zone: `-05:00` for Eastern
  standard time (November to March), `-04:00` for daylight time. A post goes
  out on the first run after this time.
- **`message`** is the post text. `\n` is a line break.
- **`images`** (optional): up to 10 `.png` or `.jpg` files, each under 4 MB
  (ideally under 1 MB). Paths are relative to the post's folder, so an image
  can sit in the folder itself or be reused from elsewhere in `marketing/`.
  Zapier fetches them from `main`, so they must be merged before the post is
  due.
- **`link`** (optional, only without images): makes a link post with
  Facebook's preview card. Facebook drops the preview from posts with photos,
  so with images, put the URL in the message instead.

Stories and Facebook groups can't be posted from here. Post those from the
Facebook app.

## Commands

```
node scripts/facebook-queue.mjs check             list the queue, fail on any broken post
node scripts/facebook-queue.mjs next              the one post due now, as JSON (or null)
node scripts/facebook-queue.mjs done <name> <id>  record a post as published
```
