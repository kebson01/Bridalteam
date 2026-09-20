import { describe, it, expect } from "vitest";
import robots from "./robots";

describe("robots", () => {
  // `rules` is an array; this config has a single "*" rule.
  const [rule] = robots().rules as Array<{ allow?: string; disallow?: string[] }>;

  it("keeps crawlers out of the claim links", () => {
    // /claim/<token> carries its own credential in the URL. A claim link that
    // reaches a search index is a claim link anyone can use, and the page's own
    // `robots: { index: false }` only applies once a crawler has already
    // fetched it — which is the thing worth preventing.
    expect(rule.disallow).toContain("/claim");
  });

  it("still keeps them out of admin and the API", () => {
    expect(rule.disallow).toContain("/admin");
    expect(rule.disallow).toContain("/api/");
  });

  it("leaves the rest of the site crawlable", () => {
    // /vendors was once disallowed, back when it 404'd behind a flag. A vendor
    // listing that Google cannot see is the entire free tier's value gone, so
    // this asserts the blanket allow is still there.
    expect(rule.allow).toBe("/");
    expect(rule.disallow).not.toContain("/vendors");
    expect(rule.disallow).not.toContain("/v");
  });
});
