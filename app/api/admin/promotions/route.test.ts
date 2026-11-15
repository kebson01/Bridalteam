import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const insert = vi.fn();
const rpc = vi.fn();
let authorized = true;
const client = {
  rpc,
  from: () => ({
    insert: (row: unknown) => {
      insert(row);
      return { select: () => ({ single: async () => ({ data: { id: "new-id" }, error: null }) }) };
    },
  }),
};
vi.mock("@/lib/admin-auth", () => ({
  adminGuard: async () => (authorized ? client : NextResponse.json({ error: "Not authorized." }, { status: 401 })),
  adminUsername: async () => "kebson",
}));

import { POST } from "./route";

const post = (body: unknown) =>
  new Request("https://bridalteam.com/api/admin/promotions", { method: "POST", body: JSON.stringify(body) });
const good = { action: "create", name: "Holiday", plan: "pro", start: "now", end: "2099-12-31", audience: { mode: "all" } };

beforeEach(() => {
  insert.mockReset();
  rpc.mockReset();
  authorized = true;
});

describe("POST /api/admin/promotions", () => {
  it("requires an admin", async () => {
    authorized = false;
    expect((await POST(post(good))).status).toBe(401);
    expect(insert).not.toHaveBeenCalled();
  });

  it("creates a promotion with who set it up", async () => {
    const res = await POST(post(good));
    expect(res.status).toBe(200);
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Holiday", plan: "pro", org_ids: null, categories: null, created_by: "kebson" }),
    );
  });

  it("refuses an invalid promotion without saving it", async () => {
    const res = await POST(post({ ...good, plan: "platinum" }));
    expect(res.status).toBe(400);
    expect(insert).not.toHaveBeenCalled();
  });

  it("counts an audience for the preview", async () => {
    rpc.mockResolvedValue({ data: 42, error: null });
    const res = await POST(post({ action: "preview", audience: { mode: "groups", categories: ["DJ"] } }));
    expect(await res.json()).toEqual({ reach: 42 });
    expect(rpc).toHaveBeenCalledWith("promotion_reach", expect.objectContaining({ p_categories: ["DJ"], p_cities: null }));
  });

  it("rejects unknown actions and ids", async () => {
    expect((await POST(post({ action: "end", id: "nope" }))).status).toBe(400);
    expect((await POST(post({ action: "delete", id: "10000000-0000-0000-0000-000000000001" }))).status).toBe(400);
  });
});
