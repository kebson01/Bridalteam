import { describe, expect, it } from "vitest";
import { SANDBOX_CSP, sandboxedHtmlResponse } from "@/lib/custom-site/serve";
import nextConfig from "@/next.config";

describe("sandboxed custom sites", () => {
  it("never grant same-origin, top navigation or forms", () => {
    // Any of these would let couple-written code act as the viewer on
    // bridalteam.com, redirect their tab, or post a look-alike sign-in form.
    const sandbox = SANDBOX_CSP.split(";")[0];
    expect(sandbox).toMatch(/^sandbox /);
    expect(sandbox).not.toContain("allow-same-origin");
    expect(sandbox).not.toContain("allow-top-navigation");
    expect(sandbox).not.toContain("allow-forms");
    expect(SANDBOX_CSP).toContain("form-action 'none'");
    expect(SANDBOX_CSP).toContain("frame-ancestors 'self'");
    // What passed the content check is what guests see: no fetching new
    // content, scripts only from known CDNs.
    expect(SANDBOX_CSP).toContain("connect-src 'none'");
    expect(SANDBOX_CSP).toContain("default-src 'none'");
    expect(SANDBOX_CSP).toMatch(/script-src 'unsafe-inline' 'unsafe-eval' https:\/\/cdn\.jsdelivr\.net/);
    expect(SANDBOX_CSP).not.toMatch(/script-src[^;]*\shttps:(\s|;|$)/);
  });

  it("ship the policy on every response", () => {
    const res = sandboxedHtmlResponse("<p>x</p>");
    expect(res.headers.get("content-security-policy")).toBe(SANDBOX_CSP);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("are frameable by us only, while everything else stays DENY", async () => {
    const rules = await nextConfig.headers!();
    const frame = (source: string) =>
      rules.find((r) => r.source === source)?.headers.find((h) => h.key === "X-Frame-Options")?.value;
    expect(frame("/((?!sandbox/).*)")).toBe("DENY");
    expect(frame("/sandbox/:path*")).toBe("SAMEORIGIN");
  });
});
