import { describe, it, expect } from "vitest";
import { cleanPath, isEventName, MAX_FIELD } from "./events";

/**
 * The leak this guards.
 *
 * A claim link's URL *is* its credential, and `vendor_claims` deliberately
 * stores only a SHA-256 so that reading the database cannot reconstruct a
 * working link. Recording page views by full path quietly undid that: a real,
 * live token was found in `page_events.path` as plaintext after the first
 * walkthrough of the claim flow.
 *
 * It was never publicly readable (RLS is on and neither `anon` nor
 * `authenticated` has SELECT), which is exactly why no error and no failing
 * test pointed at it. The value of these assertions is that the next person
 * to add a token-bearing route has to think about it.
 */
describe("cleanPath", () => {
  it("drops a claim token, keeping only that a claim page was opened", () => {
    // The real token from the first walkthrough, redacted at source.
    expect(cleanPath("/claim/byBpTTbetDHkjbaX-84zW9pWQwaH3N5gXK05hNIv52A")).toBe(
      "/claim/[token]",
    );
  });

  it("drops invite and RSVP tokens too", () => {
    // Same model: a bridal-party invite and a guest's personal RSVP link are
    // both reached only by holding the secret in the URL.
    expect(cleanPath("/invite/abc123DEF456-_xyz")).toBe("/invite/[token]");
    expect(cleanPath("/rsvp/household-secret-token")).toBe("/rsvp/[token]");
  });

  it("redacts before truncating, so no prefix of a token survives", () => {
    // Order matters. Capping at MAX_FIELD first would store the opening
    // characters of the secret, which is worse than useless: it narrows a
    // brute force without being any more informative.
    const token = "a".repeat(MAX_FIELD * 2);
    const out = cleanPath(`/claim/${token}`);
    expect(out).toBe("/claim/[token]");
    expect(out).not.toContain("aaa");
  });

  it("redacts the bare route as well", () => {
    expect(cleanPath("/claim")).toBe("/claim/[token]");
  });

  it("does not redact a route that merely starts with the same letters", () => {
    // /claims or /invites would be ordinary pages; only the exact segment is
    // credential-bearing. Over-redacting would silently blind the funnel.
    expect(cleanPath("/claimed-listings")).toBe("/claimed-listings");
    expect(cleanPath("/invitations")).toBe("/invitations");
  });

  it("still strips the query string and fragment", () => {
    // UTM values are recorded separately as `source`; nothing else in a query
    // string is worth keeping, and a referrer can append anything.
    expect(cleanPath("/planner?utm_source=pinterest")).toBe("/planner");
    expect(cleanPath("/guides#budget")).toBe("/guides");
  });

  it("keeps ordinary paths, including deep ones", () => {
    expect(cleanPath("/")).toBe("/");
    expect(cleanPath("/guides/who-pays-for-the-wedding")).toBe(
      "/guides/who-pays-for-the-wedding",
    );
  });

  it("refuses anything that is not a root-relative path", () => {
    // An absolute URL would record another origin; both are junk here.
    expect(cleanPath("https://example.com/claim/secret")).toBeUndefined();
    expect(cleanPath("")).toBeUndefined();
    expect(cleanPath(null)).toBeUndefined();
    expect(cleanPath(undefined)).toBeUndefined();
  });

  it("caps an ordinary long path at MAX_FIELD", () => {
    expect(cleanPath(`/${"x".repeat(MAX_FIELD * 2)}`)).toHaveLength(MAX_FIELD);
  });
});

describe("isEventName", () => {
  it("accepts only the four funnel events", () => {
    expect(isEventName("page_view")).toBe(true);
    expect(isEventName("signup_success")).toBe(true);
    expect(isEventName("whatever")).toBe(false);
    expect(isEventName(null)).toBe(false);
  });
});
