// Publishes the posts waiting in marketing/facebook/queue/ to the Bridal Team
// Facebook Page, then moves each one to marketing/facebook/posted/.
//
// The queue folder is the bridge between Claude and the Page: Claude (or
// anyone) adds a folder with a post.json, and the "Facebook queue" workflow
// runs this a few times a day and posts whatever is due. See
// marketing/facebook/queue/README.md for the post format and the one-time
// Meta setup.
//
//   node scripts/facebook-publish.mjs            post everything that's due
//   node scripts/facebook-publish.mjs --dry-run  check the queue, post nothing
//
// Needs FB_PAGE_ID and FB_PAGE_TOKEN in the environment (GitHub secrets in the
// workflow), except for --dry-run. Only Node built-ins: the workflow runs it
// without `npm ci`.

import { readdir, readFile, writeFile, rename, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const QUEUE_DIR = path.join(root, "marketing", "facebook", "queue");
export const POSTED_DIR = path.join(root, "marketing", "facebook", "posted");

// Meta supports each Graph API version for about two years. Bump this when
// Meta's changelog marks it deprecated; the calls used here haven't changed in
// years.
const GRAPH_VERSION = process.env.FB_GRAPH_VERSION || "v23.0";
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

// A multi-photo post takes up to 10 images, the same as the Facebook app.
const MAX_IMAGES = 10;

const IMAGE_TYPES = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };

/**
 * Checks a post.json and returns the post with image paths made absolute.
 * Throws with a message that names the problem, so a typo in the queue fails
 * the dry run instead of the real post.
 *
 * @param {unknown} raw parsed post.json
 * @param {string} postDir the post's folder; image paths are relative to it
 */
export function parsePost(raw, postDir) {
  if (!raw || typeof raw !== "object") throw new Error("post.json must be a JSON object");
  const { publish_at, message, link, images = [] } = /** @type {Record<string, unknown>} */ (raw);

  if (typeof publish_at !== "string") throw new Error("publish_at is required");
  // A bare "2026-11-04T19:13" would be read in the runner's UTC clock, five
  // hours off from what the author meant. Require the offset to be written.
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(publish_at)) {
    throw new Error(`publish_at needs a time zone, e.g. "2026-11-04T19:13:00-05:00" (got "${publish_at}")`);
  }
  const publishAt = new Date(publish_at);
  if (Number.isNaN(publishAt.getTime())) throw new Error(`publish_at is not a date: "${publish_at}"`);

  if (typeof message !== "string" || !message.trim()) throw new Error("message is required");

  if (link !== undefined && (typeof link !== "string" || !/^https:\/\//.test(link))) {
    throw new Error("link must be an https:// URL");
  }
  if (!Array.isArray(images) || images.some((i) => typeof i !== "string")) {
    throw new Error("images must be a list of file paths");
  }
  // Facebook drops the link preview from any post with photos, so a post is
  // either a link post or a photo post. Put the URL in the message instead.
  if (link && images.length) throw new Error("use link or images, not both: with images, put the URL in the message");
  if (images.length > MAX_IMAGES) throw new Error(`at most ${MAX_IMAGES} images per post`);

  const imagePaths = images.map((rel) => {
    const abs = path.resolve(postDir, rel);
    if (!abs.startsWith(root + path.sep)) throw new Error(`image is outside the repository: ${rel}`);
    if (!IMAGE_TYPES[path.extname(abs).toLowerCase()]) throw new Error(`image must be .png or .jpg: ${rel}`);
    if (!existsSync(abs)) throw new Error(`image not found: ${rel}`);
    return abs;
  });

  return { publishAt, message, link: /** @type {string | undefined} */ (link), imagePaths };
}

/** Sends one Graph API call and returns its JSON, or throws Meta's error. */
async function graph(fetchFn, endpoint, form) {
  const res = await fetchFn(`${GRAPH}/${endpoint}`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    // Meta's message names the problem (expired token, missing permission)
    // without echoing the token, so it's safe to print in the Actions log.
    const err = body.error;
    throw new Error(err ? `Facebook: ${err.message} (code ${err.code})` : `Facebook: HTTP ${res.status}`);
  }
  return body;
}

