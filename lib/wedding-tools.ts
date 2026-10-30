/**
 * The tool catalogue behind a wedding's dashboard.
 *
 * Every planning feature is a "tool" a couple can pin to their workspace or
 * leave out. Some couples only want a checklist and a budget; a planner running
 * a destination weekend wants all of it. The choice is stored per wedding in
 * weddings.enabled_tools — null means "never customised", which resolves to
 * DEFAULT_TOOLS so nobody lands on an empty dashboard.
 *
 * Order here is the order tools appear in the nav and the tools grid.
 */

export type ToolCategory = "planning" | "guests" | "vendors" | "collaborate";

export interface WeddingTool {
  key: string;
  name: string;
  /** Short label for the nav pill. */
  nav: string;
  blurb: string;
  category: ToolCategory;
  /** Path under /w/[id], or an absolute site path when it lives elsewhere. */
  path: (weddingId: string) => string;
  /** Emoji icon — matches the emoji the rest of the site already uses. */
  icon: string;
  /** Can't be switched off: the dashboard is built around it. */
  core?: boolean;
}

export const TOOL_CATEGORIES: { key: ToolCategory; label: string }[] = [
  { key: "planning", label: "Planning" },
  { key: "guests", label: "Guests & Day-of" },
  { key: "vendors", label: "Vendors & Space" },
  { key: "collaborate", label: "Collaborate" },
];

export const WEDDING_TOOLS: WeddingTool[] = [
  {
    key: "checklist",
    name: "Checklist & Timeline",
    nav: "Checklist",
    blurb: "Every task from “just engaged” to the big day, with deadlines built from your date.",
    category: "planning",
    path: (id) => `/w/${id}/checklist`,
    icon: "✅",
    core: true,
  },
  {
    key: "budget",
    name: "Budget & Expenses",
    nav: "Budget",
    blurb: "Estimated vs actual spend, deposits and payment schedules in one place.",
    category: "planning",
    path: (id) => `/w/${id}/budget`,
    icon: "💰",
  },
  {
    key: "guests",
    name: "Guest List & RSVP",
    nav: "Guests",
    blurb: "Households, meal choices and RSVPs, with personal reply links for every guest.",
    category: "guests",
    path: (id) => `/w/${id}/guests`,
    icon: "💌",
  },
  {
    key: "vendors",
    name: "Vendor Tracker",
    nav: "Vendors",
    blurb: "Shortlist, book and pay your photographer, florist, caterer and the rest.",
    category: "vendors",
    path: (id) => `/w/${id}/vendors`,
    icon: "🤝",
  },
  {
    key: "layout",
    name: "Layout & Seating",
    nav: "Layout",
    blurb: "To-scale floor plans for your venue, with tables, aisles and seating.",
    category: "vendors",
    path: (id) => `/w/${id}/layout`,
    icon: "🪑",
  },
  {
    key: "website",
    name: "Wedding Website",
    nav: "Website",
    blurb: "Your story, schedule and travel details on a page you can share with guests.",
    category: "guests",
    path: (id) => `/w/${id}/website`,
    icon: "🌐",
  },
  {
    key: "travel",
    name: "Travel & Stays",
    nav: "Travel",
    blurb: "Hotel blocks, flights and transport for you and your guests.",
    category: "guests",
    path: (id) => `/w/${id}/travel`,
    icon: "✈️",
  },
  {
    key: "ideas",
    name: "Ideas Board",
    nav: "Ideas",
    blurb: "Inspiration you've saved — dresses, décor, cakes — gathered in one board.",
    category: "planning",
    path: (id) => `/w/${id}/ideas`,
    icon: "💡",
  },
  {
    key: "team",
    name: "Planning Team",
    nav: "Team",
    blurb: "Invite your partner, planner or family to plan alongside you.",
    category: "collaborate",
    path: (id) => `/w/${id}/team`,
    icon: "👥",
  },
  {
    key: "community",
    name: "Community & Groups",
    nav: "Community",
    blurb: "Bridesmaids, groomsmen and family groups, plus events like the rehearsal dinner.",
    category: "collaborate",
    path: () => "/dashboard#community",
    icon: "🎉",
  },
  {
    key: "ai",
    name: "Bridal AI Assistant",
    nav: "AI Planner",
    blurb: "Ask anything — vendor questions, etiquette, timelines — and get answers for your wedding.",
    category: "planning",
    path: () => "/planner",
    icon: "✨",
  },
];

/** What a wedding gets before the couple customises anything. */
export const DEFAULT_TOOLS = ["checklist", "budget", "guests", "vendors", "website", "ai"];

const KNOWN = new Set(WEDDING_TOOLS.map((t) => t.key));
const CORE = WEDDING_TOOLS.filter((t) => t.core).map((t) => t.key);

/**
 * Cleans a requested tool list: drops unknown keys and duplicates, and always
 * keeps core tools. Used both when saving and when reading, so a stale key left
 * behind by a removed tool can't break the dashboard.
 */
export function sanitizeTools(keys: readonly string[]): string[] {
  const wanted = new Set([...CORE, ...keys.filter((k) => KNOWN.has(k))]);
  return WEDDING_TOOLS.filter((t) => wanted.has(t.key)).map((t) => t.key);
}

/** The tools switched on for a wedding, in catalogue order. */
export function enabledTools(stored: readonly string[] | null | undefined): WeddingTool[] {
  const keys = new Set(sanitizeTools(stored ?? DEFAULT_TOOLS));
  return WEDDING_TOOLS.filter((t) => keys.has(t.key));
}
