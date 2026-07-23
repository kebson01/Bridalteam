/**
 * Wedding planning guides — long-form, original, evergreen content that targets
 * real planning searches (checklists, budgets, venues, guest lists, vendors,
 * timelines). Plain data rendered by /guides and /guides/[slug]; add a guide by
 * appending to GUIDES and the listing, page, sitemap and structured data pick
 * it up automatically.
 *
 * Quality over quantity on purpose: each guide is substantive and genuinely
 * useful. Thin, near-duplicate pages hurt rankings under Google's helpful-content
 * system, so we grow this deliberately.
 */
import type { Block } from "@/lib/blog";

export interface FAQ {
  q: string;
  a: string;
}

export interface Guide {
  slug: string;
  title: string;
  category: string;
  updated: string; // ISO date
  readMinutes: number;
  excerpt: string;
  intro: string;
  body: Block[];
  faqs: FAQ[];
  keywords: string[];
}

export const GUIDES: Guide[] = [
  {
    slug: "wedding-planning-checklist",
    title: "The complete wedding planning checklist",
    category: "Planning",
    updated: "2026-07-22",
    readMinutes: 9,
    excerpt:
      "Every task from engagement to the honeymoon, grouped by when it actually needs to happen — so nothing important slips.",
    intro:
      "A good checklist isn't just a long list of tasks — it's the right tasks in the right order. This one is grouped by timeframe so you always know what deserves your attention now and what can wait. Work top to bottom and the overwhelming becomes a sequence of small, doable steps.",
    body: [
      { h2: "12+ months before: the foundation" },
      { p: "Three decisions unlock everything else — your budget, a rough guest count, and your date and venue. Settle these first, because almost every later choice depends on them. You can't price catering without a headcount or book vendors without a date." },
      { ul: [
        "Agree on a total budget and who is contributing.",
        "Draft a guest list — even a rough one shapes venue size and cost.",
        "Choose a season or date range, then tour and book your venue.",
        "Decide the overall vibe: formal or relaxed, big or intimate.",
      ] },
      { h2: "9–11 months before: book vendors that sell out" },
      { p: "The best photographers, caterers, and bands are reserved a year ahead in busy markets. Once your date is fixed, secure these next — waiting usually means losing your first choice, not saving money." },
      { ul: [
        "Photographer and videographer.",
        "Caterer (if not included with the venue).",
        "Band or DJ.",
        "Wedding planner or day-of coordinator, if you want one.",
      ] },
      { h2: "6–8 months before: the details take shape" },
      { p: "With the big pieces booked, move to the choices that make the day feel like yours." },
      { ul: [
        "Order your dress or suit — alterations take longer than people expect.",
        "Book florist, cake, and any rentals.",
        "Reserve room blocks for out-of-town guests.",
        "Send save-the-dates, especially for a destination or holiday weekend.",
      ] },
      { h2: "2–4 months before: confirm and communicate" },
      { p: "This is the stretch where a shared plan pays off. Keep vendors, family, and your wedding party on the same page." },
      { ul: [
        "Mail invitations (about 8 weeks out; 12 for destinations).",
        "Finalize the menu and do a tasting.",
        "Buy rings and plan the honeymoon.",
        "Confirm timeline and shot list with your photographer.",
      ] },
      { h2: "The final month: tie it together" },
      { p: "Chase the last RSVPs, give the caterer a final headcount, build the seating chart, and confirm arrival times with every vendor. Then delegate day-of logistics so you're not fielding questions in your dress." },
      { h2: "Make it yours, not a template" },
      { p: "No two weddings share the same priorities. Skip what doesn't matter to you and spend your energy on what does — the checklist is a map, not a mandate." },
    ],
    faqs: [
      {
        q: "How far in advance should you start planning a wedding?",
        a: "Twelve months is comfortable for most weddings, and it's when the best venues and vendors are still available. You can absolutely plan in 6 months or fewer — you'll just make decisions faster and have fewer date options.",
      },
      {
        q: "What should you book first when planning a wedding?",
        a: "Lock your budget, a rough guest count, and your date and venue before anything else. Nearly every other decision — catering, vendors, invitations — depends on those three anchors.",
      },
      {
        q: "When should wedding invitations be sent?",
        a: "Mail invitations about 8 weeks before the wedding, or 12 weeks for a destination wedding, and send save-the-dates 6–8 months out.",
      },
    ],
    keywords: [
      "wedding planning checklist",
      "wedding to do list",
      "wedding planning timeline",
      "how to plan a wedding",
    ],
  },
  {
    slug: "how-much-does-a-wedding-cost",
    title: "How much does a wedding cost? A realistic budget breakdown",
    category: "Budget",
    updated: "2026-07-22",
    readMinutes: 8,
    excerpt:
      "Where the money actually goes, typical percentages by category, and practical ways to cut costs without cutting the parts you'll remember.",
    intro:
      "Wedding costs vary enormously by location, guest count, and taste — so instead of a single scary number, it helps to think in percentages and per-guest math. Once you see where the money goes, it's much easier to decide what to prioritize and where to save.",
    body: [
      { h2: "Start with per-guest math" },
      { p: "Guest count is the biggest lever in your entire budget. Catering, bar, rentals, invitations, and favors all scale with the number of people. Cutting the list by 20 guests often saves more than trimming any single vendor. Before anything else, estimate your cost per head and multiply." },
      { h2: "Typical budget breakdown" },
      { p: "As a rough starting point, many couples land near these proportions. Treat them as a frame, not a rule — shift money toward whatever matters most to you." },
      { ul: [
        "Venue and catering: 40–50%",
        "Photography and video: 10–15%",
        "Flowers and décor: 8–10%",
        "Music/entertainment: 8–10%",
        "Attire and beauty: 5–8%",
        "Stationery, favors, and extras: 4–6%",
        "Planner or coordinator: 5–10%",
        "A buffer for the unexpected: 5%",
      ] },
      { h2: "Where couples overspend" },
      { p: "The common budget-busters are a guest list that quietly grows, upgrades added late (a bigger bar package, more florals), and forgetting the small line items — tips, postage, alterations, and vendor meals — that add up fast. Build a buffer in from day one." },
      { h2: "How to save without regret" },
      { p: "Cut costs on things guests forget and protect the things they'll remember." },
      { ul: [
        "Marry on a Friday, Sunday, or in the off-season for lower venue rates.",
        "Trim the guest list before you trim vendors — it's the highest-leverage cut.",
        "Prioritize photography; it's what you keep long after the day.",
        "Choose in-season, local flowers over imported blooms.",
        "Skip favors most guests leave behind.",
      ] },
      { h2: "Track it in one place" },
      { p: "A budget only works if it's live. Record estimates, then actuals as you book, so you always know what's left. A running total prevents the slow drift that turns a plan into a surprise." },
    ],
    faqs: [
      {
        q: "What percentage of a wedding budget goes to the venue?",
        a: "Venue and catering together typically take 40–50% of the total budget — by far the largest category, and the one most tied to your guest count.",
      },
      {
        q: "What is the biggest factor in wedding cost?",
        a: "Guest count. Because catering, bar, rentals, and stationery all scale per person, reducing the list is usually the single most effective way to lower the total.",
      },
      {
        q: "How much should you budget for a buffer?",
        a: "Set aside about 5% for the unexpected — last-minute upgrades, tips, postage, alterations, and vendor meals that are easy to forget when you first plan.",
      },
    ],
    keywords: [
      "how much does a wedding cost",
      "wedding budget breakdown",
      "average wedding cost",
      "wedding budget percentages",
    ],
  },
  {
    slug: "how-to-choose-a-wedding-venue",
    title: "How to choose a wedding venue (and questions to ask)",
    category: "Venues",
    updated: "2026-07-22",
    readMinutes: 7,
    excerpt:
      "A step-by-step way to compare venues on what actually matters — plus the exact questions to ask before you sign anything.",
    intro:
      "Your venue sets the date, the capacity, the aesthetic, and a big chunk of the budget — so it's worth choosing deliberately. Here's how to shortlist, tour, and compare venues without falling for the prettiest brochure.",
    body: [
      { h2: "Start with the three constraints" },
      { p: "Before you fall in love with a space, filter by the things you can't bend: your budget, your guest count, and your date range. A stunning venue that seats 80 doesn't work for 150 guests, no matter how good the photos look." },
      { h2: "Look past the aesthetics" },
      { p: "Pretty is easy to photograph; logistics are what make or break the day. On every tour, picture the actual flow — where guests park, where the ceremony becomes the reception, where the caterer works, what happens if it rains." },
      { h2: "Questions to ask on the tour" },
      { p: "Bring this list to every venue and write the answers down — by the third tour they blur together." },
      { ul: [
        "What's included, and what costs extra (tables, chairs, linens, staff)?",
        "Is catering in-house or do we bring our own? Is there a vendor list we must use?",
        "What's the rain or extreme-heat backup plan?",
        "How many hours does the rental cover, and what are overtime fees?",
        "When can vendors arrive to set up, and when must everything be out?",
        "What's the deposit, payment schedule, and cancellation policy?",
        "How many restrooms, and is the site accessible for elderly guests?",
      ] },
      { h2: "Compare on total cost, not sticker price" },
      { p: "A cheaper venue that requires outside catering, rentals, and a longer setup can cost more than an all-inclusive one. Add up the real total — space, required vendors, and fees — before comparing." },
      { h2: "Read the contract before you sign" },
      { p: "Check the cancellation and postponement terms, the final headcount deadline, overtime rates, and exactly what happens to your deposit. Get every verbal promise in writing." },
    ],
    faqs: [
      {
        q: "What should you look for in a wedding venue?",
        a: "Match it to your budget, guest count, and date first, then evaluate logistics — parking, weather backup, setup times, accessibility, and what's included — not just how it looks.",
      },
      {
        q: "What questions should you ask a wedding venue?",
        a: "Ask what's included versus extra, whether catering is in-house, the rain backup plan, rental hours and overtime fees, vendor access times, and the deposit and cancellation policy.",
      },
      {
        q: "How far in advance should you book a wedding venue?",
        a: "Book your venue as early as possible — ideally 12+ months out — because the date isn't truly fixed, and other vendors can't be booked, until the venue is signed.",
      },
    ],
    keywords: [
      "how to choose a wedding venue",
      "questions to ask wedding venue",
      "wedding venue checklist",
      "choosing a wedding venue",
    ],
  },
  {
    slug: "when-to-book-wedding-vendors",
    title: "Which wedding vendors to book — and when",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "The order to book vendors in so you keep your first choices, from the ones that sell out a year ahead to the ones you can arrange last.",
    intro:
      "Booking vendors isn't a race to sign the most contracts fastest — it's a sequence. Some vendors take one wedding per date and book a year out; others you can arrange in the final months. Get the order right and you keep your first choices without paying to rush.",
    body: [
      { h2: "Book first: the one-per-day vendors" },
      { p: "A handful of vendors can only serve one wedding on your date, so demand for the best of them is fierce. Once your venue and date are set, these come next." },
      { ul: [
        "Photographer and videographer.",
        "Wedding planner (book even earlier if you want full-service help).",
        "Caterer, if not included with the venue.",
        "Band or popular DJ.",
      ] },
      { h2: "Book next: 6–8 months out" },
      { p: "These matter enormously but have a bit more availability, so they follow once the headline vendors are locked." },
      { ul: [
        "Florist.",
        "Cake or dessert.",
        "Hair and makeup artists.",
        "Officiant.",
        "Rentals (furniture, tenting, lighting).",
      ] },
      { h2: "Book last: 2–4 months out" },
      { p: "The finishing touches can wait, though earlier never hurts if you've found someone you love." },
      { ul: [
        "Transportation.",
        "Day-of stationery (menus, signage, place cards).",
        "Favors.",
      ] },
      { h2: "How to vet any vendor" },
      { p: "Whatever the category, the checks are the same: look at a full real wedding (not just highlight reels), confirm they've worked your venue or one like it, read the contract for what's included, and make sure your communication styles click. You'll be trading messages with these people for months." },
    ],
    faqs: [
      {
        q: "What wedding vendors book up first?",
        a: "Photographers, videographers, planners, caterers, and popular bands or DJs — the vendors who take only one wedding per date. Book them right after your venue.",
      },
      {
        q: "How many months before the wedding should you book vendors?",
        a: "Book the one-per-day vendors 9–12 months out, florists/cake/beauty around 6–8 months, and transportation and finishing touches 2–4 months before.",
      },
      {
        q: "How do you choose a good wedding vendor?",
        a: "Review a full real wedding rather than a highlight reel, confirm experience at your venue, read the contract for what's included, and make sure communication feels easy — you'll work together for months.",
      },
    ],
    keywords: [
      "when to book wedding vendors",
      "wedding vendors checklist",
      "what wedding vendors book first",
      "wedding vendor timeline",
    ],
  },
  {
    slug: "wedding-guest-list",
    title: "How to make a wedding guest list without the drama",
    category: "Planning",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "A calm, fair way to build your guest list, handle plus-ones and kids, and keep the count — and the cost — under control.",
    intro:
      "The guest list is where budget, venue, and family politics collide, which is why it causes more tension than almost any other decision. A simple system takes the emotion out of it and keeps your headcount — and your spending — in check.",
    body: [
      { h2: "Set the number before the names" },
      { p: "Your venue capacity and per-guest budget set a ceiling. Decide that maximum first, then build the list to fit it. Starting with names and hoping the number works out is how lists quietly balloon." },
      { h2: "Use tiers" },
      { p: "Sort everyone into tiers: immediate family and closest friends first, then extended family and good friends, then coworkers and acquaintances. If you need to cut, you cut from the bottom tier — and if RSVPs come in low, you invite the next tier in a second wave." },
      { h2: "Agree on clear rules" },
      { p: "Ambiguity causes hurt feelings. Decide your policies up front and apply them evenly." },
      { ul: [
        "Plus-ones: e.g. only for married, engaged, or long-term partners.",
        "Kids: all, none, or immediate family only — pick one and hold it.",
        "Coworkers: all or none from a team, never a select few.",
      ] },
      { h2: "Split the list fairly" },
      { p: "If parents are contributing, they'll often expect input. Agree on how the list divides — a common split is thirds between the two of you and each set of parents — before invitations are drafted." },
      { h2: "Track RSVPs in one place" },
      { p: "Keep names, meal choices, and responses together so your final headcount, seating chart, and caterer numbers all draw from the same source. Chasing RSVPs across texts and spreadsheets is where mistakes creep in." },
    ],
    faqs: [
      {
        q: "How do you decide who to invite to a wedding?",
        a: "Set your maximum headcount from venue capacity and budget first, then sort people into tiers — close family and friends, extended circle, acquaintances — and fill from the top down.",
      },
      {
        q: "Who gets a plus-one at a wedding?",
        a: "Pick one clear rule and apply it evenly — commonly, plus-ones go to guests who are married, engaged, or in a long-term relationship. Consistency avoids hurt feelings.",
      },
      {
        q: "How do you handle kids at a wedding?",
        a: "Choose a single policy — all kids, no kids, or immediate family only — and apply it to everyone. Communicate it clearly on the invitation to avoid confusion.",
      },
    ],
    keywords: [
      "wedding guest list",
      "how to make a wedding guest list",
      "wedding plus one etiquette",
      "wedding guest list tips",
    ],
  },
  {
    slug: "wedding-day-timeline",
    title: "A wedding day timeline that keeps everything on track",
    category: "Planning",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "A sample hour-by-hour schedule for the wedding day, plus the buffers and hand-offs that keep it from running late.",
    intro:
      "The day itself moves fast, and a small delay early — hair running long, photos starting late — cascades into the evening. A realistic timeline with built-in buffers keeps everyone calm and on schedule. Here's a sample you can adapt to your start time.",
    body: [
      { h2: "Morning: getting ready" },
      { p: "Hair and makeup almost always take longer than the quoted time, so pad it. Have everyone ready 30–45 minutes before you think you need to be — that buffer absorbs the inevitable slippage." },
      { ul: [
        "Hair and makeup begin (allow 45–60 min per person).",
        "Photographer arrives for detail shots and getting-ready photos.",
        "Everyone dressed with a 30-minute cushion before departure.",
      ] },
      { h2: "Pre-ceremony: photos" },
      { p: "Deciding whether to do a first look is the biggest timeline choice. A first look lets you take couple and wedding-party photos before the ceremony, which frees the cocktail hour and shortens the gap for guests." },
      { h2: "Ceremony" },
      { p: "Most ceremonies run 20–40 minutes. Build in travel time if the ceremony and reception are in different places, and add a buffer — guests seating always takes longer than planned." },
      { h2: "Cocktail hour and reception" },
      { p: "Cocktail hour covers any remaining photos. Then the reception flows through entrances, dinner, toasts, first dances, and open dancing. Space the formalities so they don't all interrupt dinner at once." },
      { ul: [
        "Grand entrance and first dance.",
        "Welcome, then dinner service.",
        "Toasts between courses, not all at once.",
        "Cake cutting, then open dancing.",
        "Send-off.",
      ] },
      { h2: "Share it with everyone" },
      { p: "Give the timeline to your vendors, wedding party, and family a week ahead, with names and phone numbers next to each hand-off. When everyone knows where to be, you're free to actually enjoy the day." },
    ],
    faqs: [
      {
        q: "What is a typical wedding day timeline?",
        a: "Roughly: hair and makeup in the morning, photos (and an optional first look) before the ceremony, a 20–40 minute ceremony, a one-hour cocktail hour, then reception — entrances, dinner, toasts, dances, and dancing.",
      },
      {
        q: "How long should a wedding ceremony be?",
        a: "Most ceremonies run 20–40 minutes. Add buffer time for seating guests and, if the ceremony and reception are in different places, for travel.",
      },
      {
        q: "Should you do a first look?",
        a: "A first look lets you take couple and wedding-party photos before the ceremony, which frees up cocktail hour and keeps the schedule from running late — but it's a personal choice, not a rule.",
      },
    ],
    keywords: [
      "wedding day timeline",
      "wedding timeline template",
      "wedding day schedule",
      "wedding reception timeline",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export const GUIDE_CATEGORIES = [...new Set(GUIDES.map((g) => g.category))];
