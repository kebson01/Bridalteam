import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * This endpoint's job is to produce numbers a business decision gets made on,
 * so the failures that matter are the ones that leave it *looking* fine:
 * counting crawlers as couples, accepting invented event names, or storing
 * something the migration promises is not stored.
 */
const insert = vi.fn();
const from = vi.fn(() => ({ insert }));
let adminAvailable = true;

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: () => (adminAvailable ? { from } : null),
}));
vi.mock("@/lib/ai-quota", () => ({ clientIp: () => "203.0.113.1" }));

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

async function post(body: unknown, ua: string = BROWSER_UA) {
  const { POST } = await import("./route");
  return POST(
    new Request("https://bridalteam.com/api/track", {
      method: "POST",
      headers: { "content-type": "application/json", ...(ua ? { "user-agent": ua } : {}) },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.resetModules();
  insert.mockReset().mockResolvedValue({ error: null });
  from.mockClear();
  adminAvailable = true;
});

describe("POST /api/track", () => {
  it("records an allowlisted event", async () => {
    const res = await post({ name: "page_view", path: "/guides/how-to-choose-a-wedding-venue" });
    expect(res.status).toBe(204);
    expect(insert).toHaveBeenCalledWith({
      name: "page_view",
      path: "/guides/how-to-choose-a-wedding-venue",
      source: null,
    });
  });

  it("stores no identifier of any kind", async () => {
    // The migration promises rows cannot be linked to a person. If a future
    // edit adds an ip, user_id or session column "just for debugging", this is
    // what should object.
    await post({ name: "signup_success", source: "instagram" });
    const row = insert.mock.calls[0][0] as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(["name", "path", "source"]);
  });

  it("strips the query string from the path", async () => {
    // Query strings carry UTM values and whatever a referrer appended; the
    // useful part is already recorded as `source`.
    await post({ name: "page_view", path: "/planner?utm_source=meta&utm_content=ad3#top" });
    expect((insert.mock.calls[0][0] as { path: string }).path).toBe("/planner");
  });

  it.each([
    ["Googlebot/2.1 (+http://www.google.com/bot.html)"],
    ["Mozilla/5.0 (compatible; bingbot/2.0)"],
    ["facebookexternalhit/1.1"],
    ["curl/8.4.0"],
    ["python-requests/2.31.0"],
  ])("ignores the crawler %s", async (ua) => {
    // Crawlers run JavaScript. Without this the first thing these numbers
    // measure is search engines indexing 22 guides, which is exactly the
    // traffic that must not be mistaken for couples arriving.
    const res = await post({ name: "page_view", path: "/guides" }, ua);
    expect(res.status).toBe(204);
    expect(insert).not.toHaveBeenCalled();
  });

  it("ignores a request with no user agent at all", async () => {
    await post({ name: "page_view", path: "/" }, "");
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects an event name that is not on the allowlist", async () => {
    await post({ name: "totally_made_up", path: "/" });
    expect(insert).not.toHaveBeenCalled();
  });

  it.each([[null], [123], [{ nested: true }], [undefined]])(
    "rejects a non-string name (%s)",
    async (name) => {
      await post({ name, path: "/" });
      expect(insert).not.toHaveBeenCalled();
    },
  );

  it("rate-limits a flood from one address", async () => {
    // 120/minute. The 121st is dropped, so nobody can inflate the numbers the
    // business steers by just by holding down refresh.
    for (let i = 0; i < 120; i++) await post({ name: "page_view", path: "/" });
    expect(insert).toHaveBeenCalledTimes(120);
    await post({ name: "page_view", path: "/" });
    expect(insert).toHaveBeenCalledTimes(120);
  });

  it("still answers 204 when the service-role key is missing", async () => {
    // It has to keep answering, but silently discarding events would read as
    // "no traffic" rather than "not writing" — the difference between two very
    // different decisions.
    adminAvailable = false;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post({ name: "page_view", path: "/" });
    expect(res.status).toBe(204);
    expect(spy.mock.calls.flat().join(" ")).toMatch(/SUPABASE_SERVICE_ROLE_KEY/);
    spy.mockRestore();
  });

  it("never fails the caller when the insert errors", async () => {
    insert.mockResolvedValue({ error: { code: "XX000", message: "boom" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect((await post({ name: "page_view", path: "/" })).status).toBe(204);
    spy.mockRestore();
  });

  it("never fails the caller on malformed JSON", async () => {
    const { POST } = await import("./route");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await POST(
      new Request("https://bridalteam.com/api/track", {
        method: "POST",
        headers: { "content-type": "application/json", "user-agent": BROWSER_UA },
        body: "{not json",
      }),
    );
    expect(res.status).toBe(204);
    expect(insert).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
