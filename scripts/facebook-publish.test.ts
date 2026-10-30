import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { parsePost, publishPost, readQueue } from "./facebook-publish.mjs";

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

describe("parsePost", () => {
  it("accepts a link post and reads publish_at in its own time zone", () => {
    const post = parsePost({ ...base, link: "https://bridalteam.com/" }, dir);
    expect(post.publishAt.toISOString()).toBe("2026-11-05T00:13:00.000Z");
    expect(post.imagePaths).toEqual([]);
  });

  it("resolves images relative to the post's folder", () => {
    expect(parsePost({ ...base, images: ["a.png"] }, dir).imagePaths).toEqual([image]);
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
  ])("rejects %j", (raw, message) => {
    expect(() => parsePost(raw, dir)).toThrow(message);
  });
});

function fakeFetch(responses: object[]) {
  return vi.fn(async () => new Response(JSON.stringify(responses.shift())));
}

describe("publishPost", () => {
  const opts = { pageId: "123", token: "secret" };

  it("posts a link post to the feed", async () => {
    const fetchFn = fakeFetch([{ id: "123_1" }]);
    const post = parsePost({ ...base, link: "https://bridalteam.com/" }, dir);
    expect(await publishPost(post, { ...opts, fetchFn })).toBe("123_1");

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, { body: FormData }];
    expect(url).toMatch(/\/123\/feed$/);
    expect(init.body.get("message")).toBe("Hello");
    expect(init.body.get("link")).toBe("https://bridalteam.com/");
    expect(init.body.get("access_token")).toBe("secret");
  });

  it("posts one image as a photo with the message as caption", async () => {
    const fetchFn = fakeFetch([{ id: "9", post_id: "123_2" }]);
    const post = parsePost({ ...base, images: ["a.png"] }, dir);
    expect(await publishPost(post, { ...opts, fetchFn })).toBe("123_2");

    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, { body: FormData }];
    expect(url).toMatch(/\/123\/photos$/);
    expect(init.body.get("caption")).toBe("Hello");
    expect(init.body.get("source")).toBeInstanceOf(Blob);
  });

  it("uploads several images unpublished, then attaches them to one post", async () => {
    const fetchFn = fakeFetch([{ id: "p1" }, { id: "p2" }, { id: "123_3" }]);
    const post = parsePost({ ...base, images: ["a.png", "a.png"] }, dir);
    expect(await publishPost(post, { ...opts, fetchFn })).toBe("123_3");

    const calls = fetchFn.mock.calls as unknown as [string, { body: FormData }][];
    expect(calls[0][1].body.get("published")).toBe("false");
    expect(calls[2][0]).toMatch(/\/123\/feed$/);
    expect(calls[2][1].body.get("attached_media[0]")).toBe('{"media_fbid":"p1"}');
    expect(calls[2][1].body.get("attached_media[1]")).toBe('{"media_fbid":"p2"}');
  });

  it("throws Facebook's error message", async () => {
    const fetchFn = vi.fn(async () =>
      new Response(JSON.stringify({ error: { message: "Session has expired", code: 190 } }), { status: 400 }),
    );
    const post = parsePost(base, dir);
    await expect(publishPost(post, { ...opts, fetchFn })).rejects.toThrow("Facebook: Session has expired (code 190)");
  });
});

describe("readQueue", () => {
  it("returns posts oldest first and reports broken ones instead of stopping", async () => {
    const queue = path.join(dir, "queue");
    for (const [name, raw] of [
      ["later", { ...base, publish_at: "2026-12-01T09:00:00Z" }],
      ["sooner", { ...base, publish_at: "2026-11-01T09:00:00Z" }],
      ["broken", { message: "no date" }],
    ] as const) {
      await mkdir(path.join(queue, name), { recursive: true });
      await writeFile(path.join(queue, name, "post.json"), JSON.stringify(raw));
    }

    const posts = await readQueue(queue);
    expect(posts.map((p) => p.name)).toEqual(["broken", "sooner", "later"]);
    expect(posts[0].error).toMatch(/publish_at is required/);
  });

  it("treats a missing queue folder as empty", async () => {
    expect(await readQueue(path.join(dir, "nope"))).toEqual([]);
  });
});
