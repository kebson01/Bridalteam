import { mkdtemp, mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { markDone, nextDue, parsePost, publicImageUrl, readQueue } from "./facebook-queue.mjs";

// parsePost only accepts images inside the repository, so the fixtures live
// in a temp folder under it rather than in the system temp directory.
let dir: string;
let image: string;

beforeAll(async () => {
  dir = await mkdtemp(path.join(__dirname, ".fb-test-"));
  image = path.join(dir, "a.png");
  await writeFile(image, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
});

afterAll(() => rm(dir, { recursive: true, force: true }));

const base = { publish_at: "2026-11-04T19:13:00-05:00", message: "Hello" };

async function queueWith(name: string, posts: [string, object][]) {
  const queue = path.join(dir, name);
  for (const [post, raw] of posts) {
    await mkdir(path.join(queue, post), { recursive: true });
    await writeFile(path.join(queue, post, "post.json"), JSON.stringify(raw));
  }
  return queue;
}

describe("parsePost", () => {
  it("accepts a link post and reads publish_at in its own time zone", async () => {
    const post = await parsePost({ ...base, link: "https://bridalteam.com/" }, dir);
    expect(post.publishAt.toISOString()).toBe("2026-11-05T00:13:00.000Z");
    expect(post.imagePaths).toEqual([]);
  });

  it("resolves images relative to the post's folder", async () => {
    expect((await parsePost({ ...base, images: ["a.png"] }, dir)).imagePaths).toEqual([image]);
  });

  it.each([
    [{ ...base, publish_at: "2026-11-04T19:13:00" }, /time zone/],
    [{ ...base, publish_at: "soon" }, /time zone/],
    [{ ...base, message: " " }, /message is required/],
    [{ ...base, link: "http://bridalteam.com/" }, /https/],
    [{ ...base, link: "https://bridalteam.com/", images: ["a.png"] }, /not both/],
    [{ ...base, images: ["missing.png"] }, /not found/],
    [{ ...base, images: ["../../../../../etc/passwd"] }, /outside the repository/],
    [{ ...base, images: Array(11).fill("a.png") }, /at most 10/],
  ])("rejects %j", async (raw, message) => {
    await expect(parsePost(raw, dir)).rejects.toThrow(message);
  });
});

describe("publicImageUrl", () => {
  it("points at the file on main", () => {
    expect(publicImageUrl(path.join(__dirname, "..", "marketing", "a b.png"))).toBe(
      "https://raw.githubusercontent.com/kebson01/bridalteam/main/marketing/a%20b.png",
    );
  });
});

describe("readQueue", () => {
  it("returns broken posts first, then oldest first", async () => {
    const queue = await queueWith("q1", [
      ["later", { ...base, publish_at: "2026-12-01T09:00:00Z" }],
      ["sooner", { ...base, publish_at: "2026-11-01T09:00:00Z" }],
      ["broken", { message: "no date" }],
    ]);
    const posts = await readQueue(queue);
    expect(posts.map((p) => p.name)).toEqual(["broken", "sooner", "later"]);
    expect(posts[0].error).toMatch(/publish_at is required/);
  });

  it("treats a missing queue folder as empty", async () => {
    expect(await readQueue(path.join(dir, "nope"))).toEqual([]);
  });
});

describe("nextDue", () => {
  it("returns only the oldest due post, with public image URLs", async () => {
    const queue = await queueWith("q2", [
      ["a-first", { ...base, publish_at: "2026-11-01T09:00:00Z", images: ["../../a.png"] }],
      ["b-second", { ...base, publish_at: "2026-11-02T09:00:00Z" }],
      ["c-future", { ...base, publish_at: "2026-12-01T09:00:00Z" }],
    ]);
    const next = await nextDue(new Date("2026-11-03T00:00:00Z"), queue);
    expect(next).toMatchObject({ name: "a-first", message: "Hello" });
    expect(next?.image_urls[0]).toMatch(/^https:\/\/raw\.githubusercontent\.com\/kebson01\/bridalteam\/main\/scripts\/\.fb-test-.*\/a\.png$/);
  });

  it("skips broken posts and returns null when nothing is due", async () => {
    const queue = await queueWith("q3", [
      ["broken", { message: "no date" }],
      ["future", { ...base, publish_at: "2026-12-01T09:00:00Z" }],
    ]);
    expect(await nextDue(new Date("2026-11-03T00:00:00Z"), queue)).toBeNull();
  });
});

describe("markDone", () => {
  it("writes result.json and moves the post to posted/", async () => {
    const queue = await queueWith("q4", [["post", base]]);
    const posted = path.join(dir, "posted4");
    const result = await markDone("post", "123_456", {
      queueDir: queue,
      postedDir: posted,
      now: new Date("2026-11-05T00:20:00Z"),
    });

    expect(result.url).toBe("https://www.facebook.com/123_456");
    expect(existsSync(path.join(queue, "post"))).toBe(false);
    const saved = JSON.parse(await readFile(path.join(posted, "post", "result.json"), "utf8"));
    expect(saved).toEqual({ post_id: "123_456", posted_at: "2026-11-05T00:20:00.000Z", url: "https://www.facebook.com/123_456" });
  });

  it.each([
    ["../escape", "1", /not a post name/],
    ["missing", "1", /no queued post/],
    ["post", "", /post id is required/],
  ])("refuses %s", async (name, id, message) => {
    const queue = await queueWith("q5", [["post", base]]);
    await expect(markDone(name, id, { queueDir: queue, postedDir: path.join(dir, "posted5") })).rejects.toThrow(message);
  });
});
