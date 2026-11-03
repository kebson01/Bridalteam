import { describe, expect, it } from "vitest";
import { normalizeSocial, readSocialLinks } from "./social";

describe("normalizeSocial", () => {
  it("turns a handle into the platform's profile URL", () => {
    expect(normalizeSocial("instagram", "@DJMikeCooley").url).toBe("https://www.instagram.com/DJMikeCooley");
    expect(normalizeSocial("instagram", "djmikecooley").url).toBe("https://www.instagram.com/djmikecooley");
    expect(normalizeSocial("tiktok", "@DJMikeCooley").url).toBe("https://www.tiktok.com/@DJMikeCooley");
    expect(normalizeSocial("youtube", "mychannel").url).toBe("https://www.youtube.com/@mychannel");
    expect(normalizeSocial("x", "@name").url).toBe("https://x.com/name");
  });

  it("accepts links with or without a scheme, and tidies them", () => {
    expect(normalizeSocial("instagram", "instagram.com/djmikecooley/").url).toBe(
      "https://instagram.com/djmikecooley",
    );
    expect(normalizeSocial("tiktok", "http://www.tiktok.com/@djmikecooley?lang=en").url).toBe(
      "https://www.tiktok.com/@djmikecooley",
    );
    expect(normalizeSocial("facebook", "https://m.facebook.com/SomeVenue").url).toBe(
      "https://m.facebook.com/SomeVenue",
    );
    expect(normalizeSocial("x", "https://twitter.com/name").url).toBe("https://twitter.com/name");
  });

  it("keeps the id on a numeric Facebook profile", () => {
    expect(normalizeSocial("facebook", "https://www.facebook.com/profile.php?id=100012345").url).toBe(
      "https://www.facebook.com/profile.php?id=100012345",
    );
  });

  it("treats a blank field as no link", () => {
    expect(normalizeSocial("instagram", "  ").url).toBeNull();
    expect(normalizeSocial("instagram", null).url).toBeNull();
  });

  it("refuses links to other sites", () => {
    expect(normalizeSocial("instagram", "https://example.com/djmikecooley").error).toBeTruthy();
    expect(normalizeSocial("instagram", "https://instagram.com.evil.example/x").error).toBeTruthy();
    expect(normalizeSocial("instagram", "https://notinstagram.com/x").error).toBeTruthy();
    expect(normalizeSocial("instagram", "https://www.tiktok.com/@x").error).toBeTruthy();
  });

  it("refuses script URLs, credentials and bare homepages", () => {
    expect(normalizeSocial("instagram", "javascript:alert(1)").error).toBeTruthy();
    expect(normalizeSocial("instagram", "https://user:pw@instagram.com/x").error).toBeTruthy();
    expect(normalizeSocial("instagram", "https://www.instagram.com/").error).toBeTruthy();
    expect(normalizeSocial("instagram", "instagram.com").error).toBeTruthy();
  });
});

describe("readSocialLinks", () => {
  it("returns known platforms in a fixed order and drops anything else", () => {
    expect(
      readSocialLinks({
        tiktok: "https://www.tiktok.com/@a",
        instagram: "https://www.instagram.com/a",
        myspace: "https://myspace.com/a",
        facebook: "https://evil.example/a",
      }),
    ).toEqual([
      { platform: "instagram", label: "Instagram", url: "https://www.instagram.com/a" },
      { platform: "tiktok", label: "TikTok", url: "https://www.tiktok.com/@a" },
    ]);
  });

  it("copes with a missing or malformed value", () => {
    expect(readSocialLinks(null)).toEqual([]);
    expect(readSocialLinks([])).toEqual([]);
    expect(readSocialLinks("x")).toEqual([]);
  });
});
