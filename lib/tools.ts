/**
 * The free public tool pages. One list, so the guides that link to them, and
 * any future page that does, can't drift from the real routes and names.
 */

export const TOOLS = {
  checklist: {
    href: "/wedding-checklist",
    name: "Wedding checklist with dates",
    blurb: "Enter your date and get a due date for every task.",
  },
  budget: {
    href: "/wedding-budget-calculator",
    name: "Wedding budget calculator",
    blurb: "See your budget by category and your cost per guest.",
  },
  rsvp: {
    href: "/wedding-rsvp",
    name: "Guest list & RSVP",
    blurb: "A private RSVP link for every household, with meals and dietary needs.",
  },
  seating: {
    href: "/wedding-seating-chart",
    name: "Seating chart & table calculator",
    blurb: "Work out how many tables you need, then print your chart.",
  },
  website: {
    href: "/wedding-website",
    name: "Free wedding website",
    blurb: "Your date, venue, registry and RSVPs on one page.",
  },
} as const;

export type ToolKey = keyof typeof TOOLS;
