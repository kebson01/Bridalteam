import { describe, it, expect, vi } from "vitest";
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

describe("gaEvent", () => {
  it("sends the event through gtag with beacon transport", async () => {
    const { gaEvent } = await import("./google-analytics");
    const gtag = vi.fn();
    (window as unknown as { gtag?: unknown }).gtag = gtag;
    gaEvent({ name: "generate_lead", params: { lead_source: "vendor_inquiry", vendor_category: "Florist" } });
    expect(gtag).toHaveBeenCalledWith("event", "generate_lead", {
      lead_source: "vendor_inquiry",
      vendor_category: "Florist",
      transport_type: "beacon",
    });
    delete (window as unknown as { gtag?: unknown }).gtag;
  });

  it("is a no-op when the tag isn't loaded, and never throws", async () => {
    const { gaEvent } = await import("./google-analytics");
    expect(() => gaEvent({ name: "sign_up", params: { method: "email" } })).not.toThrow();
    (window as unknown as { gtag?: unknown }).gtag = () => {
      throw new Error("blocked");
    };
    expect(() => gaEvent({ name: "sign_up", params: { method: "email" } })).not.toThrow();
    delete (window as unknown as { gtag?: unknown }).gtag;
  });
});
