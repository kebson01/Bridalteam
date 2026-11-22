import { describe, it, expect } from "vitest";
import { parseGoogleTagId, googleTagScriptUrl } from "./google-analytics";

describe("parseGoogleTagId", () => {
  it("accepts a Tag Manager container id and a GA4 measurement id", () => {
    expect(parseGoogleTagId("GTM-N4VPMPR9")).toBe("GTM-N4VPMPR9");
    expect(parseGoogleTagId("  gtm-n4vpmpr9 \n")).toBe("GTM-N4VPMPR9");
    expect(parseGoogleTagId("G-ABC123XYZ9")).toBe("G-ABC123XYZ9");
  });

  it("treats unset or malformed values as off", () => {
    expect(parseGoogleTagId(undefined)).toBeUndefined();
    expect(parseGoogleTagId("")).toBeUndefined();
    expect(parseGoogleTagId("UA-12345-1")).toBeUndefined();
    expect(parseGoogleTagId("G-ABC');alert(1)//")).toBeUndefined();
  });
});

describe("googleTagScriptUrl", () => {
  it("loads gtm.js for a container and gtag.js for a measurement id", () => {
    expect(googleTagScriptUrl("GTM-N4VPMPR9")).toBe(
      "https://www.googletagmanager.com/gtm.js?id=GTM-N4VPMPR9",
    );
    expect(googleTagScriptUrl("G-ABC123XYZ9")).toBe(
      "https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ9",
    );
  });
});
