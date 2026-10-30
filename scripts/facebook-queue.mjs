// Keeps the queue of Facebook Page posts in marketing/facebook/queue/.
//
// Posting itself happens through the Zapier connector in a Claude session
// (the bridalteam:facebook-posting skill). This script is the part that has
// to be exact: checking every post.json, picking the one post that's due, and
// recording it as posted so it never goes out twice.
//
//   node scripts/facebook-queue.mjs check             list the queue, fail on any broken post
//   node scripts/facebook-queue.mjs next              print the oldest due post as JSON, or null
//   node scripts/facebook-queue.mjs done <name> <id>  record a post as published and move it to posted/
//
// Only Node built-ins, so it runs without `npm ci`.

import { readdir, readFile, writeFile, rename, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const QUEUE_DIR = path.join(root, "marketing", "facebook", "queue");
export const POSTED_DIR = path.join(root, "marketing", "facebook", "posted");

// Zapier fetches images from a public URL. The repository is public and the
// queue is posted from main, so an image's URL is its path on main.
const RAW_BASE = "https://raw.githubusercontent.com/kebson01/bridalteam/main/";

// Zapier's Facebook Pages limits: 10 photos per post, 4 MB per photo.
const MAX_IMAGES = 10;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg"]);

/**
 * Checks a post.json and returns the post with image paths made absolute.
 * Throws with a message that names the problem, so a typo fails `check`
 * instead of the real post.
 *
 * @param {unknown} raw parsed post.json
 * @param {string} postDir the post's folder; image paths are relative to it
 */
export async function parsePost(raw, postDir) {
  if (!raw || typeof raw !== "object") throw new Error("post.json must be a JSON object");
  const { publish_at, message, link, images = [] } = /** @type {Record<string, unknown>} */ (raw);

  if (typeof publish_at !== "string") throw new Error("publish_at is required");
  // A bare "2026-11-04T19:13" would be read in the machine's own clock, often
  // UTC, hours off from what the author meant. Require the offset.
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

  const imagePaths = [];
  for (const rel of images) {
    const abs = path.resolve(postDir, rel);
    if (!abs.startsWith(root + path.sep)) throw new Error(`image is outside the repository: ${rel}`);
    if (!IMAGE_EXTENSIONS.has(path.extname(abs).toLowerCase())) throw new Error(`image must be .png or .jpg: ${rel}`);
    if (!existsSync(abs)) throw new Error(`image not found: ${rel}`);
    if ((await stat(abs)).size > MAX_IMAGE_BYTES) throw new Error(`image is over 4 MB: ${rel}`);
    imagePaths.push(abs);
  }

  return { publishAt, message, link: /** @type {string | undefined} */ (link), imagePaths };
}

/** The public URL Zapier fetches an image from. */
export function publicImageUrl(absPath) {
  return RAW_BASE + path.relative(root, absPath).split(path.sep).map(encodeURIComponent).join("/");
}

/** Reads the queue: one entry per folder, oldest publish_at first, broken ones first of all. */
export async function readQueue(queueDir = QUEUE_DIR) {
  if (!existsSync(queueDir)) return [];
  const entries = await readdir(queueDir, { withFileTypes: true });
  const posts = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const dir = path.join(queueDir, entry.name);
    try {
      const raw = JSON.parse(await readFile(path.join(dir, "post.json"), "utf8"));
      posts.push({ name: entry.name, dir, post: await parsePost(raw, dir) });
    } catch (error) {
      posts.push({ name: entry.name, dir, error: /** @type {Error} */ (error).message });
    }
  }
  return posts.sort((a, b) => (a.post?.publishAt ?? 0) - (b.post?.publishAt ?? 0));
}

/**
 * The single post to publish now: the oldest one whose time has come.
 * One per run on purpose. After a missed day, the backlog drains one post per
 * run instead of landing on the Page in a burst.
 */
export async function nextDue(now = new Date(), queueDir = QUEUE_DIR) {
  const due = (await readQueue(queueDir)).find((p) => p.post && p.post.publishAt <= now);
  if (!due) return null;
  const { post } = due;
  return {
    name: due.name,
    publish_at: post.publishAt.toISOString(),
    message: post.message,
    ...(post.link ? { link: post.link } : {}),
    image_urls: post.imagePaths.map(publicImageUrl),
  };
}

/** Records a published post and moves its folder from queue/ to posted/. */
export async function markDone(name, postId, { queueDir = QUEUE_DIR, postedDir = POSTED_DIR, now = new Date() } = {}) {
  if (!name || name.includes("/") || name.includes("\\") || name.startsWith(".")) throw new Error(`not a post name: ${name}`);
  if (!postId) throw new Error("the Facebook post id is required");
  const dir = path.join(queueDir, name);
  if (!existsSync(path.join(dir, "post.json"))) throw new Error(`no queued post named ${name}`);

  const result = { post_id: postId, posted_at: now.toISOString(), url: `https://www.facebook.com/${postId}` };
  await writeFile(path.join(dir, "result.json"), JSON.stringify(result, null, 2) + "\n");
  await mkdir(postedDir, { recursive: true });
  // Same depth as queue/, so relative image paths in post.json still resolve.
  await rename(dir, path.join(postedDir, name));
  return result;
}

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (command === "check") {
    const queue = await readQueue();
    const now = new Date();
    if (!queue.length) console.log("Queue is empty.");
    let broken = 0;
    for (const { name, post, error } of queue) {
      if (error) {
        console.error(`✗ ${name}: ${error}`);
        broken++;
      } else {
        const when = post.publishAt <= now ? "due now" : `waiting until ${post.publishAt.toISOString()}`;
        console.log(`${post.publishAt <= now ? "✓" : "…"} ${name}: ${when}`);
      }
    }
    if (broken) process.exit(1);
  } else if (command === "next") {
    console.log(JSON.stringify(await nextDue(), null, 2));
  } else if (command === "done") {
    const [name, postId] = args;
    console.log(JSON.stringify(await markDone(name, postId), null, 2));
  } else {
    console.error("usage: node scripts/facebook-queue.mjs check | next | done <name> <post_id>");
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
