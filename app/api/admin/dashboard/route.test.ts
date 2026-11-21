import { describe, it, expect, vi, beforeEach } from "vitest";
import { claimToken, tokenHash } from "@/lib/outreach/tokens";

const rpc = vi.fn();
const claimUpdates: Record<string, unknown>[] = [];
let profiles: Record<string, unknown>[] = [];

const admin = {
  rpc: (...a: unknown[]) => rpc(...a),
  from: (table: string) => {
    if (table === "vendor_profiles") {
      return { select: () => ({ ilike: () => ({ limit: async () => ({ data: profiles, error: null }) }) }) };
    }
    if (table === "vendor_claims") {
      return { update: (p: Record<string, unknown>) => (claimUpdates.push(p), { eq: () => ({ is: async () => ({ error: null }) }) }) };
    }
    throw new Error(`unexpected table ${table}`);
  },
};
vi.mock("@/lib/admin-auth", () => ({ adminGuard: async () => admin }));

import { POST } from "./route";

const SECRET = "s".repeat(40);
const post = (body: unknown) => POST(new Request("https://bridalteam.com/api/admin/dashboard", { method: "POST", body: JSON.stringify(body) }));

beforeEach(() => {
  rpc.mockReset();
  claimUpdates.length = 0;
  profiles = [];
  process.env.OUTREACH_SECRET = SECRET;
});

describe("POST create_vendor", () => {
  it("creates a draft listing and returns the campaign's claim link", async () => {
    rpc.mockResolvedValue({ data: [{ org_id: "org-1", token: "random" }], error: null });
    const res = await post({ action: "create_vendor", vendor: { business_name: "  Bloom & Vine ", website: "bloomandvine.com", email: "Hello@Bloom.example" } });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.claimUrl).toMatch(new RegExp(`/claim/${claimToken(SECRET, "org-1")}$`));
    expect(json.claimEmail).toBe("hello@bloom.example");
    expect(rpc).toHaveBeenCalledWith("create_claimable_listing", expect.objectContaining({
      p_business_name: "Bloom & Vine",
      p_website: "https://bloomandvine.com",
      p_email: "hello@bloom.example",
      p_note: "Added from the admin dashboard",
    }));
    expect(claimUpdates[0].token_hash).toBe(tokenHash(claimToken(SECRET, "org-1")));
  });

  it("stops at a listing with the same name unless told it's a different business", async () => {
    profiles = [{ org_id: "old", business_name: "BLOOM-and VINE", city: "Miami", status: "published" }];
    rpc.mockResolvedValue({ data: [{ org_id: "org-2", token: "t" }], error: null });
    let res = await post({ action: "create_vendor", vendor: { business_name: "Bloom and Vine" } });
    expect(res.status).toBe(409);
    expect((await res.json()).duplicates[0]).toMatchObject({ orgId: "old", status: "published" });
    expect(rpc).not.toHaveBeenCalled();

    res = await post({ action: "create_vendor", vendor: { business_name: "Bloom and Vine" }, force: true });
    expect(res.status).toBe(200);
    expect(rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects a missing name or a malformed email", async () => {
    expect((await post({ action: "create_vendor", vendor: { business_name: " " } })).status).toBe(400);
    expect((await post({ action: "create_vendor", vendor: { business_name: "Bloom", email: "not-an-email" } })).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });
});
