import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * The planner's vendor-lookup loop: a search_vendors call is run and fed back,
 * the model's final answer is returned, and the loop is bounded. The tools
 * themselves are tested in lib/planner-vendor-tools.test.ts.
 */
const A = "11111111-1111-4111-8111-111111111111";

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({ auth: { getUser: async () => ({ data: { user: null } }) } }),
}));
vi.mock("@/lib/supabase", () => ({ supabaseAdmin: () => null }));
vi.mock("@/lib/ai-quota", () => ({
  clientIp: () => "203.0.113.9",
  consumeAiQuota: async () => ({ allowed: true, used: 0, limit: 0, tier: "anon" }),
  anonChatCeilingExceeded: async () => false,
  QUOTA_UNMETERED: { allowed: true, used: 0, limit: 0, tier: "anon" },
}));
vi.mock("@/lib/mcp/vendor-source", () => ({
  supabaseVendorSource: () => ({
    listPublished: async () => [
      { org_id: A, business_name: "Sunrise Photo", category: "Photography", description: "Beach", city: "Miami", region: "FL", featured: false },
    ],
    getPublished: async () => null,
    reviews: async () => [],
  }),
}));

type Body = { messages: { role: string; content: unknown }[]; tools: { name: string }[]; tool_choice?: unknown };
const sent: Body[] = [];

function reply(content: unknown[]) {
  return new Response(JSON.stringify({ content }), { status: 200, headers: { "content-type": "application/json" } });
}

async function ask(text: string) {
  const { POST } = await import("./route");
  const res = await POST(
    new Request("https://bridalteam.com/api/plan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: text }] }),
    }),
  );
  return res.json();
}

beforeEach(() => {
  vi.resetModules();
  sent.length = 0;
  process.env.ANTHROPIC_API_KEY = "test";
});
afterEach(() => {
  delete process.env.ANTHROPIC_API_KEY;
  vi.unstubAllGlobals();
});

describe("/api/plan vendor lookups", () => {
  it("runs search_vendors and returns the model's answer", async () => {
    const answers = [
      reply([{ type: "tool_use", id: "t1", name: "search_vendors", input: { category: "Photography" } }]),
      reply([{ type: "text", text: `Try [Sunrise Photo](/v/${A}).` }]),
    ];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)));
      return answers.shift()!;
    }));

    const out = await ask("Photographers in Miami?");
    expect(out.reply).toBe(`Try [Sunrise Photo](/v/${A}).`);
    expect(out.demo).toBe(false);
    expect(sent).toHaveLength(2);
    // Anonymous visitors get the lookups but not the propose_* tools.
    expect(sent[0].tools.map((t) => t.name)).toEqual(["search_vendors", "get_vendor"]);
    const results = sent[1].messages.at(-1)!.content as { tool_use_id: string; content: string }[];
    expect(results[0].tool_use_id).toBe("t1");
    expect(results[0].content).toContain(`/v/${A}`);
  });

  it("stops looking things up after the round limit", async () => {
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body)) as Body;
      sent.push(body);
      return body.tool_choice
        ? reply([{ type: "text", text: "Here's what I found." }])
        : reply([{ type: "tool_use", id: `t${sent.length}`, name: "search_vendors", input: {} }]);
    }));

    const out = await ask("Find me everyone");
    expect(out.reply).toBe("Here's what I found.");
    expect(sent).toHaveLength(4);
    expect(sent[3].tool_choice).toEqual({ type: "none" });
  });

  it("falls back to the demo reply when the API errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 500 })));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const out = await ask("Photographers?");
    expect(out.demo).toBe(true);
  });
});
