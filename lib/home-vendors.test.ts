import { describe, expect, it } from "vitest";
import { HOME_PICKS, summarizeVendors, type HomeVendorRow } from "./home-vendors";

const row = (o: Partial<HomeVendorRow>): HomeVendorRow => ({
  org_id: o.org_id ?? Math.random().toString(36).slice(2),
  business_name: "Vendor",
  category: "DJ",
  city: "Miami",
  region: "FL",
  description: null,
  logo_url: null,
  cover_url: null,
  featured: false,
  packages_from: null,
  ...o,
});
const LONG = "A description long enough to count as the vendor's own words, not a placeholder.";

describe("summarizeVendors", () => {
  it("counts every published listing, without rounding up", () => {
    expect(summarizeVendors(Array.from({ length: 796 }, () => row({}))).count).toBe(796);
  });

  it("never turns a bare listing into a card", () => {
    expect(summarizeVendors([row({}), row({ cover_url: "/x.jpg" }), row({ description: LONG })]).picks).toEqual([]);
  });

  it("shows Featured vendors first, then vendors with a photo and a description", () => {
    const plain = row({ org_id: "plain", category: "Florist", cover_url: "/a.jpg", description: LONG });
    const feat = row({ org_id: "feat", category: "Venue", cover_url: "/b.jpg", featured: true });
    expect(summarizeVendors([plain, feat]).picks.map((p) => p.org_id)).toEqual(["feat", "plain"]);
  });

  it("shows at most one vendor per type, and at most three", () => {
    const rows = ["Venue", "Venue", "Florist", "DJ", "Caterer"].map((category, i) =>
      row({ org_id: `v${i}`, category, cover_url: "/x.jpg", description: LONG }),
    );
    const picks = summarizeVendors(rows).picks;
    expect(picks).toHaveLength(HOME_PICKS);
    expect(new Set(picks.map((p) => p.category)).size).toBe(HOME_PICKS);
  });

  it("lists types most-often-hired first, with real counts", () => {
    const types = summarizeVendors([row({ category: "DJ" }), row({ category: "Venue" }), row({ category: "Venue" })]).types;
    expect(types[0]).toEqual({ name: "Venue", count: 2 });
    expect(types).toContainEqual({ name: "DJ", count: 1 });
  });
});
