import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { readConsent, writeConsent, clearConsent, analyticsAllowed } from "./consent";

/**
 * This decides whether a third-party tracker runs, so every test here is about
 * the same property: anything other than an explicit, intact "granted" must
 * mean no. Unasked, corrupted, hand-edited, unreadable — all no.
 */
beforeEach(() => localStorage.clear());

describe("analytics consent", () => {
  it("is null before anyone has been asked", () => {
    expect(readConsent()).toBeNull();
    expect(analyticsAllowed()).toBe(false);
  });

  it("round-trips a decision", () => {
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
    expect(analyticsAllowed()).toBe(true);

    writeConsent("denied");
    expect(readConsent()).toBe("denied");
    expect(analyticsAllowed()).toBe(false);
  });

  it("treats a corrupted value as unasked, never as granted", () => {
    // localStorage is same-origin writable, and the failure direction matters:
    // garbage must not switch a tracker on.
    localStorage.setItem("bt_analytics_consent", "yes");
    expect(readConsent()).toBeNull();
    expect(analyticsAllowed()).toBe(false);
  });

  it.each([["GRANTED"], [" granted"], ["true"], ["1"], [""]])(
    "does not accept %s as consent",
    (value) => {
      localStorage.setItem("bt_analytics_consent", value);
      expect(analyticsAllowed()).toBe(false);
    },
  );

  it("clears, so the choice can be revisited", () => {
    writeConsent("granted");
    clearConsent();
    expect(readConsent()).toBeNull();
    expect(analyticsAllowed()).toBe(false);
  });

  describe("when storage throws", () => {
    // Private browsing, disabled storage, exhausted quota.
    let spy: ReturnType<typeof vi.spyOn>;
    beforeEach(() => {
      spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new Error("denied");
      });
    });
    afterEach(() => spy.mockRestore());

    it("fails closed rather than throwing into a render", () => {
      expect(() => readConsent()).not.toThrow();
      expect(readConsent()).toBeNull();
      expect(analyticsAllowed()).toBe(false);
    });
  });

  it("does not throw when a write is refused", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => writeConsent("granted")).not.toThrow();
    spy.mockRestore();
  });
});
