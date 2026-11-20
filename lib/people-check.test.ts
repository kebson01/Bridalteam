import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { photoHasPeople, recordPeopleCheck } from "./people-check";

const answer = (text: string, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => ({ content: [{ type: "text", text }] }),
    text: async () => text,
  });

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.unstubAllGlobals());

describe("photoHasPeople", () => {
  it("reads a yes or a no", async () => {
    vi.stubGlobal("fetch", answer('{"people": true}'));
    expect(await photoHasPeople("https://example.com/a.jpg")).toBe(true);
    vi.stubGlobal("fetch", answer('Sure: {"people": false}'));
    expect(await photoHasPeople("https://example.com/a.jpg")).toBe(false);
  });

  // Fails closed: anything short of a clear answer keeps the photo off the homepage.
  it("returns null when it can't tell", async () => {
    vi.stubGlobal("fetch", answer("I think so?"));
    expect(await photoHasPeople("https://example.com/a.jpg")).toBeNull();
    vi.stubGlobal("fetch", answer("overloaded", false));
    expect(await photoHasPeople("https://example.com/a.jpg")).toBeNull();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await photoHasPeople("https://example.com/a.jpg")).toBeNull();
  });

  it("doesn't call out without a key or an http image", async () => {
    const f = answer('{"people": false}');
    vi.stubGlobal("fetch", f);
    expect(await photoHasPeople("/media/a.jpg")).toBeNull();
    delete process.env.ANTHROPIC_API_KEY;
    expect(await photoHasPeople("https://example.com/a.jpg")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});

describe("recordPeopleCheck", () => {
  function fakeAdmin() {
    const eq2 = vi.fn().mockResolvedValue({ error: null });
    const eq1 = vi.fn(() => ({ eq: eq2 }));
    const update = vi.fn(() => ({ eq: eq1 }));
    const from = vi.fn(() => ({ update }));
    return { admin: { from } as never, update, eq1, eq2 };
  }

  it("stores the answer, only if the image is still the one checked", async () => {
    vi.stubGlobal("fetch", answer('{"people": false}'));
    const f = fakeAdmin();
    expect(await recordPeopleCheck(f.admin, "img-1", "https://example.com/a.jpg")).toBe(false);
    expect(f.update).toHaveBeenCalledWith({ has_people: false });
    expect(f.eq1).toHaveBeenCalledWith("id", "img-1");
    expect(f.eq2).toHaveBeenCalledWith("image_url", "https://example.com/a.jpg");
  });

  it("leaves the row alone without a clear answer", async () => {
    vi.stubGlobal("fetch", answer("no idea"));
    const f = fakeAdmin();
    expect(await recordPeopleCheck(f.admin, "img-1", "https://example.com/a.jpg")).toBeNull();
    expect(f.update).not.toHaveBeenCalled();
  });
});
