# Facebook queue

Posts in this folder go out on the Bridal Team Facebook Page automatically.
The **Facebook queue** workflow (`.github/workflows/facebook-queue.yml`) runs
four times a day. It posts every folder whose `publish_at` has passed, then
moves it to `marketing/facebook/posted/` with a `result.json` holding the
Facebook post link.

To schedule a post, add a folder here. To cancel one, delete its folder
before its time. To change one, edit its `post.json`.

## A post

One folder per post, named `YYYY-MM-DD-short-name`, holding a `post.json`:

```json
{
  "publish_at": "2026-11-04T19:13:00-05:00",
  "message": "The caption. Put the tagged link at the end:\n\nhttps://bridalteam.com/wedding-checklist?utm_source=facebook&utm_medium=social&utm_content=post-checklist",
  "images": ["../../../pinterest/2026-10-29-batch-2/01-wedding-checklist-with-dates.png"]
}
```

- **`publish_at`** must include the time zone: `-05:00` for Eastern
  standard time (November to March), `-04:00` for daylight time. A post goes
  out on the first run after this time, so up to a few hours late.
- **`message`** is the post text. `\n` is a line break.
- **`images`** (optional): up to 10 `.png` or `.jpg` files. Paths are
  relative to the post's folder, so an image can sit in the folder itself or
  be reused from elsewhere in `marketing/`. One image makes a photo post;
  several make one multi-photo post.
- **`link`** (optional, only without images): makes a link post with
  Facebook's preview card. Facebook drops the preview from posts with photos,
  so with images, put the URL in the message instead.

Tag every link with `utm_source=facebook&utm_medium=social&utm_content=…`,
so `page_events` counts the visits per post.

Stories can't be posted from here: Meta's API can't add the link stickers
they rely on. Post Stories from the Facebook app.

## Checking the queue

`node scripts/facebook-publish.mjs --dry-run` lists each post and when it's
due, and fails on any mistake in a `post.json`. In GitHub: **Actions** tab,
then **Facebook queue**, then **Run workflow** with "Check the queue without
posting anything" ticked.

If a post fails (for example an expired token), it stays in the queue and is
retried on the next run, and GitHub emails you about the failed run.

## One-time setup

The workflow needs two GitHub secrets: the Page's ID and a Page access token
that doesn't expire. This takes about 20–30 minutes, and everything in it is
free.

1. **Create a Meta app.** Go to <https://developers.facebook.com>, log in
   with the Facebook account that runs the Bridal Team Page, and choose
   **My Apps**, then **Create app**. Pick the use case for managing a Page
   (named along the lines of "Manage everything on your Page"). Any app name
   works, for example "Bridal Team poster".
2. **Get a user token.** Open the **Graph API Explorer**
   (<https://developers.facebook.com/tools/explorer>). Choose your app at the
   top right and add these permissions: `pages_show_list`,
   `pages_manage_posts` and `pages_read_engagement`. Click
   **Generate Access Token** and allow access to the Bridal Team Page.
3. **Make it long-lived.** Open the **Access Token Debugger**
   (<https://developers.facebook.com/tools/debug/accesstoken>), paste the
   token, click **Debug**, then **Extend Access Token** at the bottom. Copy
   the new token.
4. **Get the Page token and ID.** Back in the Graph API Explorer, paste the
   extended token into the token box and run `GET me/accounts`. Find the
   Bridal Team Page in the result and copy its `id` and its `access_token`.
   A Page token made from an extended user token doesn't expire. To check,
   paste it into the Access Token Debugger: **Expires** should say "Never".
5. **Save both as GitHub secrets.** In the repository on GitHub, open
   **Settings**, then **Secrets and variables**, then **Actions**, then
   **New repository secret**, and add:
   - `FB_PAGE_ID`: the Page `id`;
   - `FB_PAGE_TOKEN`: the Page `access_token`.

   Never paste the token into a file, a commit or a chat.
6. **Test it.** Run the workflow from the Actions tab with the dry-run box
   ticked, then once without it when a post is due.

The token stops working if you change your Facebook password, remove the
app, or stop being an admin of the Page. The next run then fails with an
"expired" or "invalid" error; repeat steps 2–5 to replace it.

While the app is in development mode, it can post only to Pages its own
admins manage, which is all this needs. Meta may still ask for a verified
business or app review; follow its prompts if it does.
