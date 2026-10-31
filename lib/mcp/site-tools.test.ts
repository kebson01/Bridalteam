import { describe, expect, it } from "vitest";
import { createSiteTools, InvalidSiteKeyError, SitePolicyError, type SiteKeySource } from "@/lib/mcp/site-tools";
import { handleMessage } from "@/lib/mcp/protocol";

function fakeSource(over: Partial<SiteKeySource> = {}) {
  const calls: { saved: { html: string; note: string | null }[]; registry: [string, string][]; published: number } = {
    saved: [],
    registry: [],
    published: 0,
  };
  const source: SiteKeySource = {
    context: async () => ({ wedding_id: "w1", partner_one: "Ana", public_slug: "ana-ben", website_published: true }),
    getSite: async (which) => (which === "draft" ? "<h1>draft</h1>" : null),
    saveDraft: async (html, note) => {
      calls.saved.push({ html, note });
      return "2026-10-31T00:00:00Z";
    },
    publish: async () => {
      calls.published++;
      return "2026-10-31T00:00:00Z";
    },
    useStandard: async () => {},
    addRegistryLink: async (label, url) => {
      calls.registry.push([label, url]);
    },
    ...over,
  };
  return { tools: createSiteTools(source), calls };
}

const call = (tools: ReturnType<typeof createSiteTools>, name: string, args: Record<string, unknown> = {}) =>
  tools.byName.get(name)!.run(args);

describe("site tools", () => {
  it("publish_site passes on a content policy refusal as a readable error", async () => {
    const { tools } = fakeSource({
      publish: async () => {
        throw new SitePolicyError("Your site wasn't published: remove the scam link.");
      },
    });
    const r = await call(tools, "publish_site");
    expect("error" in r && r.error).toContain("remove the scam link");
  });

  it("publish_site publishes when the check passes", async () => {
    const { tools, calls } = fakeSource();
    const r = await call(tools, "publish_site");
    expect("data" in r && r.data.published_at).toBeTruthy();
    expect(calls.published).toBe(1);
  });

  it("guide returns the wedding, placeholder guide and links", async () => {
    const { tools } = fakeSource();
    const r = await call(tools, "get_site_guide");
    expect("data" in r && r.data.guide).toContain('data-bt="registry"');
    expect("data" in r && r.data.live_url).toBe("https://bridalteam.com/wedding/ana-ben");
    expect("data" in r && r.data.builder_url).toBe("https://bridalteam.com/w/w1/builder");
  });

  it("saves to the draft only, never publishing as a side effect", async () => {
    const { tools, calls } = fakeSource();
    const r = await call(tools, "save_site_draft", { html: "<!doctype html><p>x</p>", note: "first" });
    expect("data" in r && r.data.saved).toBe("draft");
    expect(calls.saved).toEqual([{ html: "<!doctype html><p>x</p>", note: "first" }]);
    expect(calls.published).toBe(0);
  });

  it("refuses an empty or oversized page", async () => {
    const { tools, calls } = fakeSource();
    expect(await call(tools, "save_site_draft", { html: "" })).toHaveProperty("error");
    expect(await call(tools, "save_site_draft", { html: "x".repeat(600_000) })).toHaveProperty("error");
    expect(calls.saved).toHaveLength(0);
  });

  it("builds a theme site as a draft", async () => {
    const { tools, calls } = fakeSource();
    await call(tools, "build_theme_site", { theme: "tropical", headline: "See you in Nassau" });
    expect(calls.saved[0].html).toContain("See you in Nassau");
    expect(calls.saved[0].note).toContain("tropical");
  });

  it("only accepts http(s) registry links", async () => {
    const { tools, calls } = fakeSource();
    expect(await call(tools, "add_registry_link", { label: "X", url: "javascript:alert(1)" })).toHaveProperty("error");
    await call(tools, "add_registry_link", { label: "Amazon", url: "amazon.com/wedding/abc" });
    expect(calls.registry).toEqual([["Amazon", "https://amazon.com/wedding/abc"]]);
  });

  it("turns a revoked key into a message the assistant can relay", async () => {
    const { tools } = fakeSource({
      context: async () => {
        throw new InvalidSiteKeyError();
      },
    });
    const r = await call(tools, "get_site_guide");
    expect("error" in r && r.error).toMatch(/isn't valid/);
  });

  it("introduces itself as the site server", async () => {
    const { tools } = fakeSource();
    const res = await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, tools, {
      info: { name: "bridalteam-site", title: "t", version: "1" },
      instructions: "site",
    });
    expect((res!.result as { serverInfo: { name: string } }).serverInfo.name).toBe("bridalteam-site");
  });
});
