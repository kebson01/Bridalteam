import { describe, it, expect } from "vitest";
import robots, { AI_CRAWLERS } from "./robots";

type Rule = { userAgent?: string | string[]; allow?: string; disallow?: string[] };
const rules = robots().rules as Rule[];
const [rule] = rules;

describe("robots", () => {
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
    expect(rule.userAgent).toBe("*");
    expect(rule.allow).toBe("/");
    expect(rule.disallow).not.toContain("/vendors");
    expect(rule.disallow).not.toContain("/v");
  });

  it("names the AI search and assistant crawlers and lets them in", () => {
    const ai = rules.find((r) => Array.isArray(r.userAgent));
    expect(ai?.userAgent).toEqual(AI_CRAWLERS);
    for (const bot of ["OAI-SearchBot", "ChatGPT-User", "Claude-SearchBot", "PerplexityBot"]) {
      expect(AI_CRAWLERS).toContain(bot);
    }
    expect(ai?.allow).toBe("/");
  });

  it("gives every named group the same disallow list as '*'", () => {
    // A crawler matching a named group ignores "*" entirely. A named group
    // without the disallows would hand the claim links to exactly the bots
    // that repeat what they read.
    for (const r of rules) expect(r.disallow).toEqual(rule.disallow);
  });
});
