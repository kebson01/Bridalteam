import { describe, it, expect } from "vitest";
import { homeLinks } from "./site-header";

/**
 * The dual-role gap this closes.
 *
 * /dashboard and /vendor each already ask for their own kind of org, and each
 * carries a comment about a user who is "both a couple and a vendor" being
 * sent to the wrong home when the code read whichever org_members row came
 * back first. That bug was found and fixed in both page redirects.
 *
 * The navigation was never fixed the same way. It offered a single
 * "Dashboard" link, and /dashboard forwards a vendor-ONLY user on to /vendor
 * — so single-role vendors arrived at their listing by accident of that
 * redirect, and a dual-role vendor had no link to it anywhere. Their only
 * route was a button on /account headed "Billing".
 *
 * Nothing threw, no page 404'd, and no test failed: the listing was simply
 * unreachable for the one person most likely to own it. That is why this is a
 * test and not a visual check.
 */
describe("homeLinks", () => {
  it("offers BOTH homes to someone who is a couple and a vendor", () => {
    // The case the redirects were fixed for and the nav was not.
    expect(homeLinks({ vendor: true, couple: true })).toEqual([
      { label: "Dashboard", href: "/dashboard" },
      { label: "Vendor account", href: "/vendor" },
    ]);
  });

  it("sends a vendor-only viewer to /vendor, and says so", () => {
    // /dashboard would redirect here anyway, so the destination is not the
    // change — the label is. "Dashboard" named a page they never see.
    expect(homeLinks({ vendor: true, couple: false })).toEqual([
      { label: "Vendor account", href: "/vendor" },
    ]);
  });

  it("leaves a couple-only viewer exactly as they were", () => {
    expect(homeLinks({ vendor: false, couple: true })).toEqual([
      { label: "Dashboard", href: "/dashboard" },
    ]);
  });

  it("falls back to Dashboard alone when roles are unknown", () => {
    // null is "not resolved yet, or the lookup failed". Degrading to today's
    // single link is safe: /dashboard routes a vendor onward and a couple
    // home. Guessing "Vendor account" instead would show a link that
    // redirects to /onboarding for anyone with no vendor org.
    expect(homeLinks(null)).toEqual([{ label: "Dashboard", href: "/dashboard" }]);
  });

  it("never offers a home to someone with no org at all", () => {
    // Both false means onboarding was never completed. /dashboard sends them
    // to /onboarding, which is the right place; /vendor must not be offered,
    // because there is no listing to manage yet.
    const links = homeLinks({ vendor: false, couple: false });
    expect(links.some((l) => l.href === "/vendor")).toBe(false);
    expect(links).toEqual([{ label: "Dashboard", href: "/dashboard" }]);
  });
});
