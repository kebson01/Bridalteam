import { describe, expect, it } from "vitest";
import { areaOf, areasPresent, isRegionWide, matchesArea } from "./areas";

describe("areaOf", () => {
  it("maps the cities the directory actually holds", () => {
    expect(areaOf("Fort Lauderdale")).toBe("broward");
    expect(areaOf("Miami")).toBe("miami-dade");
    expect(areaOf("Boca Raton")).toBe("palm-beach");
    expect(areaOf("Coconut Grove")).toBe("miami-dade");
    expect(areaOf("Wellington")).toBe("palm-beach");
    expect(areaOf("Lauderhill")).toBe("broward");
  });

  it("maps a county name to its own area", () => {
    // 9 listings say "Palm Beach County" and 1 says "Broward County". Treating
    // those as unmapped would drop them out of the area they obviously belong
    // to, which is the whole point of the filter.
    expect(areaOf("Palm Beach County")).toBe("palm-beach");
    expect(areaOf("Broward County")).toBe("broward");
  });

  it("ignores capitalisation and surrounding whitespace", () => {
    // Stored values came from search results with whatever casing they had.
    expect(areaOf("  fort LAUDERDALE ")).toBe("broward");
  });

  it("is null for a region, so a region-wide row is never pinned to one area", () => {
    expect(areaOf("South Florida")).toBeNull();
    expect(areaOf("Florida")).toBeNull();
  });

  it("maps the Keys to their own area, not to Miami-Dade", () => {
    // The directory holds 18 Keys vendors. They are a distinct market, and
    // before this area existed they appeared under no chip at all.
    expect(areaOf("Key West")).toBe("keys");
    expect(areaOf("Key Largo")).toBe("keys");
    expect(areaOf("Islamorada")).toBe("keys");
    expect(areaOf("Marathon")).toBe("keys");
    expect(areaOf("Key West")).not.toBe("miami-dade");
  });

  it("is null for a place outside every mapped area", () => {
    // Hobe Sound is in Martin County. It should show under All and under no
    // area chip, rather than being quietly lumped into Palm Beach.
    expect(areaOf("Hobe Sound")).toBeNull();
    expect(areaOf("Orlando")).toBeNull();
  });

  it("is null for missing or empty input", () => {
    expect(areaOf(null)).toBeNull();
    expect(areaOf(undefined)).toBeNull();
    expect(areaOf("   ")).toBeNull();
  });
});

describe("isRegionWide", () => {
  it("recognises the region names in the data", () => {
    expect(isRegionWide("South Florida")).toBe(true);
    expect(isRegionWide("Southeast Florida")).toBe(true);
    expect(isRegionWide("Florida")).toBe(true);
  });

  it("does not treat a real city as region-wide", () => {
    expect(isRegionWide("Fort Lauderdale")).toBe(false);
    expect(isRegionWide("Palm Beach")).toBe(false);
    // Nearest miss: the county is an area, not the whole region.
    expect(isRegionWide("Palm Beach County")).toBe(false);
  });
});

describe("matchesArea", () => {
  it("includes a city in its own area and excludes it from the others", () => {
    expect(matchesArea("Fort Lauderdale", "broward")).toBe(true);
    expect(matchesArea("Fort Lauderdale", "miami-dade")).toBe(false);
    expect(matchesArea("Fort Lauderdale", "palm-beach")).toBe(false);
  });

  it("shows a region-wide vendor in every area", () => {
    // 29 published listings say "South Florida". A couple filtering to Broward
    // should still see them -- they do serve Broward. This is the assertion
    // that stops the filter hiding a fifth of the directory.
    for (const area of ["broward", "miami-dade", "palm-beach", "keys"] as const) {
      expect(matchesArea("South Florida", area)).toBe(true);
    }
  });

  it("shows an out-of-area vendor in no area", () => {
    for (const area of ["broward", "miami-dade", "palm-beach", "keys"] as const) {
      expect(matchesArea("Hobe Sound", area)).toBe(false);
    }
  });
});

describe("areasPresent", () => {
  it("lists only areas that have a listing, in a stable order", () => {
    expect(areasPresent(["Miami", "Boca Raton", "Miami Beach"])).toEqual([
      "miami-dade",
      "palm-beach",
    ]);
    expect(areasPresent(["Key West", "Fort Lauderdale"])).toEqual(["broward", "keys"]);
  });

  it("is empty when nothing is mapped, so no chip row renders", () => {
    // Region-wide rows alone must not conjure an area chip that filters to
    // exactly the same list.
    expect(areasPresent(["South Florida", "Florida", null])).toEqual([]);
  });
});
