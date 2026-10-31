import { describe, expect, it } from "vitest";
import {
  METROS,
  type MetroId,
  areaOf,
  areasPresent,
  isRegionWide,
  matchesArea,
  matchesMetro,
  metroOf,
  metrosPresent,
  regionScope,
} from "./areas";

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


describe("metro scoping", () => {
  it("does not leak South Florida vendors into another metro", () => {
    // THE regression this split exists for. 63 published listings say
    // "South Florida" or similar. Under the old flat REGION_WIDE rule they
    // matched every area id, so adding Orlando would have shown all 63 to a
    // couple in Orlando -- with nothing on the page looking wrong.
    expect(matchesMetro("South Florida", "south-florida")).toBe(true);
    expect(matchesMetro("South Florida", "orlando")).toBe(false);
    expect(matchesMetro("South Florida", "tampa")).toBe(false);
    expect(matchesMetro("Southeast Florida", "orlando")).toBe(false);
    expect(matchesMetro("tri-county", "tampa")).toBe(false);
  });

  it("keeps a genuinely statewide vendor in every metro", () => {
    // "Florida" and "statewide" are the only values that really mean
    // everywhere; narrowing them would hide real, reachable vendors.
    for (const m of ["south-florida", "orlando", "tampa"] as const) {
      expect(matchesMetro("Florida", m)).toBe(true);
      expect(matchesMetro("statewide", m)).toBe(true);
    }
  });

  it("scopes each region name to its own metro", () => {
    expect(regionScope("South Florida")).toBe("south-florida");
    expect(regionScope("Central Florida")).toBe("orlando");
    expect(regionScope("Tampa Bay")).toBe("tampa");
    expect(regionScope("Florida")).toBeNull();
  });

  it("maps cities in the new metros", () => {
    expect(metroOf("Orlando")).toBe("orlando");
    expect(metroOf("Winter Park")).toBe("orlando");
    expect(metroOf("Kissimmee")).toBe("orlando");
    expect(metroOf("Tampa")).toBe("tampa");
    expect(metroOf("St Petersburg")).toBe("tampa");
    expect(metroOf("Clearwater")).toBe("tampa");
  });

  it("resolves a South Florida city to its metro through its area", () => {
    // Both maps must agree, so the city->area map is the single source and
    // CITY_METRO never repeats a South Florida city.
    expect(metroOf("Fort Lauderdale")).toBe("south-florida");
    expect(metroOf("Miami")).toBe("south-florida");
    expect(metroOf("Key West")).toBe("south-florida");
  });

  it("is null for a city in no metro", () => {
    expect(metroOf("Hobe Sound")).toBeNull();
    expect(metroOf(null)).toBeNull();
  });

  it("stops an area filter reaching across metros", () => {
    // Broward is a South Florida area; an Orlando vendor must never match it.
    expect(matchesArea("Orlando", "broward")).toBe(false);
    expect(matchesArea("Tampa", "miami-dade")).toBe(false);
    // ...and a South-Florida-wide vendor still does match its own areas.
    expect(matchesArea("South Florida", "broward")).toBe(true);
  });

  it("lists only metros that have listings", () => {
    expect(metrosPresent(["Miami", "Orlando"])).toEqual(["south-florida", "orlando"]);
    expect(metrosPresent(["Tampa"])).toEqual(["tampa"]);
    expect(metrosPresent(["Hobe Sound"])).toEqual([]);
  });

  it("returns no areas for a metro that has none, so the row stays hidden", () => {
    // Orlando and Tampa have no sub-areas yet. A one-chip row would filter
    // nothing while implying it does.
    expect(areasPresent(["Orlando", "Winter Park"], "orlando")).toEqual([]);
    expect(areasPresent(["Tampa", "Clearwater"], "tampa")).toEqual([]);
    expect(areasPresent(["Miami", "Fort Lauderdale"], "south-florida")).toEqual([
      "broward",
      "miami-dade",
    ]);
  });
});

