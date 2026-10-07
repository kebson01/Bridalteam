import { describe, it, expect } from "vitest";
import { effectivePlan, entitlements } from "./tiers";

/**
 * `effectivePlan` decides what a vendor can do, so every bug in it is either a
 * paid feature given away or a paid feature withheld from someone who paid.
 * The cases below are the ones where those two outcomes diverge.
 */
const NOW = new Date("2026-09-20T00:00:00Z");
const past = "2026-09-19T23:59:00Z";
const future = "2026-10-20T00:00:00Z";

describe("effectivePlan", () => {
  it("is the paid plan when there is no comp", () => {
    expect(effectivePlan({ plan: "free" }, NOW)).toBe("free");
    expect(effectivePlan({ plan: "pro" }, NOW)).toBe("pro");
    expect(effectivePlan({ plan: "featured" }, NOW)).toBe("featured");
  });

  it("lifts a free vendor to their comped plan", () => {
    // The founding-vendor case: nothing paid, Pro granted.
    expect(effectivePlan({ plan: "free", comp_plan: "pro", comp_expires_at: future }, NOW)).toBe(
      "pro",
    );
  });

  it("never drags a paying vendor DOWN to a lesser comp", () => {
    // A comped vendor who later subscribes to Featured still has the old Pro
    // comp on the row. Preferring the comp would silently strip the tier they
    // are now being charged for — the worst failure this function has.
    expect(
      effectivePlan({ plan: "featured", comp_plan: "pro", comp_expires_at: future }, NOW),
    ).toBe("featured");
  });

  it("falls back to the paid plan once the comp expires", () => {
    expect(effectivePlan({ plan: "free", comp_plan: "pro", comp_expires_at: past }, NOW)).toBe(
      "free",
    );
  });

  it("treats a null expiry as open-ended", () => {
    expect(effectivePlan({ plan: "free", comp_plan: "pro", comp_expires_at: null }, NOW)).toBe(
      "pro",
    );
  });

  it("treats an unparseable expiry as expired, not as forever", () => {
    // Failing toward the lower tier is the safe direction for an entitlement.
    // A malformed timestamp handing out a paid feature in perpetuity is the
    // kind of thing nobody notices, because nothing breaks.
    expect(
      effectivePlan({ plan: "free", comp_plan: "pro", comp_expires_at: "not a date" }, NOW),
    ).toBe("free");
  });

  it("ignores a comp value that is not a real plan", () => {
    expect(
      effectivePlan({ plan: "free", comp_plan: "enterprise", comp_expires_at: future }, NOW),
    ).toBe("free");
  });

  it("is safe on a missing or empty row", () => {
    expect(effectivePlan(null, NOW)).toBe("free");
    expect(effectivePlan(undefined, NOW)).toBe("free");
    expect(effectivePlan({}, NOW)).toBe("free");
  });

  it("lets a Free listing link out to the vendor's own site", () => {
    // The directory is mostly imported businesses that have claimed nothing, so
    // they are on Free by definition. Gating the outbound link would leave a
    // couple on a page with a name, a category and a city and no way to reach
    // anyone -- which is the directory failing at its only job. Flipping
    // free.canLinkSite back to false is what this test exists to catch.
    const ent = entitlements(effectivePlan({ plan: "free" }, NOW));
    expect(ent.canLinkSite).toBe(true);
  });

  it("still sells the paid tiers on work and reach, not on the link", () => {
    // What Free must NOT include, or there is nothing left to charge for.
    const ent = entitlements(effectivePlan({ plan: "free" }, NOW));
    expect(ent.canReceiveInquiries).toBe(false);
    expect(ent.canPostInspiration).toBe(false);
    expect(ent.hasStats).toBe(false);
    expect(ent.galleryLimit).toBe(5);
    expect(ent.badge).toBe(false);
    expect(ent.featuredPlacement).toBe(false);
  });

  it("unlocks exactly what Pro unlocks, for a comped vendor", () => {
    // Now that the outbound link is free, the inquiry inbox and the unlimited
    // gallery are what a comp actually buys -- so those are what this asserts.
    const ent = entitlements(
      effectivePlan({ plan: "free", comp_plan: "pro", comp_expires_at: future }, NOW),
    );
    expect(ent.canReceiveInquiries).toBe(true);
    expect(ent.galleryLimit).toBeNull();
    // Still not Featured: no badge, no top placement.
    expect(ent.badge).toBe(false);
    expect(ent.featuredPlacement).toBe(false);
  });
});
