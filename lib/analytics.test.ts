import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { readConsent, writeConsent, resetConsent, CONSENT_EVENT } from "./analytics";

/**
 * Consent is the load-bearing part of the GA change: the privacy page now
 * promises that nothing loads until someone accepts, and that declining
 * sticks. Both claims are storage behaviour, so they are testable — and worth
 * testing, because the failure mode is a policy that misdescribes the product
 * rather than anything a user would notice.
 */
describe("consent storage", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("reports no decision before anyone has chosen", () => {
    expect(readConsent()).toBeNull();
  });

  it("round-trips both decisions", () => {
    writeConsent("granted");
    expect(readConsent()).toBe("granted");
    writeConsent("denied");
    expect(readConsent()).toBe("denied");
  });

  it("treats an unrecognised stored value as no decision", () => {
    // Guards the default: anything we can't read as an explicit yes has to
    // fall back to "not asked", which leaves the tracker off.
    window.localStorage.setItem("bt_consent", "yes-please");
    expect(readConsent()).toBeNull();
  });

  it("forgets the decision when the visitor changes their mind", () => {
    writeConsent("granted");
    resetConsent();
    expect(readConsent()).toBeNull();
  });

  it("announces a change so the loader and banner stay in step", () => {
    const seen: unknown[] = [];
    const onChange = (e: Event) => seen.push((e as CustomEvent).detail);
    window.addEventListener(CONSENT_EVENT, onChange);
    writeConsent("granted");
    writeConsent("denied");
    resetConsent();
    window.removeEventListener(CONSENT_EVENT, onChange);
    expect(seen).toEqual(["granted", "denied", null]);
  });

  it("survives storage throwing, and stays off", () => {
    // Safari's private mode throws on both read and write. A throw must read
    // as "no consent" — failing open here would track people who never agreed.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => writeConsent("granted")).not.toThrow();
    expect(readConsent()).toBeNull();
  });
});
