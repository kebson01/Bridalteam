import { describe, it, expect, beforeEach, vi } from "vitest";
import { parseAttribution, captureAttribution, readAttribution } from "./attribution";

const AD = "https://bridalteam.com/planner?utm_source=facebook&utm_medium=paid_social&utm_campaign=launch_miami_2026_09&utm_content=couples_a1";

describe("parseAttribution", () => {
  it("reads the five UTM fields and the landing path", () => {
    expect(parseAttribution(AD)).toEqual({
      utm_source: "facebook",
      utm_medium: "paid_social",
      utm_campaign: "launch_miami_2026_09",
      utm_content: "couples_a1",
      landing_path: "/planner",
    });
  });

  it("returns null for a page with no campaign markers", () => {
    // Important: an empty record would still count as a first touch and block
    // the real one from ever being written.
    expect(parseAttribution("https://bridalteam.com/planner")).toBeNull();
    expect(parseAttribution("https://bridalteam.com/?ref=someone")).toBeNull();
  });

  it("falls back to a click id when the UTM tags were forgotten", () => {
    const out = parseAttribution("https://bridalteam.com/?fbclid=ABC123");
    expect(out?.click_id).toBe("ABC123");
    expect(out?.landing_path).toBe("/");
  });

  it("keeps the referring host but never the full referring URL", () => {
    const out = parseAttribution(AD, "https://www.facebook.com/some/feed/path?x=1");
    expect(out?.referrer_host).toBe("www.facebook.com");
    expect(JSON.stringify(out)).not.toContain("/some/feed/path");
  });

  it("truncates long values so nothing unbounded reaches the user record", () => {
    const long = "x".repeat(500);
    const out = parseAttribution(`https://bridalteam.com/?utm_source=${long}`);
    expect(out?.utm_source?.length).toBe(120);
  });

  it("survives a malformed URL and a malformed referrer", () => {
    expect(parseAttribution("not a url")).toBeNull();
    expect(parseAttribution(AD, "not a url")?.utm_source).toBe("facebook");
  });
});

describe("captureAttribution / readAttribution", () => {
  function visit(url: string, referrer = "") {
    // jsdom won't navigate; replace the pieces the module reads.
    Object.defineProperty(window, "location", { value: new URL(url), writable: true });
    Object.defineProperty(document, "referrer", { value: referrer, configurable: true });
    captureAttribution();
  }

  beforeEach(() => {
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("captures on the landing page and reads back later", () => {
    visit(AD);
    expect(readAttribution()?.utm_content).toBe("couples_a1");
  });

  it("keeps the first touch when later pages carry no parameters", () => {
    // Belt and braces: a blank page can't overwrite anything anyway, because
    // parseAttribution returns null for it. The guard in captureAttribution is
    // what handles the case below, where a SECOND tagged link arrives.
    visit(AD);
    visit("https://bridalteam.com/auth/signup");
    expect(readAttribution()?.utm_source).toBe("facebook");
  });

  it("keeps the first touch even if a second campaign link is clicked", () => {
    visit(AD);
    visit("https://bridalteam.com/?utm_source=newsletter");
    expect(readAttribution()?.utm_source).toBe("facebook");
  });

  it("records nothing for organic arrivals", () => {
    visit("https://bridalteam.com/planner");
    expect(readAttribution()).toBeNull();
  });

  it("does not throw when storage is unavailable", () => {
    // Safari private mode and hardened browsers throw on access rather than
    // returning null. A signup must not depend on attribution working.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(() => visit(AD)).not.toThrow();
    expect(readAttribution()).toBeNull();
  });

  it("returns null rather than junk if the stored value is corrupt", () => {
    window.sessionStorage.setItem("bt_attribution", "{not json");
    expect(readAttribution()).toBeNull();
    window.sessionStorage.setItem("bt_attribution", "[1,2,3]");
    expect(readAttribution()).toBeNull();
  });
});