async function photoForm(imagePath, token) {
  const form = new FormData();
  const type = IMAGE_TYPES[path.extname(imagePath).toLowerCase()];
  form.append("source", new Blob([await readFile(imagePath)], { type }), path.basename(imagePath));
  form.append("access_token", token);
  return form;
}

/**
 * Publishes one parsed post to the Page and returns Facebook's post id.
 *
 * - No images: a feed post, with a link preview if `link` is set.
 * - One image: a photo post with the message as its caption.
 * - Several: each photo is uploaded unpublished, then attached to one feed
 *   post, which is how the Graph API makes a multi-photo post.
 *
 * @param {ReturnType<typeof parsePost>} post
 * @param {{ pageId: string, token: string, fetchFn?: typeof fetch }} opts
 */
export async function publishPost(post, { pageId, token, fetchFn = fetch }) {
  const { message, link, imagePaths } = post;

  if (imagePaths.length === 1) {
    const form = await photoForm(imagePaths[0], token);
    form.append("caption", message);
    const body = await graph(fetchFn, `${pageId}/photos`, form);
    return body.post_id || body.id;
  }

  const form = new FormData();
  form.append("message", message);
  if (link) form.append("link", link);

  for (const [i, imagePath] of imagePaths.entries()) {
    const upload = await photoForm(imagePath, token);
    upload.append("published", "false");
    const { id } = await graph(fetchFn, `${pageId}/photos`, upload);
    form.append(`attached_media[${i}]`, JSON.stringify({ media_fbid: id }));
  }

  form.append("access_token", token);
  const body = await graph(fetchFn, `${pageId}/feed`, form);
  return body.id;
}

/** Reads the queue: one entry per folder, oldest publish_at first. */
export async function readQueue(queueDir = QUEUE_DIR) {
  if (!existsSync(queueDir)) return [];
  const entries = await readdir(queueDir, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(queueDir, entry.name);
    try {
      const raw = JSON.parse(await readFile(path.join(dir, "post.json"), "utf8"));
      posts.push({ name: entry.name, dir, post: parsePost(raw, dir) });
    } catch (error) {
      posts.push({ name: entry.name, dir, error: /** @type {Error} */ (error).message });
    }
  }
  return posts.sort((a, b) => (a.post?.publishAt ?? 0) - (b.post?.publishAt ?? 0));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const now = new Date();
  const pageId = process.env.FB_PAGE_ID;
  const token = process.env.FB_PAGE_TOKEN;
  if (!dryRun && (!pageId || !token)) {
    console.error("FB_PAGE_ID and FB_PAGE_TOKEN must be set (GitHub secrets). Use --dry-run to check the queue without them.");
    process.exit(1);
  }

  const queue = await readQueue();
  if (!queue.length) console.log("Queue is empty.");
  let failed = 0;

  for (const { name, dir, post, error } of queue) {
    if (error) {
      console.error(`✗ ${name}: ${error}`);
      failed++;
      continue;
    }
    if (post.publishAt > now) {
      console.log(`… ${name}: waiting until ${post.publishAt.toISOString()}`);
      continue;
    }
    if (dryRun) {
      console.log(`✓ ${name}: due, would post (${post.imagePaths.length} image(s))`);
      continue;
    }
    try {
      const postId = await publishPost(post, { pageId, token });
      const result = { post_id: postId, posted_at: new Date().toISOString(), url: `https://www.facebook.com/${postId}` };
      await writeFile(path.join(dir, "result.json"), JSON.stringify(result, null, 2) + "\n");
      await mkdir(POSTED_DIR, { recursive: true });
      // Same depth as queue/, so relative image paths in post.json still resolve.
      await rename(dir, path.join(POSTED_DIR, name));
      console.log(`✓ ${name}: posted ${result.url}`);
    } catch (e) {
      console.error(`✗ ${name}: ${/** @type {Error} */ (e).message}`);
      failed++;
    }
  }

  // A failure leaves the post in the queue to retry on the next run, and the
  // red run makes GitHub email the repository owner.
  if (failed) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
