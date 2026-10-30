import { describe, it, expect } from "vitest";
import { hasIndexableContent } from "./vendor-content";

describe("hasIndexableContent", () => {
  it("is false for an imported listing with nothing of its own", () => {
    expect(hasIndexableContent({ description: null, logo_url: null, cover_url: null })).toBe(false);
    expect(hasIndexableContent({ description: "  Photographer  " })).toBe(false);
  });

  it("is true once there's a real description", () => {
    expect(
      hasIndexableContent({
        description: "Documentary wedding photography across Broward and Palm Beach since 2014.",
      }),
    ).toBe(true);
  });

  it("is true with a logo, a cover photo or gallery photos", () => {
    expect(hasIndexableContent({ logo_url: "https://x/logo.png" })).toBe(true);
    expect(hasIndexableContent({ cover_url: "https://x/cover.jpg" })).toBe(true);
    expect(hasIndexableContent({}, 3)).toBe(true);
  });
});
