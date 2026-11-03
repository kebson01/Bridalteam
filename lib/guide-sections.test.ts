import { describe, expect, it } from "vitest";
import { GUIDES, type Guide } from "./guides";
import { FLAGSHIP_SLUG, FOUNDATION_SLUGS, groupGuides } from "./guide-sections";

const all = (s: ReturnType<typeof groupGuides>) =>
  [s.flagship, ...s.foundation, ...s.hiring, ...s.logistics].filter(Boolean).map((g) => g!.slug);

describe("groupGuides", () => {
  it("places every guide exactly once", () => {
    const slugs = all(groupGuides(GUIDES));
    expect(slugs.sort()).toEqual(GUIDES.map((g) => g.slug).sort());
  });

  it("names guides that exist", () => {
    const slugs = new Set(GUIDES.map((g) => g.slug));
    for (const s of [FLAGSHIP_SLUG, ...FOUNDATION_SLUGS]) expect(slugs.has(s), s).toBe(true);
  });

  it("puts every Vendors guide under hiring", () => {
    const { hiring } = groupGuides(GUIDES);
    for (const g of GUIDES.filter((x) => x.category === "Vendors")) {
      expect(hiring.map((h) => h.slug)).toContain(g.slug);
    }
    expect(hiring[0].slug).toBe("when-to-book-wedding-vendors");
  });

  it("files a guide nobody mapped under logistics, not nowhere", () => {
    const extra = { ...GUIDES[0], slug: "brand-new-guide", category: "Planning" } as Guide;
    const s = groupGuides([...GUIDES, extra]);
    expect(s.logistics.map((g) => g.slug)).toContain("brand-new-guide");
  });
});
