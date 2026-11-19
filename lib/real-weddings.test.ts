import { describe, expect, it } from "vitest";
import { formatWeddingDate, photoRows, photographerCredit, storyParagraphs } from "./real-weddings";

describe("formatWeddingDate", () => {
  it("formats the calendar day without shifting it", () => {
    expect(formatWeddingDate("2012-05-05")).toBe("May 5, 2012");
    expect(formatWeddingDate("2014-06-14")).toBe("June 14, 2014");
  });
});

describe("storyParagraphs", () => {
  it("splits on blank lines and folds line breaks inside a paragraph", () => {
    expect(storyParagraphs("One\nline.\n\n  Two.  \n\n\n")).toEqual(["One line.", "Two."]);
  });
});

describe("photographerCredit", () => {
  const venue = { role: "Venue", name: "Stonebridge Golf & Country Club" };
  const michelle = { role: "Photography", name: "Michelle March Photography", url: "https://www.michellemarchphotography.com" };

  it("links the photographer and drops the duplicate vendor entry", () => {
    const out = photographerCredit({ photographer: "Michelle March Photography", vendors: [venue, michelle] });
    expect(out.credit).toEqual({ role: "Photography", name: "Michelle March Photography", url: michelle.url });
    expect(out.otherVendors).toEqual([venue]);
  });

  it("uses the vendor entry when no photographer is named", () => {
    expect(photographerCredit({ photographer: null, vendors: [michelle] }).credit?.url).toBe(michelle.url);
  });

  it("does not attach another business's link to a differently named photographer", () => {
    const out = photographerCredit({ photographer: "Someone Else", vendors: [venue, michelle] });
    expect(out.credit).toEqual({ role: "Photography", name: "Someone Else" });
    expect(out.otherVendors).toEqual([venue, michelle]);
  });

  it("credits an unknown photographer without a link", () => {
    const out = photographerCredit({ photographer: "the couple's wedding photographer", vendors: [venue] });
    expect(out.credit).toEqual({ role: "Photography", name: "the couple's wedding photographer", url: undefined });
  });
});

describe("photoRows", () => {
  const photo = (url: string, width?: number, height?: number) => ({ url, alt: url, width, height });
  const urls = (rows: { url: string }[][]) => rows.map((r) => r.map((p) => p.url));

  it("pairs photos in order and gives a panorama its own row", () => {
    const rows = photoRows([
      photo("a", 2048, 1366),
      photo("b", 1366, 2048),
      photo("c", 1366, 2048),
      photo("pano", 2048, 1080),
      photo("d", 2048, 1366),
    ]);
    expect(urls(rows)).toEqual([["a", "b"], ["c"], ["pano"], ["d"]]);
  });

  it("treats photos without a recorded size as ordinary landscape shots", () => {
    expect(urls(photoRows([photo("a"), photo("b"), photo("c")]))).toEqual([["a", "b"], ["c"]]);
  });
});
