import { describe, expect, it, vi, beforeEach } from "vitest";

const rows = vi.fn();
const query = {
  select: vi.fn(() => query),
  eq: vi.fn(() => query),
  is: vi.fn(() => query),
  order: vi.fn(() => query),
  limit: vi.fn(() => rows()),
};
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({ from: () => query }) }));
const recordPeopleCheck = vi.fn();
vi.mock("@/lib/people-check", () => ({ recordPeopleCheck: (...a: unknown[]) => recordPeopleCheck(...a) }));

import { POST } from "./route";

const SECRET = "s".repeat(40);
const req = (auth?: string) =>
  new Request("https://bridalteam.com/api/cron/people-check", { method: "POST", headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  rows.mockReset();
  recordPeopleCheck.mockReset();
  query.is.mockClear();
  process.env.CRON_SECRET = SECRET;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("POST /api/cron/people-check", () => {
  it("hides itself without the right secret", async () => {
    expect((await POST(req())).status).toBe(404);
    expect((await POST(req("Bearer wrong"))).status).toBe(404);
    expect(rows).not.toHaveBeenCalled();
  });

  it("checks the unchecked feed photos and counts the answers", async () => {
    rows.mockResolvedValue({
      data: [
        { id: "a", image_url: "https://x/a.jpg" },
        { id: "b", image_url: "https://x/b.jpg" },
        { id: "c", image_url: "https://x/c.jpg" },
      ],
      error: null,
    });
    recordPeopleCheck.mockResolvedValueOnce(true).mockResolvedValueOnce(false).mockResolvedValueOnce(null);

    const res = await POST(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ checked: 3, with_people: 1, without_people: 1, unknown: 1 });
    expect(query.is).toHaveBeenCalledWith("has_people", null);
    expect(recordPeopleCheck.mock.calls.map((c) => c[1])).toEqual(["a", "b", "c"]);
  });
});
