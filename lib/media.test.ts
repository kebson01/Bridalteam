import { describe, expect, it } from "vitest";
import { videoEmbedUrl } from "./media";

describe("videoEmbedUrl", () => {
  it("turns YouTube and Vimeo links into their player URLs", () => {
    expect(videoEmbedUrl("https://www.youtube.com/watch?v=bf1IosW7FV8")).toBe("https://www.youtube.com/embed/bf1IosW7FV8");
    expect(videoEmbedUrl("https://youtu.be/bf1IosW7FV8")).toBe("https://www.youtube.com/embed/bf1IosW7FV8");
    expect(videoEmbedUrl("https://vimeo.com/123456789")).toBe("https://player.vimeo.com/video/123456789");
  });

  it("embeds nothing else", () => {
    expect(videoEmbedUrl("https://example.com/video.mp4")).toBeNull();
    expect(videoEmbedUrl(null)).toBeNull();
  });
});
