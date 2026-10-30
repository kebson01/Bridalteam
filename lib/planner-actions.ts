/**
 * What the AI planner can put into a couple's wedding.
 *
 * The planner never writes anything itself. When a couple asks for a
 * checklist, a budget, a vendor list or a guest list, the model calls one of
 * the `propose_*` tools below; /api/plan turns those calls into proposals the
 * chat shows as cards, and nothing is saved until the couple taps "Add".
 * Saving goes through applyProposal() (app/planner/actions.ts) under the
 * couple's own session, so RLS decides — exactly as if they had typed each
 * item in by hand.
 *
 * Everything the model produces is untrusted input, and so is anything the
 * browser posts back, so sanitizeProposal() runs on both sides: once before a
 * proposal is shown, and again before it's written.
 */

export type ProposalKind = "tasks" | "budget" | "vendors" | "guests";

export interface TaskItem {
  title: string;
  due_date: string | null;
}
export interface BudgetItem {
  category: string;
  label: string;
  estimated_cents: number;
}
export interface VendorItem {
  name: string;
  category: string | null;
  notes: string | null;
}
export interface GuestItem {
  household_name: string;
  seats: number;
  email: string | null;
}

export type Proposal =
  | { kind: "tasks"; items: TaskItem[] }
  | { kind: "budget"; items: BudgetItem[] }
  | { kind: "vendors"; items: VendorItem[] }
  | { kind: "guests"; items: GuestItem[] };

/** Caps per proposal: enough for a full plan, small enough to review. */
const MAX_ITEMS: Record<ProposalKind, number> = { tasks: 60, budget: 30, vendors: 25, guests: 100 };

/**
 * Tool definitions sent to the Messages API. Deterministic and constant, so
 * they sit in the cacheable prefix ahead of the system prompt.
 */
export const PLANNER_TOOLS = [
  {
    name: "propose_tasks",
    description:
      "Offer checklist tasks the couple can add to their wedding checklist with one tap. Use when they ask for a checklist, timeline, to-do list or next steps. Each task is one concrete action. Nothing is saved until they confirm.",
    input_schema: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Short, actionable, e.g. 'Book the photographer'." },
              due_date: {
                type: "string",
                description: "Optional deadline as YYYY-MM-DD, between today and the wedding date.",
              },
            },
            required: ["title"],
          },
        },
      },
      required: ["tasks"],
    },
  },
  {
    name: "propose_budget_items",
    description:
      "Offer budget line items the couple can add to their budget with one tap. Use when they ask for a budget or cost breakdown. Amounts in whole US dollars. Nothing is saved until they confirm.",
    input_schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              category: { type: "string", description: "e.g. 'Venue & catering', 'Photography'." },
              label: { type: "string", description: "The line item, e.g. 'Photographer (8 hours)'." },
              estimated_dollars: { type: "number", description: "Estimated cost in dollars." },
            },
            required: ["category", "label", "estimated_dollars"],
          },
        },
      },
      required: ["items"],
    },
  },
  {
    name: "propose_vendors",
    description:
      "Offer vendors to add to the couple's vendor tracker with one tap. Use when they ask which vendors they need or name businesses they're considering. Never invent business names: use a name the couple gave you, or a placeholder like 'Photographer (to find)'. Nothing is saved until they confirm.",
    input_schema: {
      type: "object",
      properties: {
        vendors: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Business name the couple gave, or '<Category> (to find)'." },
              category: { type: "string", description: "e.g. 'Photographer', 'Florist', 'DJ'." },
              notes: { type: "string", description: "Optional: what to look for or ask." },
            },
            required: ["name", "category"],
          },
        },
      },
      required: ["vendors"],
    },
  },
  {
    name: "propose_guests",
    description:
      "Offer guest households to add to the couple's guest list with one tap. Use only for people the couple has named (for example a list they pasted). Never invent guests. Nothing is saved until they confirm.",
    input_schema: {
      type: "object",
      properties: {
        guests: {
          type: "array",
          items: {
            type: "object",
            properties: {
              household_name: { type: "string", description: "e.g. 'The Smith family' or 'Jane Doe'." },
              seats: { type: "integer", description: "People in the household, 1-20." },
              email: { type: "string", description: "Optional email for their RSVP link." },
            },
            required: ["household_name"],
          },
        },
      },
      required: ["guests"],
    },
  },
];

