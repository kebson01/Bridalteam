import { describe, it, expect } from "vitest";
import { createTools, type DirectoryVendor, type VendorDetail, type VendorSource } from "./tools";
import { handleMessage, SUPPORTED_PROTOCOL_VERSIONS } from "./protocol";
import { budgetBreakdown } from "@/lib/budget-calculator";
import { GUIDES } from "@/lib/guides";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const C = "33333333-3333-4333-8333-333333333333";

const LIST: DirectoryVendor[] = [
  { org_id: A, business_name: "Sunrise Photo", category: "Photography", description: "Beach and boho weddings", city: "Fort Lauderdale", region: "FL", featured: false },
  { org_id: B, business_name: "Bloom Florals", category: "Florist", description: "Garden flowers", city: "Miami", region: "FL", featured: false },
  { org_id: C, business_name: "Zeta Studio", category: "Photography", description: "Classic portraits", city: "Orlando", region: "FL", featured: true },
];

const DETAIL: VendorDetail = { ...LIST[0], website: "https://example.com", cover_url: null, logo_url: "https://img/logo.png" };

const source: VendorSource = {
  listPublished: async () => LIST,
  getPublished: async (id) => (id === A ? DETAIL : null),
  reviews: async () => [
    { rating: 5, body: "Amazing", created_at: "2026-09-01T00:00:00Z" },
    { rating: 4, body: null, created_at: "2026-08-01T00:00:00Z" },
  ],
};

const tools = createTools(source, () => "2026-10-31");

async function call(name: string, args: Record<string, unknown> = {}) {
  const res = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name, arguments: args } }, tools);
  return res!.result as { content: { text: string }[]; structuredContent?: Record<string, any>; isError?: boolean };
}

describe("MCP protocol", () => {
  it("negotiates a supported protocol version and advertises tools", async () => {
    const res = await handleMessage(
      { jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } },
      tools,
    );
    const r = res!.result as Record<string, any>;
    expect(r.protocolVersion).toBe("2025-06-18");
    expect(r.capabilities.tools).toBeDefined();
    expect(r.serverInfo.name).toBe("bridalteam");
  });

  it("falls back to the newest version for one it doesn't know", async () => {
    const res = await handleMessage({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "1999-01-01" } }, tools);
    expect((res!.result as any).protocolVersion).toBe(SUPPORTED_PROTOCOL_VERSIONS[0]);
  });

  it("returns nothing for a notification", async () => {
    expect(await handleMessage({ jsonrpc: "2.0", method: "notifications/initialized" }, tools)).toBeNull();
  });

  it("rejects malformed requests and unknown methods", async () => {
    expect((await handleMessage({ id: 1, method: "ping" }, tools))!.error!.code).toBe(-32600);
    expect((await handleMessage({ jsonrpc: "2.0", id: 2, method: "resources/list" }, tools))!.error!.code).toBe(-32601);
    const unknown = await handleMessage({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "drop_tables" } }, tools);
    expect(unknown!.error!.code).toBe(-32602);
  });

  it("lists only read-only tools, each with a schema", async () => {
    const res = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/list" }, tools);
    const list = (res!.result as any).tools as any[];
    expect(list.map((t) => t.name).sort()).toEqual(
      ["estimate_budget", "get_checklist", "get_guide", "get_vendor", "plan_tables", "search_guides", "search_vendors"],
    );
    for (const t of list) {
      expect(t.inputSchema.type).toBe("object");
      expect(t.annotations.readOnlyHint).toBe(true);
      expect(t.annotations.destructiveHint).toBe(false);
    }
  });

  it("reports a tool that throws as a tool error, not a crash", async () => {
    const broken = createTools({ ...source, listPublished: async () => { throw new Error("db down"); } });
    const errSpy = console.error;
    console.error = () => {};
    const res = await handleMessage({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search_vendors" } }, broken);
    console.error = errSpy;
    expect((res!.result as any).isError).toBe(true);
  });
});

