import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/ai-quota", () => ({ clientIp: () => "203.0.113.9" }));
const saved: { html: string; note: string | null }[] = [];
vi.mock("@/lib/mcp/biz-site-source", () => ({
  supabaseBizSiteSource: (key: string) => ({
    context: async () => ({ key_seen: key, slug: "keb-tech", published: true, business_name: "Keb Tech" }),
    getSite: async () => null,
    saveDraft: async (html: string, note: string | null) => {
      saved.push({ html, note });
      return "2026-11-15T00:00:00Z";
    },
    publish: async () => "t",
  }),
}));

const KEY = `btbiz_${"a".repeat(48)}`;
const call = (name: string, args: Record<string, unknown> = {}) =>
  JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } });
const req = (url: string, body: string, headers: Record<string, string> = {}) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

beforeEach(() => {
  vi.stubEnv("MCP_ENABLED", "true");
  saved.length = 0;
});
afterEach(() => vi.unstubAllEnvs());

describe("/api/mcp/biz", () => {
  it("is a 404 while MCP is off", async () => {
    vi.stubEnv("MCP_ENABLED", "false");
    const { POST } = await import("./route");
    expect((await POST(req("https://bridalteam.com/api/mcp/biz", call("get_site_guide")))).status).toBe(404);
  });

  it("refuses missing and wedding-site keys", async () => {
    const { POST } = await import("./route");
    expect((await POST(req("https://bridalteam.com/api/mcp/biz", call("get_site_guide")))).status).toBe(401);
    const wedding = `btsite_${"a".repeat(48)}`;
    const res = await POST(req("https://bridalteam.com/api/mcp/biz", call("get_site_guide"), { authorization: `Bearer ${wedding}` }));
    expect(res.status).toBe(401);
  });

  it("returns the listing and guide for a vendor key", async () => {
    const { POST } = await import("./route");
    const res = await POST(req("https://bridalteam.com/api/mcp/biz", call("get_site_guide"), { authorization: `Bearer ${KEY}` }));
    const body = await res.json();
    const data = JSON.parse(body.result.content[0].text);
    expect(data.business.key_seen).toBe(KEY);
    expect(data.guide).toContain('data-bt="contact"');
    expect(data.live_url).toMatch(/\/biz\/keb-tech$/);
  });

  it("accepts the key in the URL and builds a theme draft", async () => {
    const { POST } = await import("./[key]/route");
    const res = await POST(req(`https://bridalteam.com/api/mcp/biz/${KEY}`, call("build_theme_site", { theme: "luxe" })), {
      params: Promise.resolve({ key: KEY }),
    });
    expect(res.status).toBe(200);
    expect(saved[0].html).toContain("<!doctype html>");
    expect(saved[0].note).toBe("Started from the Luxe theme");
  });
});
