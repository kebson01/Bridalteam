import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/ai-quota", () => ({ clientIp: () => "203.0.113.9" }));
vi.mock("@/lib/mcp/site-source", () => ({
  supabaseSiteSource: (key: string) => ({
    context: async () => ({ key_seen: key }),
    getSite: async () => null,
    saveDraft: async () => "t",
    publish: async () => "t",
    useStandard: async () => {},
    addRegistryLink: async () => {},
  }),
}));

const KEY = `btsite_${"a".repeat(48)}`;
const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_site_guide" } });
const req = (url: string, headers: Record<string, string> = {}) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

beforeEach(() => vi.stubEnv("MCP_ENABLED", "true"));
afterEach(() => vi.unstubAllEnvs());

describe("/api/mcp/site", () => {
  it("is a 404 while MCP is off", async () => {
    vi.stubEnv("MCP_ENABLED", "false");
    const { POST } = await import("./route");
    expect((await POST(req("https://bridalteam.com/api/mcp/site"))).status).toBe(404);
  });

  it("asks for a key when none is sent", async () => {
    const { POST } = await import("./route");
    const res = await POST(req("https://bridalteam.com/api/mcp/site"));
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");
  });

  it("rejects a malformed key without touching the database", async () => {
    const { POST } = await import("./route");
    expect((await POST(req("https://bridalteam.com/api/mcp/site", { authorization: "Bearer nope" }))).status).toBe(401);
  });

  it("accepts the key as a bearer header", async () => {
    const { POST } = await import("./route");
    const res = await POST(req("https://bridalteam.com/api/mcp/site", { authorization: `Bearer ${KEY}` }));
    expect(res.status).toBe(200);
    expect(JSON.stringify(await res.json())).toContain(KEY);
  });

  it("accepts the key in the URL for URL-only clients", async () => {
    const { POST } = await import("./[key]/route");
    const res = await POST(req(`https://bridalteam.com/api/mcp/site/${KEY}`), { params: Promise.resolve({ key: KEY }) });
    expect(res.status).toBe(200);
  });
});
