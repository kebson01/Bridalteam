/**
 * The expert starter plan.
 *
 * A first-time couple shouldn't face a blank page. This is a curated, opinionated
 * wedding plan an experienced planner would hand them: every stage from "just
 * engaged" to "after the wedding", the surrounding events (shower, bachelor /
 * bachelorette, rehearsal dinner), travel and lodging, and the expenses and
 * details first-timers routinely miss.
 *
 * Structure mirrors the database: Milestone (a phase of time) → Deliverable (an
 * area of work) → Task (a specific to-do). Each task can carry `dueOffsetDays` —
 * how many days BEFORE the wedding it should be done — so seeding turns it into a
 * real deadline from the couple's own date.
 *
 * This is the non-AI backbone. When AI generation is enabled it personalizes and
 * adjusts this; without a key, this alone gives a couple a complete roadmap.
 */

export interface TemplateTask {
  title: string;
  dueOffsetDays?: number | null; // days before the wedding
  tip?: string; // an expert note — surfaced as a task note
}
export interface TemplateDeliverable {
  name: string;
  tasks: TemplateTask[];
}
export interface TemplateMilestone {
  name: string;
  deliverables: TemplateDeliverable[];
}

const DAY = 1;
const MONTH = 30 * DAY;

export const PLAN_TEMPLATE: TemplateMilestone[] = [
  {
    name: "Just engaged — first steps",
    deliverables: [
      {
        name: "Vision & priorities",
        tasks: [
          { title: "Talk through the wedding you each picture — size, formality, vibe", dueOffsetDays: 14 * MONTH },
          { title: "Agree on your top 3 priorities (what you'll spend and splurge on)", dueOffsetDays: 14 * MONTH, tip: "Deciding this early is the single best way to avoid budget stress later." },
          { title: "Pick a rough season or a few candidate dates", dueOffsetDays: 14 * MONTH },
        ],
      },
      {
        name: "Budget foundation",
        tasks: [
          { title: "Set a total budget you're genuinely comfortable with", dueOffsetDays: 13 * MONTH },
          { title: "Confirm who is contributing and how much", dueOffsetDays: 13 * MONTH, tip: "Have this conversation before you book anything — it changes everything downstream." },
          { title: "Set aside a 5–8% buffer for surprises", dueOffsetDays: 13 * MONTH, tip: "Overlooked costs — vendor overtime, alterations, tips, delivery fees — always appear. A buffer keeps them from becoming stress." },
        ],
      },
      {
        name: "Guest list (first draft)",
        tasks: [
          { title: "Draft a rough guest count — even a range", dueOffsetDays: 13 * MONTH, tip: "Headcount drives venue size and most of your cost. It's the most powerful budget lever you have." },
          { title: "Decide whether children and plus-ones are invited", dueOffsetDays: 12 * MONTH },
        ],
      },
    ],
  },
  {
    name: "12–9 months out",
    deliverables: [
      {
        name: "Venue & date",
        tasks: [
          { title: "Tour venues that fit your guest count and budget", dueOffsetDays: 11 * MONTH },
          { title: "Book your venue and lock your date", dueOffsetDays: 10 * MONTH, tip: "Your date isn't real until the venue is signed. Everything else keys off this." },
          { title: "Ask the venue what's included vs. extra (tables, chairs, linens, staff)", dueOffsetDays: 10 * MONTH, tip: "Rentals are a classic overlooked expense — confirm what you'll need to bring in." },
        ],
      },
      {
        name: "The vendors that book up first",
        tasks: [
          { title: "Book your photographer", dueOffsetDays: 9 * MONTH, tip: "The best photographers book 12+ months out, and there's only one of your date." },
          { title: "Book your videographer (if you want one)", dueOffsetDays: 9 * MONTH },
          { title: "Book your caterer (if not included with the venue)", dueOffsetDays: 9 * MONTH },
          { title: "Book your band or DJ", dueOffsetDays: 9 * MONTH, tip: "Music sets the energy of the whole reception — don't leave it late." },
        ],
      },
      {
        name: "Wedding party",
        tasks: [
          { title: "Choose your wedding party and ask them", dueOffsetDays: 10 * MONTH },
          { title: "Invite your party and family into the plan on Bridal Team", dueOffsetDays: 10 * MONTH, tip: "Assign owners to tasks so you're not the only person keeping track." },
        ],
      },
    ],
  },
  {
    name: "9–6 months out",
    deliverables: [
      {
        name: "Attire",
        tasks: [
          { title: "Start shopping for wedding attire", dueOffsetDays: 8 * MONTH, tip: "Gowns and suits often need 4–6 months for ordering and alterations — start earlier than feels necessary." },
          { title: "Book alterations", dueOffsetDays: 4 * MONTH },
          { title: "Choose wedding party attire", dueOffsetDays: 6 * MONTH },
        ],
      },
      {
        name: "Look & feel",
        tasks: [
          { title: "Lock your color palette and overall style", dueOffsetDays: 8 * MONTH },
          { title: "Book your florist", dueOffsetDays: 7 * MONTH },
          { title: "Book hair and makeup, and schedule a trial", dueOffsetDays: 6 * MONTH },
          { title: "Book your officiant", dueOffsetDays: 7 * MONTH, tip: "First-timers often forget this one until late — an officiant is required to marry you." },
        ],
      },
      {
        name: "Travel, lodging & transportation",
        tasks: [
          { title: "Reserve a hotel room block for out-of-town guests", dueOffsetDays: 7 * MONTH, tip: "Blocks need lead time and are easy to overlook. Guests will thank you." },
          { title: "Arrange transportation for the couple and party (and guests if needed)", dueOffsetDays: 4 * MONTH },
          { title: "For a destination wedding: confirm travel logistics, marriage-license rules, and a local coordinator", dueOffsetDays: 8 * MONTH, tip: "Destination weddings have legal and travel details a local wedding doesn't — research the location's requirements early." },
        ],
      },
    ],
  },
  {
    name: "6–3 months out",
    deliverables: [
      {
        name: "Stationery & guests",
        tasks: [
          { title: "Order save-the-dates and send them", dueOffsetDays: 6 * MONTH },
          { title: "Finalize the guest list and collect addresses", dueOffsetDays: 4 * MONTH },
          { title: "Order invitations", dueOffsetDays: 4 * MONTH },
          { title: "Build your wedding website and registry", dueOffsetDays: 5 * MONTH },
        ],
      },
      {
        name: "The events around the wedding",
        tasks: [
          { title: "Plan the engagement party (if you're having one)", dueOffsetDays: 8 * MONTH },
          { title: "Coordinate the bridal shower with whoever is hosting", dueOffsetDays: 3 * MONTH, tip: "Usually hosted by the wedding party or family — coordinate, don't plan it all yourself." },
          { title: "Plan the bachelor / bachelorette celebrations", dueOffsetDays: 3 * MONTH },
          { title: "Book and plan the rehearsal dinner", dueOffsetDays: 3 * MONTH },
          { title: "Consider a day-after brunch for out-of-town guests", dueOffsetDays: 3 * MONTH },
        ],
      },
      {
        name: "Details that add up",
        tasks: [
          { title: "Order the cake or dessert and schedule a tasting", dueOffsetDays: 4 * MONTH },
          { title: "Plan décor, rentals and lighting", dueOffsetDays: 4 * MONTH },
          { title: "Decide on favors, signage and stationery extras", dueOffsetDays: 3 * MONTH },
        ],
      },
    ],
  },
  {
    name: "3–1 months out",
    deliverables: [
      {
        name: "Confirm & communicate",
        tasks: [
          { title: "Mail your invitations", dueOffsetDays: 10 * DAY + 2 * MONTH },
          { title: "Finalize the menu and any dietary needs with your caterer", dueOffsetDays: 6 * DAY + MONTH },
          { title: "Confirm the day-of timeline with every vendor", dueOffsetDays: MONTH },
          { title: "Apply for your marriage license (check your local waiting period)", dueOffsetDays: MONTH, tip: "Licenses expire and some areas have waiting periods — don't do this too early or too late." },
          { title: "Buy wedding rings and allow time for sizing", dueOffsetDays: 2 * MONTH },
        ],
      },
      {
        name: "Money & paperwork",
        tasks: [
          { title: "Review every vendor contract and payment schedule", dueOffsetDays: 2 * MONTH, tip: "Note final-payment due dates and cancellation terms so nothing surprises you." },
          { title: "Plan vendor gratuities and set the cash aside", dueOffsetDays: MONTH, tip: "Tips are one of the most commonly forgotten line items — budget for them now." },
        ],
      },
    ],
  },
  {
    name: "The final month",
    deliverables: [
      {
        name: "Final logistics",
        tasks: [
          { title: "Chase any missing RSVPs and give the final headcount to your caterer", dueOffsetDays: 10 * DAY },
          { title: "Build the seating chart", dueOffsetDays: 12 * DAY },
          { title: "Send a detailed day-of schedule to your party and vendors", dueOffsetDays: 10 * DAY },
          { title: "Make final payments and prepare tip envelopes", dueOffsetDays: 7 * DAY },
          { title: "Confirm hair/makeup, transportation and delivery times", dueOffsetDays: 7 * DAY },
          { title: "Pack for the wedding night and honeymoon", dueOffsetDays: 3 * DAY },
        ],
      },
    ],
  },
  {
    name: "Week of & wedding day",
    deliverables: [
      {
        name: "Bring it home",
        tasks: [
          { title: "Attend the rehearsal and rehearsal dinner", dueOffsetDays: 1 * DAY },
          { title: "Hand off tasks — assign someone to manage vendors and payments on the day", dueOffsetDays: 2 * DAY, tip: "Delegate the day-of logistics so you can actually enjoy your wedding." },
          { title: "Get married and celebrate 💍", dueOffsetDays: 0 },
        ],
      },
    ],
  },
  {
    name: "After the wedding",
    deliverables: [
      {
        name: "Wrap up",
        tasks: [
          { title: "Return any rentals and attire", dueOffsetDays: -3 * DAY },
          { title: "Write thank-you notes", dueOffsetDays: -30 * DAY },
          { title: "Leave reviews for the vendors you loved", dueOffsetDays: -14 * DAY },
          { title: "Handle name changes and update documents (if changing names)", dueOffsetDays: -21 * DAY },
        ],
      },
    ],
  },
];

// Flat counts for copy ("a 70-step plan"), computed once.
export const TEMPLATE_TASK_COUNT = PLAN_TEMPLATE.reduce(
  (n, m) => n + m.deliverables.reduce((d, del) => d + del.tasks.length, 0),
  0,
);
