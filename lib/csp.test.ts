import { describe, it, expect, afterEach, vi } from "vitest";
import { buildCsp } from "./csp";
import { SUPABASE_URL } from "./supabase";

/**
 * The CSP is ENFORCING in production, which makes this file's failure mode
 * unusual: a missing entry doesn't break the build, doesn't break local dev
 * (Report-Only by default), and doesn't break the page it's on — it breaks one
 * third-party feature, in production only, silently.
 *
 * Both of the entries below were found by walking the app rather than by
 * reading the policy, after the fact. These tests are the regression guard for
 * exactly that: removing the Turnstile hosts would take signup, login and
 * password reset offline for everyone the moment Supabase requires a token.
 */
function directives(csp: string): Map<string, string> {
  return new Map(
    csp.split(";").map((d) => {
      const parts = d.trim().split(/\s+/);
      return [parts[0], parts.slice(1).join(" ")];
    }),
  );
}

const TURNSTILE = "https://challenges.cloudflare.com";

describe("buildCsp", () => {
  const csp = buildCsp("test-nonce", false);
  const d = directives(csp);

  it("allows Turnstile in all three directives the widget needs", () => {
    // The script, the challenge iframe, and the iframe's own XHR. Any one of
    // these missing means the widget never produces a token.
    expect(d.get("script-src")).toContain(TURNSTILE);
    expect(d.get("frame-src")).toContain(TURNSTILE);
    expect(d.get("connect-src")).toContain(TURNSTILE);
  });

  it("allows the Stripe hosts the checkout redirect posts to", () => {
    // Chrome exempts redirects from form-action; Firefox and Safari do not, so
    // omitting these breaks a no-JS Subscribe on those browsers only.
    expect(d.get("form-action")).toContain("https://checkout.stripe.com");
    expect(d.get("form-action")).toContain("https://billing.stripe.com");
  });

  it("allows the video embeds the inspiration gallery renders", () => {
    expect(d.get("frame-src")).toContain("https://www.youtube.com");
    expect(d.get("frame-src")).toContain("https://player.vimeo.com");
  });

  it("pins network egress to our own origin and Supabase", () => {
    const connect = d.get("connect-src") ?? "";
    expect(connect).toContain("'self'");
    expect(connect).toContain(SUPABASE_URL);
    expect(connect).toContain(SUPABASE_URL.replace(/^https:/, "wss:"));
  });

  it("keeps the directives that close off injection escalation", () => {
    expect(d.get("object-src")).toBe("'none'");
    expect(d.get("base-uri")).toBe("'self'");
    expect(d.get("frame-ancestors")).toBe("'none'");
    expect(d.get("default-src")).toBe("'self'");
    expect(d.has("upgrade-insecure-requests")).toBe(true);
  });

  it("does not advertise a nonce in the default (non-strict) policy", () => {
    // The nonce-based policy was silently doing nothing on statically
    // prerendered routes: a fresh nonce in the header, zero nonced scripts in
    // the cached HTML. Enforcing that would have blocked every script on the
    // marketing site.
    expect(csp).not.toContain("nonce-");
    expect(csp).not.toContain("strict-dynamic");
    expect(d.get("script-src")).toContain("'unsafe-inline'");
  });

  it("switches to nonce + strict-dynamic when CSP_STRICT is opted into", () => {
    const strict = directives(buildCsp("abc123", true));
    expect(strict.get("script-src")).toContain("'nonce-abc123'");
    expect(strict.get("script-src")).toContain("'strict-dynamic'");
    expect(strict.get("script-src")).not.toContain("'unsafe-inline'");
    // Turnstile still has to survive the strict path.
    expect(strict.get("script-src")).toContain(TURNSTILE);
  });
});

/**
 * Google Analytics widens the policy, but only when it is actually configured.
 *
 * Both halves matter and neither is visible without a test. Forget the hosts
 * and GA silently collects nothing in production while looking fine in dev
 * (where CSP is Report-Only). Add them unconditionally and every deployment
 * that never set a measurement ID carries a weaker script-src for a tracker it
 * does not run.
 *
 * GA_MEASUREMENT_ID is read once at module load, like every NEXT_PUBLIC value,
 * so each case needs a fresh import rather than just a changed env var.
 */
describe("buildCsp — Google Analytics", () => {
  const GTM = "https://www.googletagmanager.com";

  async function cspWithGaId(id: string | undefined) {
    vi.resetModules();
    if (id === undefined) vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    else vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);
    const mod = await import("./csp");
    return directives(mod.buildCsp("test-nonce", false));
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("names googletagmanager in script-src when configured", async () => {
    const d = await cspWithGaId("G-TESTID1234");
    expect(d.get("script-src")).toContain(GTM);
  });

  it("allows the regional collection subdomains, not just the bare host", async () => {
    // GA4 beacons to region1.google-analytics.com and friends. Naming only the
    // apex host passes a US smoke test and drops most international traffic.
    const d = await cspWithGaId("G-TESTID1234");
    const connect = d.get("connect-src") ?? "";
    expect(connect).toContain("https://*.google-analytics.com");
    expect(connect).toContain("https://*.analytics.google.com");
  });

  it("keeps the tighter policy when no measurement id is set", async () => {
    const d = await cspWithGaId(undefined);
    expect(d.get("script-src")).not.toContain("google");
    expect(d.get("connect-src")).not.toContain("google");
  });

  it("still allows Turnstile and Supabase when analytics is on", async () => {
    // The GA entries are appended to existing directives, so this guards
    // against a concatenation bug taking signup offline.
    const d = await cspWithGaId("G-TESTID1234");
    expect(d.get("script-src")).toContain(TURNSTILE);
    expect(d.get("connect-src")).toContain(SUPABASE_URL);
  });
});
