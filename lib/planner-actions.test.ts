import { describe, expect, it } from "vitest";
import { proposalFromToolUse, sanitizeProposal } from "./planner-actions";

describe("proposalFromToolUse", () => {
  it("turns a propose_tasks call into a task proposal", () => {
    expect(
      proposalFromToolUse("propose_tasks", {
        tasks: [{ title: "  Book the   photographer ", due_date: "2026-12-01" }, { title: "Pick a florist" }],
      }),
    ).toEqual({
      kind: "tasks",
      items: [
        { title: "Book the photographer", due_date: "2026-12-01" },
        { title: "Pick a florist", due_date: null },
      ],
    });
  });

  it("converts budget dollars to cents and drops negative or missing amounts", () => {
    expect(
      proposalFromToolUse("propose_budget_items", {
        items: [
          { category: "Photography", label: "Photographer", estimated_dollars: 3200.4 },
          { category: "Oops", label: "Negative", estimated_dollars: -5 },
          { category: "Oops", label: "No amount" },
        ],
      }),
    ).toEqual({
      kind: "budget",
      items: [{ category: "Photography", label: "Photographer", estimated_cents: 320040 }],
    });
  });

  it("clamps guest seats and drops a malformed email", () => {
    const p = proposalFromToolUse("propose_guests", {
      guests: [{ household_name: "The Smiths", seats: 99, email: "not-an-email" }],
    });
    expect(p).toEqual({ kind: "guests", items: [{ household_name: "The Smiths", seats: 20, email: null }] });
  });

  it("ignores unknown tools and empty lists", () => {
    expect(proposalFromToolUse("delete_everything", { tasks: [{ title: "x" }] })).toBeNull();
    expect(proposalFromToolUse("propose_vendors", { vendors: [] })).toBeNull();
    expect(proposalFromToolUse("propose_vendors", "garbage")).toBeNull();
  });

  it("rejects an impossible date rather than saving it", () => {
    const p = proposalFromToolUse("propose_tasks", { tasks: [{ title: "x", due_date: "2026-13-45" }] });
    expect(p).toEqual({ kind: "tasks", items: [{ title: "x", due_date: null }] });
  });
});

describe("sanitizeProposal", () => {
  it("re-validates items posted back from the browser", () => {
    expect(sanitizeProposal("vendors", [{ name: "<b>Lens Co</b>", category: "Photographer", extra: 1 }])).toEqual({
      kind: "vendors",
      items: [{ name: "<b>Lens Co</b>", category: "Photographer", notes: null }],
    });
    expect(sanitizeProposal("budget", [{ category: "Venue", label: "Hall", estimated_cents: 500000 }])).toEqual({
      kind: "budget",
      items: [{ category: "Venue", label: "Hall", estimated_cents: 500000 }],
    });
  });

  it("refuses an unknown kind", () => {
    expect(sanitizeProposal("weddings", [{ name: "x" }])).toBeNull();
  });

  it("caps how many items one proposal can add", () => {
    const many = Array.from({ length: 500 }, (_, i) => ({ title: `Task ${i}` }));
    expect(sanitizeProposal("tasks", many)?.items).toHaveLength(60);
  });
});
