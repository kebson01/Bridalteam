import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

/**
 * SITE_URL is resolved once at import time, so each case re-imports the module
 * with a different environment.
 *
 * Worth testing because getting it wrong is invisible in development and
 * expensive in production: the value feeds metadataBase, canonical links, the
 * sitemap and robots.txt. This app deploys on DigitalOcean App Platform, which
 * sets APP_URL; it previously read Vercel's variable, which is never set there,
 * so a preview would have advertised production URLs to search engines.
 */
const KEYS = ["NEXT_PUBLIC_SITE_URL", "APP_URL", "VERCEL_PROJECT_PRODUCTION_URL"] as const;

// Clears all three first, so a case says exactly what is set and two calls in
// one test can't leak into each other.
async function siteUrlWith(env: Partial<Record<(typeof KEYS)[number], string>>) {
  vi.resetModules();
  for (const k of KEYS) delete process.env[k];
  for (const [k, v] of Object.entries(env)) process.env[k] = v;
  return (await import("./site")).SITE_URL;
}

describe("SITE_URL", () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("falls back to the canonical host so a build needs no secret", async () => {
    // CI builds with no environment at all; this is what keeps that possible.
    expect(await siteUrlWith({})).toBe("https://bridalteam.com");
  });

  it("prefers an explicit NEXT_PUBLIC_SITE_URL over everything", async () => {
    expect(
      await siteUrlWith({
        NEXT_PUBLIC_SITE_URL: "https://staging.bridalteam.com",
        APP_URL: "https://app.ondigitalocean.app",
      }),
    ).toBe("https://staging.bridalteam.com");
  });

  it("uses DigitalOcean's APP_URL, which is where this actually deploys", async () => {
    expect(await siteUrlWith({ APP_URL: "https://bridalteam-xyz.ondigitalocean.app" })).toBe(
      "https://bridalteam-xyz.ondigitalocean.app",
    );
  });

  it("prefers APP_URL over the Vercel variable", async () => {
    expect(
      await siteUrlWith({
        APP_URL: "https://do.example.com",
        VERCEL_PROJECT_PRODUCTION_URL: "vercel.example.com",
      }),
    ).toBe("https://do.example.com");
  });

  it("adds the scheme Vercel's variable omits", async () => {
    // APP_URL arrives with a scheme; VERCEL_PROJECT_PRODUCTION_URL does not.
    expect(await siteUrlWith({ VERCEL_PROJECT_PRODUCTION_URL: "preview.vercel.app" })).toBe(
      "https://preview.vercel.app",
    );
  });

  it("strips trailing slashes so canonical URLs don't double up", async () => {
    expect(await siteUrlWith({ NEXT_PUBLIC_SITE_URL: "https://bridalteam.com/" })).toBe(
      "https://bridalteam.com",
    );
    expect(await siteUrlWith({ APP_URL: "https://do.example.com//" })).toBe("https://do.example.com");
  });

  it("ignores a variable set to whitespace", async () => {
    expect(await siteUrlWith({ NEXT_PUBLIC_SITE_URL: "   ", APP_URL: "https://do.example.com" })).toBe(
      "https://do.example.com",
    );
  });
});
