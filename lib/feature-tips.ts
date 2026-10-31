/**
 * "How it works" tips for each wedding planning page, shown by
 * components/feature-tips.tsx from the wedding nav.
 *
 * Writing them:
 *   - 2 to 4 per page. Each is a short bold lead ("Paste a whole list") and
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
      { title: "Your next steps live here", body: "“Next up” shows your soonest tasks, and you can tick them off right on this page." },
      { title: "Only see what you need", body: "“+ Add tools” switches tools on or off. Removing one just hides it; nothing is deleted." },
      { title: "Stuck on something?", body: "“Ask Bridal AI” can draft tasks, a budget or guest ideas, and add them to your plan when you say so." },
    ],
  },
  checklist: {
    title: "Checklist",
    items: [
      { title: "Don't start from a blank page", body: "“Build my plan with AI” or the expert checklist fills in every step, with deadlines worked out from your wedding date." },
      { title: "Watch the labels", body: "Tasks due within two weeks say “soon”, and late ones turn red with “overdue”." },
      { title: "Deleted something by mistake?", body: "It's in “Recently deleted” at the bottom, ready to restore." },
      { title: "Date changed?", body: "Change it on the Details tab and your deadlines can move by the same number of days." },
    ],
  },
  budget: {
    title: "Budget",
    items: [
      { title: "Start from a template", body: "“Build my starter budget” splits your total into categories and adds costs couples often forget, like tips and alterations." },
      { title: "Just type", body: "Estimated and paid amounts save on their own as soon as you click away." },
      { title: "Keep an eye on the total", body: "If your estimates add up to more than your budget, you'll see by how much." },
      { title: "Set your total first", body: "Your overall budget lives on the Details tab." },
    ],
  },
  guests: {
    title: "Guests",
    items: [
      { title: "Paste a whole list", body: "One household per line, like “Alex & Sam Smith, alex@example.com, 2”. Email and seats are optional." },
      { title: "Invite in one click", body: "“Send invitations” emails everyone's private RSVP link; “Remind” nudges anyone who hasn't replied (at most every 3 days)." },
      { title: "Took a reply by phone?", body: "Open the household, choose Edit, and fill in “Their reply” for them." },
      { title: "Caterer counts, done", body: "Add dishes under Menu and guests pick one when they RSVP; “Export for caterer” downloads the list." },
    ],
  },
  vendors: {
    title: "Vendors",
    items: [
      { title: "Track where each one stands", body: "Move vendors from Considering to Contacted to Booked as things progress." },
      { title: "Never miss a payment", body: "Add the cost and what you've paid to see what's remaining; set “Next payment due” under Contact, contract & dates." },
      { title: "No save button needed", body: "Every field saves on its own when you click away." },
    ],
  },
  layout: {
    title: "Layout",
    items: [
      { title: "Start from what you have", body: "Upload the venue's floor plan, snap a photo of the room, or draw a blank room to size." },
      { title: "Tap or drag to add", body: "Select a piece and use arrow keys to nudge it, R to rotate, and Ctrl/Cmd+Z to undo." },
      { title: "Room to walk", body: "Overlaps and gaps under 36″ behind chairs are flagged, so problems show up before the day does." },
      { title: "Seat guests here", body: "Switch to Seating and tap a table to fill its chairs. Guests are matched to tables by name, so renaming a table moves its guests too." },
    ],
  },
  website: {
    title: "Website",
    items: [
      { title: "Four ways to design", body: "Pick a theme, describe it to the Bridal Team AI, paste your own code, or connect ChatGPT or Claude." },
      { title: "Publish & go live", body: "Publishing switches your site on and gives it an address from your names; change the address in Settings." },
      { title: "Your details fill in themselves", body: "Names, date, countdown, venue and registry come from your account and stay up to date." },
      { title: "Nothing is lost", body: "Restore any earlier version from Version history, or keep a copy with “Download my site”." },
    ],
  },
  travel: {
    title: "Travel",
    items: [
      { title: "Hotel blocks", body: "Add the booking link, room-block code, nightly rate and reserve-by date so guests have everything in one place." },
      { title: "Getting around", body: "Shuttles and flights go under Transportation; anything else guests should know goes in Travel notes." },
    ],
  },
  ideas: {
    title: "Ideas",
    items: [
      { title: "Save as you browse", body: "Tap ♥ on anything in Inspiration and it lands here." },
      { title: "Share the vision", body: "Everyone on your wedding sees the same board, handy for showing a vendor what you mean." },
    ],
  },
  team: {
    title: "Team",
    items: [
      { title: "Plan together", body: "“Send invite” to your partner, family or wedding party, with a role like Maid of Honor or Best Man." },
      { title: "No email? Share the link", body: "Every invite also gives you a link you can text instead." },
      { title: "Working with a planner?", body: "“Create a connect code” and they enter it to join your wedding, no password sharing." },
    ],
  },
  details: {
    title: "Details",
    items: [
      { title: "Everything starts here", body: "Your date, venue, guest count and budget shape your checklist, budget and AI suggestions." },
      { title: "Moving the date?", body: "Leave “Also move your existing deadlines” ticked and every checklist date shifts with it." },
    ],
  },
};

/** Tips for a nav page, or null when it has none. */
export function tipsFor(page: string): FeatureTips | null {
  return Object.hasOwn(TIPS, page) ? TIPS[page] : null;
}

export const TIP_PAGES = Object.keys(TIPS);
