/**
 * The starter budget.
 *
 * A first-time couple rarely knows where wedding money actually goes — or the
 * costs that never make it onto a napkin sketch. This template gives them a
 * realistic breakdown from their total budget, plus the expenses planners see
 * forgotten again and again, pre-listed so they're impossible to miss.
 *
 * `pct` is a fraction of the couple's total budget, used to estimate that line.
 * `overlooked: true` marks the commonly-forgotten costs — they seed at $0 so the
 * couple fills them in deliberately, but they're on the page from day one.
 */

export interface BudgetTemplateItem {
  category: string;
  label: string;
  pct?: number;
  overlooked?: boolean;
}

export const BUDGET_TEMPLATE: BudgetTemplateItem[] = [
  // Main categories — widely-used percentage starting points.
  { category: "Venue & catering", label: "Venue rental", pct: 0.2 },
  { category: "Venue & catering", label: "Catering & bar", pct: 0.25 },
  { category: "Photography & video", label: "Photographer", pct: 0.09 },
  { category: "Photography & video", label: "Videographer", pct: 0.03 },
  { category: "Flowers & décor", label: "Florals & décor", pct: 0.1 },
  { category: "Music & entertainment", label: "Band or DJ", pct: 0.08 },
  { category: "Attire & beauty", label: "Attire", pct: 0.05 },
  { category: "Attire & beauty", label: "Hair & makeup", pct: 0.02 },
  { category: "Cake & desserts", label: "Cake / dessert", pct: 0.02 },
  { category: "Stationery", label: "Invitations & stationery", pct: 0.02 },
  { category: "Rings", label: "Wedding rings", pct: 0.03 },

  // The costs first-timers miss — seeded at $0 so they're seen and considered.
  { category: "Often forgotten", label: "Vendor gratuities & tips", overlooked: true },
  { category: "Often forgotten", label: "Dress & suit alterations", overlooked: true },
  { category: "Often forgotten", label: "Delivery, setup & service fees", overlooked: true },
  { category: "Often forgotten", label: "Marriage license", overlooked: true },
  { category: "Often forgotten", label: "Overtime / weather backup buffer", overlooked: true },
  { category: "Often forgotten", label: "Postage for invitations", overlooked: true },
  { category: "Often forgotten", label: "Welcome bags & favors", overlooked: true },
  { category: "Often forgotten", label: "Hair & makeup trials", overlooked: true },
  { category: "Often forgotten", label: "Vendor meals on the day", overlooked: true },
  { category: "Often forgotten", label: "Transportation & parking", overlooked: true },
  { category: "Often forgotten", label: "Wedding insurance", overlooked: true },
];

export const BUDGET_CATEGORY_ORDER = [
  "Venue & catering",
  "Photography & video",
  "Flowers & décor",
  "Music & entertainment",
  "Attire & beauty",
  "Cake & desserts",
  "Stationery",
  "Rings",
  "Often forgotten",
];
