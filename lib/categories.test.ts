import { describe, expect, it } from "vitest";
import { sortCategories } from "./categories";

describe("sortCategories", () => {
  it("puts commonly hired categories before niche ones, whatever the listing counts", () => {
    const values = ["Cigar roller", "Cigar roller", "Cigar roller", "Photography", "Venue", "Florist"];
    expect(sortCategories(values)).toEqual(["Venue", "Photography", "Florist", "Cigar roller"]);
  });

  it("keeps an unknown category, after the known ones, by listing count", () => {
    const values = ["Balloon art", "Ice sculptor", "Ice sculptor", "Live painter", null];
    expect(sortCategories(values)).toEqual(["Live painter", "Ice sculptor", "Balloon art"]);
  });
});
