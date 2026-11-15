import { describe, it, expect } from "vitest";
import { modeForKey, isProductionSite, keyAllowed } from "./stripe";

describe("modeForKey", () => {
  it("recognises live and test secret/restricted keys", () => {
    expect(modeForKey("sk_live_abc")).toBe("live");
    expect(modeForKey("rk_live_abc")).toBe("live");
    expect(modeForKey("sk_test_abc")).toBe("test");
    expect(modeForKey("rk_test_abc")).toBe("test");
  });
  it("rejects publishable keys and junk", () => {
    expect(modeForKey("pk_live_abc")).toBeNull();
    expect(modeForKey("")).toBeNull();
    expect(modeForKey(undefined)).toBeNull();
  });
});

describe("isProductionSite", () => {
  it("is only true for a production build on bridalteam.com", () => {
    expect(isProductionSite("production", "https://bridalteam.com")).toBe(true);
    expect(isProductionSite("production", "https://www.bridalteam.com")).toBe(true);
    expect(isProductionSite("development", "https://bridalteam.com")).toBe(false);
    expect(isProductionSite("production", "https://staging.example.app")).toBe(false);
    expect(isProductionSite("production", "http://localhost:3000")).toBe(false);
  });
});

describe("keyAllowed", () => {
  it("refuses test keys on the production site", () => {
    expect(keyAllowed("sk_test_abc", true)).toBe(false);
    expect(keyAllowed("sk_live_abc", true)).toBe(true);
  });
  it("allows either mode elsewhere", () => {
    expect(keyAllowed("sk_test_abc", false)).toBe(true);
    expect(keyAllowed("sk_live_abc", false)).toBe(true);
    expect(keyAllowed("nope", false)).toBe(false);
  });
});
