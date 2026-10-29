import { BUDGET_CATEGORY_ORDER, BUDGET_TEMPLATE } from "@/lib/budget-template";

/**
 * The public budget calculator's math.
 *
 * It splits a total with BUDGET_TEMPLATE, the same starter budget the app
 * seeds for a signed-in couple (seed_wedding_budget rounds each line the same
 * way), so the numbers someone sees here are the numbers they get after
 * signing up. The template's percentages add up to 89%; the rest is shown as
 * unassigned, for the buffer and the often-forgotten costs.
 */

export interface CalculatorLine {
  label: string;
  pct: number;
  amount: number;
}

export interface CalculatorCategory {
  category: string;
  pct: number;
  amount: number;
  lines: CalculatorLine[];
}

export interface CalculatorResult {
  categories: CalculatorCategory[];
  assigned: number;
  unassigned: number;
  unassignedPct: number;
}

/** Whole-dollar breakdown of `total` (in dollars). Negative or non-finite totals count as 0. */
export function budgetBreakdown(total: number): CalculatorResult {
  const t = Number.isFinite(total) && total > 0 ? total : 0;
  const categories: CalculatorCategory[] = [];

  for (const category of BUDGET_CATEGORY_ORDER) {
    const lines = BUDGET_TEMPLATE.filter((i) => i.category === category && i.pct !== undefined).map(
      (i) => ({ label: i.label, pct: i.pct!, amount: Math.round(t * i.pct!) }),
    );
    if (lines.length === 0) continue;
    categories.push({
      category,
      // Rounded to avoid 0.09 + 0.03 = 0.12000000000000001 showing up as a label.
      pct: Math.round(lines.reduce((s, l) => s + l.pct, 0) * 1000) / 1000,
      amount: lines.reduce((s, l) => s + l.amount, 0),
      lines,
    });
  }

  const assigned = categories.reduce((s, c) => s + c.amount, 0);
  const assignedPct = categories.reduce((s, c) => s + c.pct, 0);
  return {
    categories,
    assigned,
    unassigned: t - assigned,
    unassignedPct: Math.round((1 - assignedPct) * 1000) / 1000,
  };
}

/** The labels the app pre-lists at $0 because couples forget them. */
export const OFTEN_FORGOTTEN = BUDGET_TEMPLATE.filter((i) => i.overlooked).map((i) => i.label);

/** Total per guest, or null when there's no usable guest count. */
export function perGuest(total: number, guests: number): number | null {
  if (!Number.isFinite(total) || total <= 0) return null;
  if (!Number.isFinite(guests) || guests < 1) return null;
  return Math.round(total / Math.floor(guests));
}

/** Reads a typed amount like "$35,000" or "35k". Returns 0 for anything unreadable. */
export function parseAmount(raw: string): number {
  const s = raw.trim().toLowerCase().replace(/[$,\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!m) return 0;
  const n = Number.parseFloat(m[1]) * (m[2] ? 1000 : 1);
  return Number.isFinite(n) ? Math.round(n) : 0;
}
