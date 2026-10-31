/**
 * "How it works" tips for each wedding planning page, shown by
 * components/feature-tips.tsx from the wedding nav.
 *
 * Writing them:
 *   - 3 or 4 per page. Each is a short bold lead ("Paste a whole list") and
 *     one plain sentence. If it needs two sentences, it's a help article.
 *   - Only things the page really does today, in the words its buttons use.
 *     A tip that promises a feature that moved is worse than no tip.
 *   - Lead with what saves the most time or what people miss, not with what
 *     the page already makes obvious.
 */

export interface FeatureTip {
  title: string;
  body: string;
}

export interface FeatureTips {
  /** The page's name as couples see it in the nav. */
  title: string;
  items: FeatureTip[];
}

const TIPS: Record<string, FeatureTips> = {
  overview: {
    title: "Overview",
    items: [
      { title: "Your next steps live here", body: "Upcoming tasks and a snapshot of each tool you use, so you can see where things stand at a glance." },
      { title: "Only see what you need", body: "Use “+ Add tools” to switch tools on or off. Turning one off hides it from your menu without deleting anything." },
      { title: "Plan with your partner", body: "Invite them, family or a planner from the Team tab so everyone works from the same plan." },
    ],
  },
  checklist: {
    title: "Checklist",
    items: [
      { title: "Start from the expert plan", body: "One click builds a full checklist from “just engaged” to the big day, with deadlines worked out from your wedding date." },
      { title: "Add your own tasks", body: "Anything specific to your wedding can sit alongside the plan, with its own due date." },
      { title: "Deleted something by mistake?", body: "Deleted tasks go to “Recently deleted”, where you can restore them." },
      { title: "Date changed?", body: "When you move your wedding date on the Details tab, you can shift every deadline by the same number of days." },
    ],
  },
  budget: {
    title: "Budget",
    items: [
      { title: "Start from a template", body: "The starter budget spreads your total across the usual categories, so you have realistic numbers to adjust." },
      { title: "Estimated vs paid", body: "Fill in what you've paid as deposits go out, and you'll always see what's still to come." },
      { title: "Set your total first", body: "Your overall budget lives on the Details tab; the starter budget uses it to size each category." },
    ],
  },
  guests: {
    title: "Guests",
    items: [
      { title: "Paste a whole list", body: "Add households one per line, like “Alex & Sam Smith, alex@example.com, 2”. Email and seat count are optional." },
      { title: "One RSVP link per household", body: "Each household gets a private link, so replies land on the right row and nobody can answer for someone else." },
      { title: "Took a reply by phone?", body: "Record it yourself; it's saved exactly as if the guest had used their link." },
      { title: "Menu choices", body: "Add your dishes and guests pick one per person when they RSVP, so your caterer counts are done for you." },
    ],
  },
  vendors: {
    title: "Vendors",
    items: [
      { title: "Track every vendor in one place", body: "Move each from considering to contacted to booked as things progress." },
      { title: "Never miss a payment", body: "Add the cost, what you've paid and the next payment date so nothing sneaks up on you." },
      { title: "Keep the details handy", body: "Contact name, phone, email, contract status and notes all sit with the vendor." },
    ],
  },
  layout: {
    title: "Layout",
    items: [
      { title: "Draw it to scale", body: "Set your room's size in feet, then add tables, a dance floor, bar and more from standard rental sizes." },
      { title: "Watch for clashes", body: "Pieces that overlap, or sit too close to walk between, are flagged so you can fix them before the day." },
      { title: "Seat guests on the plan", body: "Table labels like “4” or “Head table” are what your guests are seated by, so name tables the way you'll refer to them." },
    ],
  },
  website: {
    title: "Website",
    items: [
      { title: "Design first, then publish", body: "Start from a theme, describe it to the Bridal Team AI, paste your own code, or connect ChatGPT or Claude." },
      { title: "Publish & go live", body: "Publishing switches your website on and gives it an address from your names; change the address any time in Settings." },
      { title: "Your details fill in themselves", body: "Names, date, venue, countdown and registry come from your account, so the page stays current when they change." },
      { title: "Nothing is lost", body: "Every save is kept as a version you can restore, and you can download a copy of your site from the preview." },
    ],
  },
  travel: {
    title: "Travel",
    items: [
      { title: "Hotel blocks", body: "Add the hotel, booking link, group code, rate and book-by date so guests have everything in one place." },
      { title: "Getting around", body: "Shuttles, flights and parking go under transport; anything else guests should know goes under info." },
    ],
  },
  ideas: {
    title: "Ideas",
    items: [
      { title: "Save as you browse", body: "Inspiration you save around Bridal Team collects here: dresses, décor, cakes and more." },
      { title: "Share the vision", body: "Your team sees the same board, which makes it easier to show a vendor or your partner what you mean." },
    ],
  },
  team: {
    title: "Team",
    items: [
      { title: "Plan together", body: "Invite your partner, family or wedding party by email so everyone works from the same plan." },
      { title: "Working with a planner?", body: "A connect code links your wedding to their Bridal Team account without sharing your password." },
      { title: "You stay in control", body: "Remove someone's access at any time from this page." },
    ],
  },
  details: {
    title: "Details",
    items: [
      { title: "Everything starts here", body: "Your date, venue, guest count and budget feed your checklist, starter budget and website." },
      { title: "Moving the date?", body: "Tick the option to shift your checklist deadlines by the same number of days." },
    ],
  },
};

/** Tips for a nav page, or null when it has none. */
export function tipsFor(page: string): FeatureTips | null {
  return Object.hasOwn(TIPS, page) ? TIPS[page] : null;
}

export const TIP_PAGES = Object.keys(TIPS);
