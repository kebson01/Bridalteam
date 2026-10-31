import { describe, it, expect, vi } from "vitest";
import { createPlannerTools } from "@/lib/mcp/planner-tools";
import { NotFoundError, WebsiteOnlyKeyError, type PlannerSource } from "@/lib/mcp/planner-source";

const ID = "11111111-2222-4333-8444-555555555555";

function fakeSource(overrides: Partial<PlannerSource> = {}) {
  const calls: { fn: string; args: unknown[] }[] = [];
  const log =
    (fn: string, result: unknown) =>
    async (...args: unknown[]) => {
      calls.push({ fn, args });
      return result;
    };
  const source: PlannerSource = {
    scope: log("scope", "planner") as PlannerSource["scope"],
    overview: log("overview", {
      wedding: { id: ID, partner_one: "Ana", budget_cents: 3000000 },
      budget: { items: 2, estimated_cents: 150000, paid_cents: 0 },
      vendors: { total: 0, cost_cents: 0, paid_cents: 0 },
    }) as PlannerSource["overview"],
    list: log("list", [{ id: ID, label: "Venue", estimated_cents: 1200050, width_ft: 80, length_ft: 50 }]) as PlannerSource["list"],
    save: vi.fn(async (kind: string, id: string | null, fields: Record<string, unknown>) => {
      calls.push({ fn: "save", args: [kind, id, fields] });
      return { id: id ?? ID, ...fields };
    }) as unknown as PlannerSource["save"],
    remove: log("remove", true) as PlannerSource["remove"],
    updateWedding: log("updateWedding", { updated: ["event_date"], deadlines_moved: 12 }) as PlannerSource["updateWedding"],
    seed: log("seed", 87) as PlannerSource["seed"],
    recordRsvp: log("recordRsvp", undefined) as PlannerSource["recordRsvp"],
    seat: log("seat", true) as PlannerSource["seat"],
    ...overrides,
  };
  return { source, calls, tools: createPlannerTools(source) };
}

const run = (tools: ReturnType<typeof createPlannerTools>, name: string, args: Record<string, unknown> = {}) => {
  const t = tools.byName.get(name);
  if (!t) throw new Error(`no tool ${name}`);
  return t.run(args);
};