describe("map hygiene", () => {
  it("has no key that could never match a stored city", () => {
    // Two junk keys shipped in the first draft -- "palmharbor" with no space
    // and "wesley_chapel" with an underscore. Neither can ever equal a trimmed,
    // lowercased city, so both silently did nothing. A key with an underscore,
    // or with no separator where the real name has one, is always a typo.
    const cities = [
      "Orlando", "Winter Park", "Kissimmee", "Tampa", "St Petersburg",
      "Clearwater", "Largo", "Tierra Verde", "Saint Cloud", "Winter Springs",
      // Added with the metro listings: each arrived as the stated city of a
      // real listing, and an unmapped one is invisible under every filter.
      "Maitland", "Odessa", "Gulfport", "New Port Richey", "Holiday",
      "Lake Mary", "Sanford", "Ellenton", "Sarasota", "Davenport",
      // The four metros added after Orlando and Tampa.
      "Jacksonville", "Ponte Vedra Beach", "St Augustine", "Amelia Island",
      "Orange Park", "Fernandina Beach", "Nocatee",
      "Naples", "Fort Myers", "Cape Coral", "Bonita Springs", "Marco Island",
      "Melbourne", "Cocoa Beach", "Titusville", "Daytona Beach",
      "New Smyrna Beach", "Ormond Beach", "Palm Coast", "DeLand",
      "South Daytona",
      "Destin", "Santa Rosa Beach", "Pensacola", "Panama City Beach",
      "Fort Walton Beach", "Tallahassee", "30A",
    ];
    for (const c of cities) {
      expect(metroOf(c), `${c} maps to no metro, so it would be invisible under every metro filter`).not.toBeNull();
    }
  });

  it("never puts the same city in two metros", () => {
    // A South Florida city must resolve through its area only; repeating it in
    // CITY_METRO would let the two maps disagree.
    expect(metroOf("Fort Lauderdale")).toBe("south-florida");
    expect(metroOf("Miami")).toBe("south-florida");
    expect(metroOf("Orlando")).toBe("orlando");
    expect(metroOf("Tampa")).toBe("tampa");
  });
});

describe("the metros added after Orlando and Tampa", () => {
  it("puts each city in the metro a couple would look under", () => {
    expect(metroOf("Jacksonville")).toBe("jacksonville");
    expect(metroOf("St Augustine")).toBe("jacksonville");
    expect(metroOf("Amelia Island")).toBe("jacksonville");
    expect(metroOf("Naples")).toBe("southwest");
    expect(metroOf("Fort Myers")).toBe("southwest");
    expect(metroOf("Melbourne")).toBe("space-coast");
    expect(metroOf("Daytona Beach")).toBe("space-coast");
    expect(metroOf("Destin")).toBe("panhandle");
    expect(metroOf("Pensacola")).toBe("panhandle");
  });

  it("keeps Sarasota County with Tampa Bay, not Southwest Florida", () => {
    // Venice and North Port sit between the two markets; a Sarasota couple
    // looks up the bay. Moving them later is a data decision, not a bug.
    for (const c of ["Sarasota", "Bradenton", "Venice", "North Port"]) {
      expect(metroOf(c), c).toBe("tampa");
    }
  });

  it("does not leak a listing from one new metro into another", () => {
    // The failure the two-level filter exists to prevent, now across seven
    // metros rather than three: every pair must be mutually exclusive.
    const sample: Record<MetroId, string> = {
      "south-florida": "Fort Lauderdale",
      southwest: "Naples",
      tampa: "Tampa",
      orlando: "Orlando",
      "space-coast": "Melbourne",
      jacksonville: "Jacksonville",
      panhandle: "Destin",
    };
    for (const [metro, city] of Object.entries(sample)) {
      for (const other of METROS) {
        expect(matchesMetro(city, other.id), `${city} under ${other.id}`).toBe(
          other.id === metro,
        );
      }
    }
  });

  it("scopes each region phrase to its own metro", () => {
    expect(regionScope("Northeast Florida")).toBe("jacksonville");
    expect(regionScope("First Coast")).toBe("jacksonville");
    expect(regionScope("Southwest Florida")).toBe("southwest");
    expect(regionScope("Emerald Coast")).toBe("panhandle");
    expect(regionScope("Space Coast")).toBe("space-coast");
    // And the original leak case still holds with seven metros in play.
    expect(matchesMetro("South Florida", "jacksonville")).toBe(false);
    expect(matchesMetro("Northeast Florida", "south-florida")).toBe(false);
  });

  it("still shows a statewide listing under every metro", () => {
    for (const m of METROS) {
      expect(matchesMetro("Florida", m.id), m.id).toBe(true);
    }
  });
});

describe("a city is not a region", () => {
  /**
   * These four were in REGION_SCOPE as well as CITY_METRO, which made
   * isRegionWide() true for them. A published officiant in Davenport rendered
   * "Serves all of Orlando" instead of "Davenport, FL" -- a claim about reach
   * that the vendor never made.
   */
  it("does not treat a mapped city as region-wide", () => {
    for (const c of ["Winter Haven", "Lakeland", "Davenport", "Haines City"]) {
      expect(isRegionWide(c), `${c} reads as region-wide`).toBe(false);
    }
  });

  it("still resolves those cities to Orlando", () => {
    for (const c of ["Winter Haven", "Lakeland", "Davenport", "Haines City"]) {
      expect(metroOf(c), c).toBe("orlando");
    }
  });
});

describe("cities added for the 2026-10-31 lead import", () => {
  it.each([
    ["Vero Beach", "space-coast"],
    ["Sebring", "orlando"],
    ["Lake Wales", "orlando"],
    ["St. Augustine", "jacksonville"],
  ])("%s -> %s", (city, metro) => {
    expect(metroOf(city)).toBe(metro);
  });
});
