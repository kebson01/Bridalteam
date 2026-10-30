# Publishing through Zapier

The Zapier connector's **Facebook Pages** app does the posting. Always look
an action up with `inspect_zapier_actions` before running it: Zapier's action
keys and parameters can change.

## Before the first post of a run

1. **The connection.** `list_zapier_connections` for Facebook Pages must
   show one connection. If there's none, stop: the owner has to reconnect
   Facebook in Zapier. `manage_zapier_connections` gives the link to send them.
2. **The Page.** Inspect **Create Page Post** and resolve its `page`
   parameter (it's a dynamic list). Pick the entry named **Bridal Team**.
   If there's no such entry, or more than one, stop and ask the owner. Never
   guess the Page.
3. **Not posted already.** Run the read action **New Post by You** and look
   at the latest posts. If one matches the post's first line and went up in
   the last 3 days, the post is already live: record it with
   `node scripts/facebook-queue.mjs done <name> <that post's id>` and don't
   post it again. This covers a run that posted but failed before recording
   it.

## The call

Use the write action **Create Page Post** with:

| Parameter | Value |
|---|---|
| `page` | The Bridal Team Page from step 2 |
| `message` | `message` from `facebook-queue.mjs next`, exactly as is |
| `source` | The `image_urls` list (1–10 URLs; every post has at least one) |
| `save_as_draft` | `false` |

The response is `{"results": [{"id": "<pageid>_<postid>"}]}`; that `id` is
the post id. Pass it to `facebook-queue.mjs done`.

Image URLs point at `main` on raw.githubusercontent.com, so the images must be
merged before the post is due. Zapier needs each image under 4 MB, ideally
under 1 MB for PNGs.

## When it fails

| Zapier says | What to do |
|---|---|
| No connection, expired or invalid token | Owner reconnects Facebook in Zapier (`manage_zapier_connections` gives the link) |
| Page not in the list | Owner reconnects and ticks the Bridal Team Page when Facebook asks which Pages to share |
| Image couldn't be fetched | Check the URL opens in a browser; the image may not be on `main` yet |
| Task limit reached | The Zapier plan is out of tasks for the month: tell the owner, and leave the queue as is |

## Usage

Each Zapier action uses tasks from the owner's Zapier plan, and each post
takes a few calls (connection check, Page lookup, duplicate check, post). At
50 posts a month, check the plan's monthly task limit covers it.

## Drafts instead

To put posts in Meta Business Suite's Drafts for the owner to publish by
hand, set `save_as_draft` to `true` (or use **Create Page Post as Draft**).
Use this only when the owner asks for it.