describe("planner tools", () => {
  it("cover every planning feature", () => {
    const { tools } = fakeSource();
    const names = tools.definitions.map((d) => d.name);
    for (const n of [
      "get_wedding_overview", "update_wedding_details",
      "list_checklist", "save_task", "delete_task", "create_starter_checklist",
      "list_budget", "save_budget_item", "delete_budget_item", "create_starter_budget",
      "list_guests", "add_guests", "update_guest", "delete_guest", "record_rsvp", "seat_guest",
      "list_meal_options", "save_meal_option", "delete_meal_option",
      "list_vendors", "save_vendor", "delete_vendor",
      "list_travel", "save_travel_item", "delete_travel_item",
      "list_layouts", "save_layout", "delete_layout", "delete_registry_link",
    ]) expect(names).toContain(n);
    expect(new Set(names).size).toBe(names.length);
    // Every schema is a closed object, so a model can't smuggle extra columns.
    for (const d of tools.definitions) expect(d.inputSchema.additionalProperties).toBe(false);
  });

  it("speaks dollars to the model and cents to the database", async () => {
    const { tools, calls } = fakeSource();
    const listed = await run(tools, "list_budget");
    expect(listed).toEqual({ data: { budget: [expect.objectContaining({ estimated_dollars: 12000.5 })] } });

    await run(tools, "save_budget_item", { category: " Venue ", label: "Rental", estimated_dollars: 12000.5 });
    expect(calls.at(-1)).toEqual({ fn: "save", args: ["budget", null, { category: "Venue", label: "Rental", estimated_cents: 1200050 }] });
  });

  it("requires the key fields when adding but not when updating", async () => {
    const { tools, calls } = fakeSource();
    expect(await run(tools, "save_vendor", { category: "Florist" })).toEqual({ error: "name is required when adding." });
    await run(tools, "save_vendor", { id: ID, status: "booked", paid_dollars: 500 });
    expect(calls.at(-1)?.args).toEqual(["vendors", ID, { status: "booked", paid_cents: 50000 }]);
  });

  it("rejects bad values before they reach the database", async () => {
    const { tools, calls } = fakeSource();
    expect(await run(tools, "save_vendor", { id: ID, status: "maybe" })).toMatchObject({ error: expect.stringContaining("considering") });
    expect(await run(tools, "save_task", { title: "x", due_date: "next friday" })).toMatchObject({ error: expect.stringContaining("date") });
    expect(await run(tools, "save_budget_item", { id: ID, paid_dollars: -5 })).toMatchObject({ error: expect.stringContaining("0 or more") });
    expect(await run(tools, "save_budget_item", { id: "not-an-id", paid_dollars: 5 })).toMatchObject({ error: expect.stringContaining("id") });
    expect(await run(tools, "save_budget_item", { id: ID, label: "" })).toEqual({ error: "label can't be empty." });
    expect(calls.filter((c) => c.fn === "save")).toHaveLength(0);
  });

  it("ticks tasks off with completed", async () => {
    const { tools, calls } = fakeSource();
    await run(tools, "save_task", { id: ID, completed: true });
    const fields = calls.at(-1)?.args[2] as Record<string, unknown>;
    expect(typeof fields.completed_at).toBe("string");
    await run(tools, "save_task", { id: ID, completed: false });
    expect(calls.at(-1)?.args[2]).toEqual({ completed_at: null });
  });

  it("updates wedding details and shifts deadlines when asked", async () => {
    const { tools, calls } = fakeSource();
    const r = await run(tools, "update_wedding_details", { event_date: "2027-06-11", budget_dollars: 30000, shift_deadlines: true });
    expect(calls.at(-1)).toEqual({ fn: "updateWedding", args: [{ event_date: "2027-06-11", budget_cents: 3000000 }, true] });
    expect(r).toEqual({ data: { updated: ["event_date"], deadlines_moved: 12 } });
    expect(await run(tools, "update_wedding_details", {})).toMatchObject({ error: expect.any(String) });
  });

  it("adds guests in bulk with clamped seats and lower-cased emails", async () => {
    const { tools, calls } = fakeSource();
    const r = await run(tools, "add_guests", {
      households: [{ household_name: "The Lees", email: "Lee@Example.com", seats: 50 }, { household_name: "Dana" }],
    });
    expect(r).toMatchObject({ data: { added: 2 } });
    const saves = calls.filter((c) => c.fn === "save").map((c) => c.args[2]);
    expect(saves).toEqual([{ household_name: "The Lees", email: "lee@example.com", seats: 20 }, { household_name: "Dana" }]);
  });

  it("records RSVPs and seats guests", async () => {
    const { tools, calls } = fakeSource();
    await run(tools, "record_rsvp", {
      guest_id: ID,
      attending: true,
      attendees: [{ name: "Kim", meal_option_id: ID }, { name: "Lee", meal_option_id: "fish" }],
      dietary: "nuts",
    });
    expect(calls.at(-1)).toEqual({
      fn: "recordRsvp",
      args: [ID, true, [{ name: "Kim", menu_option_id: ID }, { name: "Lee", menu_option_id: null }], "nuts", ""],
    });
    await run(tools, "seat_guest", { attendee_id: ID, table: " 4 ", seat: 3 });
    expect(calls.at(-1)).toEqual({ fn: "seat", args: [ID, "4", 3] });
    await run(tools, "seat_guest", { attendee_id: ID, table: null, seat: 3 });
    expect(calls.at(-1)).toEqual({ fn: "seat", args: [ID, null, null] });
  });

  it("builds floor plans through the layout sanitizer", async () => {
    const { tools, calls } = fakeSource();
    await run(tools, "save_layout", {
      name: "Reception",
      width_ft: 80,
      length_ft: 50,
      items: [
        { kind: "round60", x: 10, y: 10, w: 99, label: "1" },
        { kind: "dance", x: 500, y: 25, w: 20, h: 20 },
        { kind: "spaceship", x: 1, y: 1 },
      ],
    });
    const fields = calls.at(-1)?.args[2] as { items: Record<string, unknown>[]; floor_source: string };
    expect(fields.floor_source).toBe("blank");
    expect(fields.items).toHaveLength(2);
    expect(fields.items[0]).toMatchObject({ kind: "round60", w: 5, seats: 8, label: "1" });
    expect(typeof fields.items[0].id).toBe("string");
    expect(fields.items[1]).toMatchObject({ kind: "dance", x: 80, w: 20 });
  });

  it("uses the current room size when only items change", async () => {
    const { tools, calls } = fakeSource();
    await run(tools, "save_layout", { id: ID, items: [{ kind: "bar", x: 999, y: 999 }] });
    const fields = calls.at(-1)?.args[2] as { items: Record<string, unknown>[] };
    expect(fields.items[0]).toMatchObject({ x: 80, y: 50 });
  });

  it("turns database answers into messages the model can act on", async () => {
    const notFound = fakeSource({ save: async () => { throw new NotFoundError(); } });
    expect(await run(notFound.tools, "save_vendor", { id: ID, notes: "x" })).toMatchObject({ error: expect.stringContaining("list again") });
    const siteOnly = fakeSource({ list: async () => { throw new WebsiteOnlyKeyError(); } });
    expect(await run(siteOnly.tools, "list_guests")).toMatchObject({ error: expect.stringContaining("only covers the wedding website") });
    const gone = fakeSource({ remove: async () => false });
    expect(await run(gone.tools, "delete_guest", { id: ID })).toMatchObject({ error: expect.any(String) });
  });

  it("seeds the expert checklist and starter budget from the app's templates", async () => {
    const { tools, calls } = fakeSource();
    expect(await run(tools, "create_starter_checklist")).toMatchObject({ data: { tasks_added: 87 } });
    expect(calls.at(-1)?.args[0]).toBe("checklist");
    expect(Array.isArray(calls.at(-1)?.args[1])).toBe(true);
    await run(tools, "create_starter_budget");
    expect(calls.at(-1)?.args[0]).toBe("budget");
  });
});
