import { describe, it, expect } from "vitest";
import { TIP_PAGES, tipsFor } from "@/lib/feature-tips";
import { WEDDING_TOOLS } from "@/lib/wedding-tools";

describe("feature tips", () => {
  it("cover every wedding page that has a nav pill", () => {
    const pages = ["overview", "details", ...WEDDING_TOOLS.filter((t) => t.path("w").startsWith("/w/")).map((t) => t.key)];
    for (const p of pages) expect(tipsFor(p), `tips for ${p}`).not.toBeNull();
  });

  it("stay short: 2–4 tips, a short lead and one sentence each", () => {
    for (const page of TIP_PAGES) {
      const t = tipsFor(page)!;
      expect(t.items.length, page).toBeGreaterThanOrEqual(2);
      expect(t.items.length, page).toBeLessThanOrEqual(4);
      for (const tip of t.items) {
        expect(tip.title.length, `${page}: ${tip.title}`).toBeLessThanOrEqual(40);
        expect(tip.body.length, `${page}: ${tip.title}`).toBeLessThanOrEqual(160);
      }
    }
  });

  it("returns null for pages without tips", () => {
    expect(tipsFor("nope")).toBeNull();
    expect(tipsFor("constructor")).toBeNull();
  });
});
