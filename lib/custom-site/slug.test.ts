import { describe, expect, it } from "vitest";
import { namesSlug, randomSuffixSlug, slugCandidates, slugProblemMessage, toSlug } from "@/lib/custom-site/slug";

describe("addresses", () => {
  it("turns typing into a valid address", () => {
    expect(toSlug("  Gene & John  ")).toBe("gene-and-john");
    expect(toSlug("José + María!!")).toBe("jose-maria");
    expect(toSlug("a".repeat(60))).toHaveLength(40);
    expect(toSlug(`${"a".repeat(39)}-b`)).toBe("a".repeat(39));
  });

  it("suggests first names joined by 'and'", () => {
    expect(namesSlug("Gene Smith", "John Doe")).toBe("gene-and-john");
    expect(namesSlug(null, null)).toBe("our-wedding");
  });

  it("offers year and 'wedding' variants when the names are taken", () => {
    expect(slugCandidates("Gene", "John", "2027-06-06")).toEqual([
      "gene-and-john",
      "gene-and-john-2027",
      "gene-and-john-wedding",
      "gene-and-john-wedding-2027",
    ]);
    expect(slugCandidates("Gene", "John", null)).toEqual(["gene-and-john", "gene-and-john-wedding"]);
  });

  it("falls back to a random suffix within 40 characters", () => {
    const s = randomSuffixSlug("x".repeat(50));
    expect(s).toMatch(/^x{34}-[a-z0-9]{5}$/);
  });

  it("explains each refusal", () => {
    expect(slugProblemMessage("taken")).toContain("gene-and-john-2027");
    expect(slugProblemMessage("held")).toContain("30 days");
    expect(slugProblemMessage("weird")).toContain("try another");
  });
});
