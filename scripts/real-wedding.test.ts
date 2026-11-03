import { describe, expect, it } from "vitest";
import { publishProblems, storyText, validateStory } from "./real-wedding.mjs";

const good = {
  slug: "sample-couple-2015",
  couple_names: "Sam & Alex Sample",
  wedding_date: "2015-04-11",
  city: "Miami",
  title: "A garden wedding in Miami",
  story: ["First paragraph.", "Second paragraph."],
  cover: "cover.jpg",
  photos: [{ file: "cover.jpg", alt: "The couple under an oak" }],
  vendors: [{ role: "Venue", name: "Sample Gardens" }],
  photographer: "Sample Studio",
};

describe("validateStory", () => {
  it("accepts a complete story", () => {
    expect(validateStory(good)).toEqual([]);
  });

  it("refuses bracketed placeholders, so unknown facts never go live", () => {
    const problems = validateStory({ ...good, story: ["[How they met.]", "Real text."] });
    expect(problems.some((p: string) => p.includes("[How they met.]"))).toBe(true);
  });

  it("requires a photographer credit and alt text", () => {
    const problems = validateStory({ ...good, photographer: "", photos: [{ file: "a.jpg" }] });
    expect(problems).toContain('"photographer" is empty: credit whoever took the photos');
    expect(problems).toContain('photos[0] needs "alt" text describing it');
  });

  it("rejects a malformed slug and date", () => {
    const problems = validateStory({ ...good, slug: "Sam & Alex", wedding_date: "5/5/12" });
    expect(problems.length).toBe(2);
  });
});

describe("publishProblems", () => {
  it("blocks publishing until consent is recorded", () => {
    expect(publishProblems(good).length).toBe(1);
    expect(publishProblems({ ...good, consent: { confirmed_at: "2026-11-03" } })).toEqual([]);
  });
});

describe("storyText", () => {
  it("joins paragraph lists with blank lines", () => {
    expect(storyText(good)).toBe("First paragraph.\n\nSecond paragraph.");
  });
});