describe("search_vendors", () => {
  it("lists featured vendors first, with profile links", async () => {
    const r = (await call("search_vendors")).structuredContent!;
    expect(r.total_matches).toBe(3);
    expect(r.vendors[0].name).toBe("Zeta Studio");
    expect(r.vendors[0].profile_url).toMatch(new RegExp(`/v/${C}$`));
  });

  it("filters by category, metro and keywords", async () => {
    const photo = (await call("search_vendors", { category: "photography" })).structuredContent!;
    expect(photo.vendors.map((v: any) => v.name)).toEqual(["Zeta Studio", "Sunrise Photo"]);

    const sofla = (await call("search_vendors", { category: "Photography", metro: "south-florida" })).structuredContent!;
    expect(sofla.vendors.map((v: any) => v.name)).toEqual(["Sunrise Photo"]);

    const boho = (await call("search_vendors", { query: "boho beach" })).structuredContent!;
    expect(boho.vendors.map((v: any) => v.name)).toEqual(["Sunrise Photo"]);
  });

  it("never returns vendor email or phone", async () => {
    const r = await call("search_vendors");
    expect(r.content[0].text).not.toMatch(/email|phone/i);
  });

  it("rejects an unknown metro instead of silently matching nothing", async () => {
    const r = await call("search_vendors", { metro: "atlantis" });
    expect(r.isError).toBe(true);
  });
});

describe("get_vendor", () => {
  it("returns the profile, a tracked website link and a rating summary", async () => {
    const r = (await call("get_vendor", { vendor_id: A })).structuredContent!;
    expect(r.name).toBe("Sunrise Photo");
    expect(r.website).toMatch(new RegExp(`/api/vendor/link\\?org=${A}$`));
    expect(r.rating).toEqual({ average: 4.5, count: 2 });
    expect(r.recent_reviews[0]).toEqual({ rating: 5, text: "Amazing", date: "2026-09-01" });
    expect(JSON.stringify(r)).not.toMatch(/author|reviewer/);
  });

  it("rejects ids that aren't vendor ids, and unknown vendors", async () => {
    expect((await call("get_vendor", { vendor_id: "'; drop table--" })).isError).toBe(true);
    expect((await call("get_vendor", { vendor_id: B })).isError).toBe(true);
  });
});

describe("calculators", () => {
  it("estimate_budget matches the public budget calculator", async () => {
    const r = (await call("estimate_budget", { total: 30000, guests: 120 })).structuredContent!;
    expect(r.categories).toEqual(budgetBreakdown(30000).categories);
    expect(r.per_guest).toBe(250);
    expect(r.often_forgotten.length).toBeGreaterThan(0);
  });

  it("estimate_budget accepts a numeric string and rejects nonsense", async () => {
    expect((await call("estimate_budget", { total: "20000" })).isError).toBeUndefined();
    expect((await call("estimate_budget", { total: -5 })).isError).toBe(true);
    expect((await call("estimate_budget", {})).isError).toBe(true);
  });

  it("plan_tables compares common sizes, or uses the one asked for", async () => {
    const all = (await call("plan_tables", { guests: 150, head_table: 10 })).structuredContent!;
    expect(all.options.map((o: any) => [o.per_table, o.tables])).toEqual([[8, 18], [10, 14], [12, 12]]);
    const ten = (await call("plan_tables", { guests: 100, per_table: 10 })).structuredContent!;
    expect(ten.options).toHaveLength(1);
    expect(ten.options[0]).toMatchObject({ per_table: 10, tables: 10, emptySeats: 0 });
  });

  it("get_checklist dates every task from the wedding date", async () => {
    const r = (await call("get_checklist", { wedding_date: "2027-06-12" })).structuredContent!;
    expect(r.task_count).toBeGreaterThan(20);
    const due = r.phases.flatMap((p: any) => p.tasks).map((t: any) => t.due).filter(Boolean);
    // Mostly before the day; a few (thank-you notes) come after it.
    expect(due.filter((d: string) => d < "2027-06-12").length).toBeGreaterThan(due.length / 2);
    // Earliest tasks are about 14 months out, so from 2026-10-31 some are already overdue.
    expect(r.overdue_count).toBeGreaterThan(0);
    expect((await call("get_checklist", { wedding_date: "2027-02-30" })).isError).toBe(true);
  });
});

describe("guides", () => {
  it("search_guides ranks title matches and get_guide returns full text", async () => {
    const found = (await call("search_guides", { query: "checklist" })).structuredContent!;
    expect(found.guides[0].slug).toBe("wedding-planning-checklist");

    const g = (await call("get_guide", { slug: found.guides[0].slug })).structuredContent!;
    expect(g.title).toBe(GUIDES[0].title);
    expect(g.text).toContain("## ");
    expect(g.url).toMatch(/\/guides\/wedding-planning-checklist$/);
  });

  it("get_guide reports an unknown slug", async () => {
    expect((await call("get_guide", { slug: "nope" })).isError).toBe(true);
  });
});
