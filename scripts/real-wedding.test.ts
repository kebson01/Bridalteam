import { describe, expect, it } from "vitest";
import { cleanVideoUrl, imageSize, publishProblems, storyText, validateStory } from "./real-wedding.mjs";

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

describe("imageSize", () => {
  it("reads the width and height of a PNG", () => {
    const png = new Uint8Array(24);
    png.set([0x89, 0x50, 0x4e, 0x47], 0);
    png.set([0, 0, 0x07, 0xd0, 0, 0, 0x04, 0x38], 16); // 2000 x 1080
    expect(imageSize(png)).toEqual({ width: 2000, height: 1080 });
  });

  it("finds the frame size of a JPEG after its other segments", () => {
    const jpeg = new Uint8Array([
      0xff, 0xd8, // start of image
      0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, // an APP0 segment to skip
      0xff, 0xc0, 0x00, 0x11, 0x08, 0x08, 0x00, 0x05, 0x56, 0x03, // SOF0: 2048 high, 1366 wide
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ]);
    expect(imageSize(jpeg)).toEqual({ width: 1366, height: 2048 });
  });

  it("returns null for something it can't read", () => {
    expect(imageSize(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });
});

describe("cleanVideoUrl", () => {
  it("strips playlist and autoplay parameters from a YouTube link", () => {
    expect(cleanVideoUrl("https://www.youtube.com/watch?v=bf1IosW7FV8&list=RDbf1IosW7FV8&start_radio=1")).toBe(
      "https://www.youtube.com/watch?v=bf1IosW7FV8",
    );
    expect(cleanVideoUrl("https://youtu.be/bf1IosW7FV8?t=30")).toBe("https://www.youtube.com/watch?v=bf1IosW7FV8");
  });

  it("keeps Vimeo links and refuses other hosts", () => {
    expect(cleanVideoUrl("https://vimeo.com/123456789")).toBe("https://vimeo.com/123456789");
    expect(cleanVideoUrl("https://example.com/video.mp4")).toBeNull();
  });

  it("is checked when a story has a video", () => {
    expect(validateStory({ ...good, video: "https://example.com/v" })).toContain('"video" must be a YouTube or Vimeo link');
    expect(validateStory({ ...good, video: "https://youtu.be/bf1IosW7FV8" })).toEqual([]);
  });
});
