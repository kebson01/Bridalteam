import { describe, expect, it } from "vitest";
import { formatWeddingDate, storyParagraphs } from "./real-weddings";

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