const TOOL_KIND: Record<string, ProposalKind> = {
  propose_tasks: "tasks",
  propose_budget_items: "budget",
  propose_vendors: "vendors",
  propose_guests: "guests",
};
const TOOL_LIST_KEY: Record<string, string> = {
  propose_tasks: "tasks",
  propose_budget_items: "items",
  propose_vendors: "vendors",
  propose_guests: "guests",
};

const str = (v: unknown, max: number): string =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";
const orNull = (s: string) => (s === "" ? null : s);
const isDate = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));

function cleanItem(kind: ProposalKind, raw: unknown) {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  switch (kind) {
    case "tasks": {
      const title = str(r.title, 300);
      const due = str(r.due_date, 10);
      return title ? { title, due_date: isDate(due) ? due : null } : null;
    }
    case "budget": {
      const label = str(r.label, 200);
      const dollars = Number(r.estimated_dollars ?? (typeof r.estimated_cents === "number" ? r.estimated_cents / 100 : NaN));
      if (!label || !Number.isFinite(dollars) || dollars < 0) return null;
      return {
        category: str(r.category, 80) || "Other",
        label,
        estimated_cents: Math.round(Math.min(dollars, 10_000_000) * 100),
      };
    }
    case "vendors": {
      const name = str(r.name, 200);
      return name ? { name, category: orNull(str(r.category, 80)), notes: orNull(str(r.notes, 1000)) } : null;
    }
    case "guests": {
      const household_name = str(r.household_name, 200);
      const seats = Math.round(Number(r.seats ?? 1));
      const email = str(r.email, 200);
      if (!household_name) return null;
      return {
        household_name,
        seats: Number.isFinite(seats) ? Math.min(Math.max(seats, 1), 20) : 1,
        email: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null,
      };
    }
  }
}

/** Validates a proposal of a known kind; null when nothing usable is left. */
export function sanitizeProposal(kind: unknown, items: unknown): Proposal | null {
  if (kind !== "tasks" && kind !== "budget" && kind !== "vendors" && kind !== "guests") return null;
  if (!Array.isArray(items)) return null;
  const clean = items
    .slice(0, MAX_ITEMS[kind])
    .map((i) => cleanItem(kind, i))
    .filter((i): i is NonNullable<typeof i> => i !== null);
  return clean.length ? ({ kind, items: clean } as Proposal) : null;
}

/** Turns one `tool_use` block from the API into a proposal, or null. */
export function proposalFromToolUse(name: unknown, input: unknown): Proposal | null {
  if (typeof name !== "string" || !(name in TOOL_KIND)) return null;
  const list = input && typeof input === "object" ? (input as Record<string, unknown>)[TOOL_LIST_KEY[name]] : null;
  return sanitizeProposal(TOOL_KIND[name], list);
}

/** Where each kind lives in the wedding workspace, and how to name it. */
export const PROPOSAL_TARGET: Record<ProposalKind, { label: string; noun: [string, string]; path: (id: string) => string }> = {
  tasks: { label: "checklist", noun: ["task", "tasks"], path: (id) => `/w/${id}/checklist` },
  budget: { label: "budget", noun: ["budget item", "budget items"], path: (id) => `/w/${id}/budget` },
  vendors: { label: "vendors", noun: ["vendor", "vendors"], path: (id) => `/w/${id}/vendors` },
  guests: { label: "guest list", noun: ["household", "households"], path: (id) => `/w/${id}/guests` },
};
