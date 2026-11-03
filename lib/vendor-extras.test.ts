import { describe, expect, it } from "vitest";
import {
  formatPrice,
  lowestPrice,
  parseFaqs,
  parseHighlights,
  parsePackages,
  parsePrice,
  parsePriceTier,
  priceTierLabel,
  readPackages,
} from "./vendor-extras";

describe("parseHighlights", () => {
  it("trims, defaults the icon and drops empty rows", () => {
    expect(
      parseHighlights(
        JSON.stringify([
          { icon: "language", title: "  Bilingual ", detail: "English &  Spanish" },
          { icon: "nope", title: "Turnkey service", detail: "" },
          { title: "", detail: "" },
        ]),
      ).value,
    ).toEqual([
      { icon: "language", title: "Bilingual", detail: "English & Spanish" },
      { icon: "star", title: "Turnkey service", detail: null },
    ]);
  });

  it("needs a title and enforces limits", () => {
    expect(parseHighlights([{ detail: "x" }]).error).toBeTruthy();
    expect(parseHighlights([{ title: "x".repeat(41) }]).error).toBeTruthy();
    expect(parseHighlights(Array.from({ length: 7 }, () => ({ title: "a" }))).error).toBeTruthy();
    expect(parseHighlights("not json").error).toBeTruthy();
    expect(parseHighlights("").value).toEqual([]);
  });
});

describe("parsePrice", () => {
  it("reads common ways of typing a price", () => {
    expect(parsePrice("$5,200")).toBe(5200);
    expect(parsePrice("3500.00")).toBe(3500);
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("about 5k")).toBe("invalid");
  });
});

describe("parsePackages", () => {
  it("splits included items by line and keeps one featured package", () => {
    const res = parsePackages([
      { name: "Full-Service", price: "$5,200", includes: "Ceremony arch\n\n12 centerpieces ", featured: true },
      { name: "Intimate", price: "3500", includes: [], featured: true },
      { name: "", price: "", includes: "", description: "" },
    ]);
    expect(res.value).toEqual([
      { name: "Full-Service", price: 5200, description: null, includes: ["Ceremony arch", "12 centerpieces"], featured: true },
      { name: "Intimate", price: 3500, description: null, includes: [], featured: false },
    ]);
  });

  it("allows a package with no price (ask for a quote)", () => {
    expect(parsePackages([{ name: "Custom" }]).value?.[0].price).toBeNull();
  });

  it("rejects a bad price, a missing name and too many items", () => {
    expect(parsePackages([{ name: "A", price: "lots" }]).error).toBeTruthy();
    expect(parsePackages([{ price: "100" }]).error).toBeTruthy();
    expect(parsePackages([{ name: "A", includes: Array.from({ length: 11 }, () => "x") }]).error).toBeTruthy();
  });

  it("puts the featured package first when reading", () => {
    const pkgs = readPackages([
      { name: "A", price: 100, includes: [], featured: false },
      { name: "B", price: 900, includes: [], featured: true },
    ]);
    expect(pkgs.map((p) => p.name)).toEqual(["B", "A"]);
    expect(lowestPrice(pkgs)).toBe(100);
    expect(readPackages("garbage")).toEqual([]);
  });
});

describe("parseFaqs", () => {
  it("needs both halves", () => {
    expect(parseFaqs([{ q: "How far ahead?", a: "12 months." }]).value).toHaveLength(1);
    expect(parseFaqs([{ q: "How far ahead?", a: "" }]).error).toBeTruthy();
    expect(parseFaqs([{ q: "", a: "" }]).value).toEqual([]);
  });
});

describe("price tier", () => {
  it("accepts 1 to 4 only", () => {
    expect(parsePriceTier("3")).toBe(3);
    expect(parsePriceTier("")).toBeNull();
    expect(parsePriceTier("9")).toBeNull();
    expect(priceTierLabel(3)).toBe("$$$");
    expect(priceTierLabel(null)).toBeNull();
    expect(formatPrice(5200)).toBe("$5,200");
  });
});
