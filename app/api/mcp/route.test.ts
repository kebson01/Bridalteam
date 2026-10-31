import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The HTTP side of the MCP server: the flag, the transport status codes MCP
 * clients rely on, and the per-IP limit. Tool behaviour is in
 * lib/mcp/tools.test.ts.
 */
vi.mock("@/lib/ai-quota", () => ({ clientIp: () => "203.0.113.9" }));
vi.mock("@/lib/mcp/vendor-source", () => ({
  supabaseVendorSource: () => ({
    listPublished: async () => [],
    getPublished: async () => null,
    reviews: async () => [],
  }),
}));

async function route() {
  return import("./route");
}

const post = async (body: unknown) =>
  (await route()).POST(
    new Request("https://bridalteam.com/api/mcp", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.resetModules();
  process.env.MCP_ENABLED = "true";
});
afterEach(() => {
  delete process.env.MCP_ENABLED;
});

describe("/api/mcp", () => {
  it("is a 404 unless MCP_ENABLED is true", async () => {
    delete process.env.MCP_ENABLED;
    expect((await post({ jsonrpc: "2.0", id: 1, method: "ping" })).status).toBe(404);
    expect((await route()).GET().status).toBe(404);
  });

  it("answers initialize and tools/list with JSON", async () => {
    const init = await post({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
    expect(init.status).toBe(200);
    expect(init.headers.get("content-type")).toMatch(/application\/json/);
    expect(init.headers.get("access-control-allow-origin")).toBe("*");
    expect((await init.json()).result.serverInfo.name).toBe("bridalteam");

    const list = await post({ jsonrpc: "2.0", id: 2, method: "tools/list" });
    expect((await list.json()).result.tools.length).toBe(7);
  });

  it("accepts notifications with 202 and no body", async () => {
    const res = await post({ jsonrpc: "2.0", method: "notifications/initialized" });
    expect(res.status).toBe(202);
    expect(await res.text()).toBe("");
  });

  it("rejects bad JSON and batches", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post([{ jsonrpc: "2.0", id: 1, method: "ping" }])).status).toBe(400);
  });

  it("offers no SSE stream or session, so GET and DELETE are 405", async () => {
    const r = await route();
    expect(r.GET().status).toBe(405);
    expect(r.DELETE().status).toBe(405);
    expect(r.OPTIONS().status).toBe(204);
  });

  it("rate-limits one IP to 60 requests a minute", async () => {
    const { POST } = await route();
    const req = () =>
      POST(new Request("https://bridalteam.com/api/mcp", { method: "POST", body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" }) }));
    for (let i = 0; i < 60; i++) expect((await req()).status).toBe(200);
    expect((await req()).status).toBe(429);
  });
});
