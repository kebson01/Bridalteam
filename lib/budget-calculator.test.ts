import { describe, it, expect } from "vitest";
import { budgetBreakdown, perGuest, parseAmount, OFTEN_FORGOTTEN } from "./budget-calculator";
import { BUDGET_TEMPLATE } from "./budget-template";

describe("budgetBreakdown", () => {
  it("matches the starter budget the app seeds, line by line", () => {
    // seed_wedding_budget stores round(budget * pct) for each line.
    const total = 35_000;
    const lines = budgetBreakdown(total).categories.flatMap((c) => c.lines);
    const seeded = BUDGET_TEMPLATE.filter((i) => i.pct !== undefined);
    expect(lines.map((l) => l.label)).toEqual(seeded.map((i) => i.label));
    for (const [i, l] of lines.entries()) expect(l.amount).toBe(Math.round(total * seeded[i].pct!));
  });

  it("puts venue and catering at 45% and leaves the rest unassigned", () => {
    const r = budgetBreakdown(40_000);
    expect(r.categories[0]).toMatchObject({ category: "Venue & catering", pct: 0.45, amount: 18_000 });
    expect(r.unassignedPct).toBe(0.11);
    expect(r.assigned + r.unassigned).toBe(40_000);
  });

  it("never adds up to more than the total, even with rounding", () => {
    for (const t of [1, 7, 333, 12_345, 99_999]) {
      const r = budgetBreakdown(t);
      expect(r.assigned + r.unassigned).toBe(t);
    }
  });

  it("treats a missing or negative total as zero", () => {
    expect(budgetBreakdown(-5).assigned).toBe(0);
    expect(budgetBreakdown(Number.NaN).unassigned).toBe(0);
  });

  it("leaves the often-forgotten costs out of the split", () => {
    expect(OFTEN_FORGOTTEN).toContain("Vendor gratuities & tips");
    const labels = budgetBreakdown(10_000).categories.flatMap((c) => c.lines.map((l) => l.label));
    for (const f of OFTEN_FORGOTTEN) expect(labels).not.toContain(f);
  });
});

describe("perGuest", () => {
  it("divides and rounds", () => {
    expect(perGuest(30_000, 120)).toBe(250);
    expect(perGuest(10_000, 3)).toBe(3333);
  });
  it("returns null without a usable guest count", () => {
    expect(perGuest(30_000, 0)).toBeNull();
    expect(perGuest(30_000, Number.NaN)).toBeNull();
    expect(perGuest(0, 100)).toBeNull();
  });
});

describe("parseAmount", () => {
  it("reads the ways people type money", () => {
    expect(parseAmount("35000")).toBe(35_000);
    expect(parseAmount("$35,000")).toBe(35_000);
    expect(parseAmount("35k")).toBe(35_000);
    expect(parseAmount("12.5K")).toBe(12_500);
  });
  it("returns 0 for anything else", () => {
    expect(parseAmount("")).toBe(0);
    expect(parseAmount("lots")).toBe(0);
    expect(parseAmount("-500")).toBe(0);
  });
});
