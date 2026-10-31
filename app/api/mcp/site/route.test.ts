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

let scope: "site" | "planner" = "site";
vi.mock("@/lib/mcp/planner-source", async (orig) => ({
  ...(await orig<typeof import("@/lib/mcp/planner-source")>()),
  supabasePlannerSource: () => ({ scope: async () => scope }),
}));

const KEY = `btsite_${"a".repeat(48)}`;
const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "get_site_guide" } });
const req = (url: string, headers: Record<string, string> = {}) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

beforeEach(() => {
  vi.stubEnv("MCP_ENABLED", "true");
  scope = "site";
});
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

  it("points OAuth clients at the resource metadata", async () => {
    vi.stubEnv("OAUTH_SECRET", "s");
    const { POST } = await import("./route");
    const res = await POST(req("https://bridalteam.com/api/mcp/site"));
    expect(res.headers.get("www-authenticate")).toMatch(/resource_metadata="https:\/\/[^"]+\/\.well-known\/oauth-protected-resource"/);
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

  it("offers only the website tools to a website key", async () => {
    const { POST } = await import("./route");
    const list = new Request("https://bridalteam.com/api/mcp/site", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });
    const names = (await (await POST(list)).json()).result.tools.map((t: { name: string }) => t.name);
    expect(names).toContain("save_site_draft");
    expect(names).not.toContain("list_guests");
  });

  it("offers the whole planner to a planner key", async () => {
    scope = "planner";
    const { POST } = await import("./route");
    const list = new Request("https://bridalteam.com/api/mcp/site", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
    });
    const names = (await (await POST(list)).json()).result.tools.map((t: { name: string }) => t.name);
    expect(names).toEqual(expect.arrayContaining(["save_site_draft", "list_guests", "save_budget_item", "save_layout", "seat_guest"]));
  });
});
