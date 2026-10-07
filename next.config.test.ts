import { describe, expect, it } from "vitest";
import nextConfig from "./next.config";

/**
 * The failure this guards against is invisible from inside the app: both
 * www.bridalteam.com and bridalteam.com serving the same pages splits ranking
 * signals between two hosts, and nothing in the product looks wrong while it
 * happens. Google had a 2019 www sitemap registered alongside the apex because
 * of exactly this.
 */
describe("www -> apex redirect", () => {
  it("redirects the www host to the apex, permanently, keeping the path", async () => {
    const redirects = await nextConfig.redirects!();
    const www = redirects.find((r) =>
      r.has?.some((h) => h.type === "host" && h.value === "www.bridalteam.com"),
    );

    expect(www, "no redirect matches the www host").toBeDefined();
    // 308, not 307: a temporary redirect tells Google to keep both hosts.
    expect(www!.permanent).toBe(true);
    expect(www!.source).toBe("/:path*");
    // The path must survive, or every deep link lands on the homepage.
    expect(www!.destination).toBe("https://bridalteam.com/:path*");
  });

  it("points at the apex, never back at www", async () => {
    // A destination still on www is an infinite redirect loop, and the browser
    // is the only place it shows up.
    const redirects = await nextConfig.redirects!();
    for (const r of redirects) {
      expect(r.destination.startsWith("https://www.")).toBe(false);
    }
  });

  it("leaves every other host alone", async () => {
    // Preview deployments and localhost must not be bounced at production.
    const redirects = await nextConfig.redirects!();
    for (const r of redirects) {
      for (const h of r.has ?? []) {
        if (h.type === "host") expect(h.value).toBe("www.bridalteam.com");
      }
    }
  });
});
