import { describe, it, expect } from "vitest";
import type { DirectoryVendor, VendorSource } from "@/lib/mcp/tools";
import {
  relativizeSiteLinks,
  toolResultsFor,
  vendorLookupRegistry,
  vendorLookupTools,
} from "./planner-vendor-tools";
import { SITE_URL } from "@/lib/site";

const A = "11111111-1111-4111-8111-111111111111";
const LIST: DirectoryVendor[] = [
  { org_id: A, business_name: "Sunrise Photo", category: "Photography", description: "Beach weddings", city: "Fort Lauderdale", region: "FL", featured: false },
];
const source: VendorSource = {
  listPublished: async () => LIST,
  getPublished: async () => null,
  reviews: async () => [],
};
const registry = vendorLookupRegistry(source);

describe("planner vendor tools", () => {
  it("offers search_vendors and get_vendor in Messages API form", () => {
    const tools = vendorLookupTools(registry);
    expect(tools.map((t) => t.name)).toEqual(["search_vendors", "get_vendor"]);
    for (const t of tools) {
      expect(t.input_schema).toMatchObject({ type: "object" });
      expect(t.description.length).toBeGreaterThan(20);
    }
  });

  it("runs a search and returns site-relative profile links", async () => {
    const [r] = await toolResultsFor(
      [{ type: "tool_use", id: "t1", name: "search_vendors", input: { category: "photography" } }],
      registry,
    );
    expect(r.tool_use_id).toBe("t1");
    expect(r.is_error).toBeUndefined();
    const data = JSON.parse(r.content);
    expect(data.vendors[0].name).toBe("Sunrise Photo");
    expect(data.vendors[0].profile_url).toBe(`/v/${A}`);
    expect(r.content).not.toContain(SITE_URL);
  });

  it("reports a tool error as is_error", async () => {
    const [r] = await toolResultsFor(
      [{ type: "tool_use", id: "t2", name: "get_vendor", input: { vendor_id: "nope" } }],
      registry,
    );
    expect(r.is_error).toBe(true);
  });

  it("acknowledges a propose_* call made alongside a lookup", async () => {
    const results = await toolResultsFor(
      [
        { type: "tool_use", id: "a", name: "search_vendors", input: {} },
        { type: "tool_use", id: "b", name: "propose_vendors", input: { vendors: [] } },
      ],
      registry,
    );
    expect(results.map((r) => r.tool_use_id)).toEqual(["a", "b"]);
    expect(results[1].content).toMatch(/card/);
  });

  it("turns a thrown source error into an error result", async () => {
    const broken = vendorLookupRegistry({ ...source, listPublished: async () => { throw new Error("down"); } });
    const [r] = await toolResultsFor([{ type: "tool_use", id: "x", name: "search_vendors", input: {} }], broken);
    expect(r.is_error).toBe(true);
  });

  it("only rewrites links to this site", () => {
    const out = relativizeSiteLinks(
      { a: "https://bridalteam.com/v/1", b: "https://bridalteam.com.evil.example/x", c: "https://other.example/v/1" },
      "https://bridalteam.com",
    );
    expect(out).toEqual({ a: "/v/1", b: "https://bridalteam.com.evil.example/x", c: "https://other.example/v/1" });
  });
});
