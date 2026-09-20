import { describe, it, expect } from "vitest";
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

  it("allows the image sources the workspace actually renders", () => {
    // blob:/data: for the cropper preview before an upload lands, https: for
    // cover photos, vendor logos and inspiration images, which can point at any
    // host. Dropping blob: breaks the preview only after a file is chosen —
    // past the point most manual testing stops.
    const img = d.get("img-src") ?? "";
    expect(img).toContain("blob:");
    expect(img).toContain("data:");
    expect(img).toContain("https:");
  });

  it("allows the service worker and the manifest the PWA install needs", () => {
    // Chrome will not offer "Install" without a service worker with a fetch
    // handler (public/sw.js) and a reachable manifest (app/manifest.ts).
    expect(d.get("worker-src")).toContain("'self'");
    expect(d.get("worker-src")).toContain("blob:");
    expect(d.get("manifest-src")).toBe("'self'");
  });

  it("keeps font-src local, which holds only while fonts are self-hosted", () => {
    // next/font/google downloads Jost and Raleway at build time and serves them
    // from /_next/static/media, so 'self' is enough. Switching to a <link> at
    // fonts.googleapis.com would need that host in style-src and
    // fonts.gstatic.com in font-src — and would fail silently as a fallback
    // font rather than as an error.
    expect(d.get("font-src")).toBe("'self' data:");
  });

  it("allows Google Analytics in BOTH directives it needs", () => {
    // Two hosts, two jobs: the tag is fetched from googletagmanager.com and
    // then beacons to google-analytics.com. Naming only one is the quiet
    // failure — the script loads fine and every measurement it sends is
    // blocked, which reads as a site nobody visits rather than as a bug.
    expect(d.get("script-src")).toContain("https://www.googletagmanager.com");
    expect(d.get("connect-src")).toContain("https://www.google-analytics.com");
    // GA4 resolves to a regional endpoint at runtime (region1.…), which cannot
    // be enumerated ahead of time.
    expect(d.get("connect-src")).toContain("https://*.google-analytics.com");
  });

  it("names no external host beyond the ones we deliberately allow", () => {
    // Asserts the reverse direction from every other test here — that nothing
    // gets ADDED to the policy without a deliberate edit in this file — so a
    // new third party cannot be waved through as a one-line policy change.
    //
    // Compared as raw strings rather than parsed origins, because the GA
    // wildcards are not valid URLs and `new URL()` on them is not meaningful.
    const hosts = new Set(csp.match(/https?:\/\/[^\s;]+/g) ?? []);
    expect([...hosts].sort()).toEqual([
      "https://*.analytics.google.com",
      "https://*.google-analytics.com",
      "https://billing.stripe.com",
      "https://challenges.cloudflare.com",
      "https://checkout.stripe.com",
      "https://player.vimeo.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com",
      "https://www.youtube.com",
      SUPABASE_URL,
    ].sort());
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
