import { describe, it, expect } from "vitest";
import { buildLlmsTxt, type LlmsVendor } from "./llms";
import { SITE_URL } from "./site";
import { GUIDES } from "./guides";
import { TOOLS } from "./tools";

const vendor = (o: Partial<LlmsVendor>): LlmsVendor => ({
  org_id: "id",
  business_name: "Name",
  category: null,
  city: null,
  region: null,
  description: null,
  ...o,
});

describe("buildLlmsTxt", () => {
  it("follows the llms.txt shape: H1 title, then a blockquote summary", () => {
    const [h1, blank, summary] = buildLlmsTxt([]).split("\n");
    expect(h1).toBe("# Bridal Team");
    expect(blank).toBe("");
    expect(summary.startsWith("> ")).toBe(true);
  });

  it("links every free tool and guide by its real URL", () => {
    const txt = buildLlmsTxt([]);
    for (const t of Object.values(TOOLS)) expect(txt).toContain(`(${SITE_URL}${t.href})`);
    for (const g of GUIDES) expect(txt).toContain(`(${SITE_URL}/guides/${g.slug})`);
  });

  it("lists vendors under their category, linked to their profile", () => {
    const txt = buildLlmsTxt([
      vendor({ org_id: "p1", business_name: "Sun Photo", category: "Photography", city: "Fort Lauderdale", region: "FL" }),
      vendor({ org_id: "v1", business_name: "Bay Hall", category: "Venue", description: "Waterfront   ballroom\nfor 200." }),
    ]);
    expect(txt).toContain("### Photography");
    expect(txt).toContain(`- [Sun Photo](${SITE_URL}/v/p1): Fort Lauderdale, FL`);
    // Description flattened to one line so it can't break the list.
    expect(txt).toContain(`- [Bay Hall](${SITE_URL}/v/v1): Waterfront ballroom for 200.`);
    // Most-booked category first (CATEGORY_ORDER puts Venue before Photography).
    expect(txt.indexOf("### Venue")).toBeLessThan(txt.indexOf("### Photography"));
  });

  it("keeps a vendor's name from breaking the Markdown link", () => {
    const txt = buildLlmsTxt([vendor({ org_id: "x", business_name: "A [b] c", category: "DJ" })]);
    expect(txt).toContain(`- [A b c](${SITE_URL}/v/x)`);
  });

  it("says the directory is being built rather than listing nothing", () => {
    expect(buildLlmsTxt([])).toContain(`${SITE_URL}/for-vendors`);
    expect(buildLlmsTxt([])).not.toContain("### ");
  });
});
