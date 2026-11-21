import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { findUnclaimedListing, maskEmail, normalizeBusinessName } from "./listing-match";

type Row = Record<string, unknown>;
function fakeAdmin(tables: Record<string, Row[]>) {
  const from = (table: string) => {
    const filters: ((r: Row) => boolean)[] = [];
    const b: Record<string, unknown> = {
      select: () => b,
      limit: () => b,
      ilike: (c: string, pattern: string) => {
        const re = new RegExp(`^${pattern.split("%").map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`, "i");
        filters.push((r) => re.test(String(r[c])));
        return b;
      },
      in: (c: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[c])), b),
      then: (resolve: (v: unknown) => void) => resolve({ data: (tables[table] ?? []).filter((r) => filters.every((f) => f(r))), error: null }),
    };
    return b;
  };
  return { from } as unknown as SupabaseClient;
}

describe("listing match", () => {
  it("normalizes names and masks addresses", () => {
    expect(normalizeBusinessName("Fire-Water  Bars!")).toBe("firewaterbars");
    expect(normalizeBusinessName("Boogietek Photo+Cinema")).toBe(normalizeBusinessName("BOOGIETEK photo cinema"));
    expect(maskEmail("info@sunrise.example")).toBe("in•••@sunrise.example");
    expect(maskEmail("a@x.com")).toBe("a•••@x.com");
  });

  const tables = () => ({
    vendor_profiles: [
      { org_id: "old", business_name: "Fire Water Bars", category: "Bar service", city: "Miami" },
      { org_id: "other", business_name: "Fire Water Events", category: null, city: null },
      { org_id: "taken", business_name: "Hans on Beauty", category: null, city: null },
    ],
    vendor_claims: [
      { org_id: "old", contact_email: "hello@firewater.example", claimed_at: null },
      { org_id: "taken", contact_email: "x@hans.example", claimed_at: null },
    ],
    org_members: [{ org_id: "taken" }],
  });

  it("finds the unclaimed listing with the same name, showing only a masked address", async () => {
    const m = await findUnclaimedListing(fakeAdmin(tables()), "fire water bars");
    expect(m).toEqual({ orgId: "old", businessName: "Fire Water Bars", category: "Bar service", city: "Miami", maskedEmail: "he•••@firewater.example" });
    expect(JSON.stringify(m)).not.toContain("hello@");
  });

  it("ignores listings that are owned, unrelated, have no address, or names too short to mean anything", async () => {
    expect(await findUnclaimedListing(fakeAdmin(tables()), "Hans on Beauty")).toBeNull();
    expect(await findUnclaimedListing(fakeAdmin(tables()), "Fire Water")).toBeNull();
    const t = tables();
    t.vendor_claims[0].contact_email = null as unknown as string;
    expect(await findUnclaimedListing(fakeAdmin(t), "Fire Water Bars")).toBeNull();
    expect(await findUnclaimedListing(fakeAdmin(tables()), "ab")).toBeNull();
  });
});
