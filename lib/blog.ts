/**
 * Blog content. Articles are original, evergreen wedding-planning writing —
 * plain data rendered by the blog pages, so there's no external CMS and nothing
 * to fetch. Add a post by appending to POSTS; the listing and /blog/[slug]
 * pages pick it up automatically.
 */

export type Block =
  | { h2: string }
  | { p: string }
  | { ul: string[] };

export interface Post {
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  date: string; // ISO; used for display and ordering
  excerpt: string;
  body: Block[];
}

export const POSTS: Post[] = [
  {
    slug: "12-month-wedding-timeline",
    title: "The 12-month wedding timeline that actually works",
    category: "Planning",
    readMinutes: 6,
    date: "2026-06-02",
    excerpt:
      "A month-by-month roadmap from “we’re engaged” to “I do” — with the deadlines that genuinely matter and the ones you can relax about.",
    body: [
      { p: "Most wedding timelines fail for the same reason: they treat every task as equally urgent. It isn’t. A handful of decisions unlock everything else, and if you get those in the right order, the rest of planning falls into place with far less stress. Here’s a twelve-month version that prioritizes what actually blocks other work." },
      { h2: "12+ months out: lock the three anchors" },
      { p: "Before anything else, settle your budget, a rough guest count, and your date and venue. These three are the anchors — nearly every later decision depends on them. You can’t price catering without a headcount, and you can’t book vendors without a date. Couples who skip ahead to the fun details usually end up redoing them." },
      { ul: [
        "Set a total budget and who’s contributing to it.",
        "Draft a guest list — even a loose one changes venue size and cost.",
        "Tour venues and book your date. The date is real once the venue is signed.",
      ] },
      { h2: "9 months out: book the vendors that sell out" },
      { p: "The best photographers, caterers, and bands are reserved a year ahead in busy markets. Once your date is fixed, these are the next priority — not because you need them tomorrow, but because waiting means losing your first choice." },
      { ul: [
        "Photographer and videographer.",
        "Caterer, if it isn’t bundled with the venue.",
        "Band or DJ — the one that sets the whole tone of the night.",
      ] },
      { h2: "6 months out: the middle layer" },
      { p: "With the big pieces booked, this is when the wedding starts to feel real. Order attire (dresses and suits often need months for alterations), book your florist and officiant, and plan the honeymoon while there’s time to find good fares." },
      { h2: "3 months out: confirm and communicate" },
      { p: "Send invitations, finalize the menu, and walk the timeline through with every vendor so nobody’s guessing on the day. This is also when a shared plan earns its keep — everyone helping should be able to see what’s done and what’s left." },
      { h2: "1 month out: the details" },
      { p: "Build the seating chart, collect the final headcount, and hand a day-of schedule to whoever is coordinating. If you’ve kept your tasks in one place, this month is mostly confirmation, not scramble." },
      { h2: "The week of: let it go" },
      { p: "Confirm arrivals, delegate the small errands, and step back. The work is done. The couples who enjoy their own wedding are the ones who trusted the plan they built over the previous year — and handed the last-minute logistics to someone else." },
    ],
  },
  {
    slug: "realistic-wedding-budget",
    title: "How to build a realistic wedding budget",
    category: "Budget",
    readMinutes: 5,
    date: "2026-05-18",
    excerpt:
      "Where the money actually goes, a percentage breakdown you can adapt to any headcount, and the buffer that keeps surprises from becoming stress.",
    body: [
      { p: "A wedding budget isn’t one number — it’s a set of trade-offs. The couples who stay on track aren’t the ones who spend the least; they’re the ones who decided early where the money matters to them and where it doesn’t. Start with a total, break it into categories, and protect a buffer." },
      { h2: "Start with the total, then divide" },
      { p: "Pick a number you’re genuinely comfortable with, including any family contributions. Then split it into categories. These percentages are a widely-used starting point — adjust them to your priorities, because a couple who cares about photography over flowers should shift the weighting." },
      { ul: [
        "Venue & catering — around 45%. This is almost always the largest line.",
        "Photography & video — about 12%.",
        "Flowers & décor — roughly 10%.",
        "Music & entertainment — about 8%.",
        "Attire & beauty — around 7%.",
        "Everything else — cake, stationery, favors, transport, coordinator — the remaining ~18%.",
      ] },
      { h2: "Budget per guest, not just in total" },
      { p: "Catering, rentals, invitations, and favors all scale with headcount. That means the single most powerful budget lever is the guest list. Trimming twenty guests can save more than cutting any other category — and it’s worth doing before you fall in love with a venue you can’t comfortably fill." },
      { h2: "Protect a 5–8% buffer" },
      { p: "Something always comes up: a vendor overage, a weather backup, an alteration you didn’t plan for. Set aside 5–8% of your total and don’t touch it until the final weeks. A buffer turns a surprise from a crisis into a shrug." },
      { h2: "Track it as you go" },
      { p: "A budget you write once and never revisit drifts. Keep a running total as deposits go out, so you always know what’s committed versus what’s left. When the whole plan lives in one place, the budget stays honest — and so does everyone helping you spend it." },
    ],
  },
  {
    slug: "which-vendors-to-book-first",
    title: "Which vendors to book first (and why it matters)",
    category: "Vendors",
    readMinutes: 4,
    date: "2026-05-04",
    excerpt:
      "The booking order that keeps your top choices from getting away — and why the sequence matters more than the speed.",
    body: [
      { p: "Booking vendors isn’t a race to sign the most contracts fastest. It’s a sequence. Some vendors book up a year ahead and only take one wedding per date; others you can arrange in the final months. Get the order right and you keep your first choices without paying to rush." },
      { h2: "Book in this order" },
      { ul: [
        "1. Venue — everything else keys off the date and location. Nothing can be confirmed until this is.",
        "2. Photographer and videographer — the best ones book 12+ months out, and there’s exactly one of your date.",
        "3. Caterer — often tied to the venue; confirm early either way.",
        "4. Music — band or DJ. It sets the energy of the entire reception.",
        "5. Florist and décor — important, but sourced closer in.",
        "6. Officiant, cake, stationery — the finishing layer.",
      ] },
      { h2: "Why the sequence beats the speed" },
      { p: "Every vendor after the venue depends on the date being fixed. Sign a photographer before you have a confirmed date and you may be renegotiating later. The sequence exists because each booking removes a dependency for the next one." },
      { h2: "Read the contract, not just the price" },
      { p: "Before you sign, check what’s actually included: hours of coverage, overtime rates, cancellation and rescheduling terms, and who the specific person working your wedding will be. The cheapest quote with a vague contract often costs more than the clear one." },
    ],
  },
  {
    slug: "wedding-style-that-lasts",
    title: "Choosing a wedding style that still feels like you",
    category: "Inspiration",
    readMinutes: 5,
    date: "2026-04-20",
    excerpt:
      "How to pick a look you’ll love in the photos for decades — starting from your own taste instead of a feed of someone else’s.",
    body: [
      { p: "It’s easy to lose your own taste in an afternoon of scrolling. The looks that hold up over decades aren’t the trendiest ones — they’re the ones that actually reflect the couple. Here’s how to find yours without a hundred open tabs." },
      { h2: "Start from what you already love" },
      { p: "Before you look at a single wedding photo, notice what you’re drawn to in the rest of your life: the colors in your home, the restaurants you return to, the seasons you love. A wedding style built from your real taste feels coherent in a way a copied one never does." },
      { h2: "Pick a palette and a setting first" },
      { p: "Two decisions do most of the work: your color palette and your venue’s natural character. A blush-and-sage garden and a navy-and-champagne ballroom lead to completely different flowers, attire, and lighting. Nail these two and the rest of the details have a frame to fit inside." },
      { ul: [
        "Rustic — warm ambers, dried florals, candlelight, a barn or vineyard.",
        "Modern — clean lines, monochrome florals, statement lighting.",
        "Garden — greenery, natural light, soft blush and sage.",
        "Coastal — airy neutrals, natural textures, a sense of open air.",
      ] },
      { h2: "Choose timeless over trend where it’s permanent" },
      { p: "Trends are wonderful for the details you won’t keep — a signature cocktail, a photo-booth backdrop. For the things that live forever in your photos, like attire and overall palette, lean toward what you’ll still love in twenty years. Trend the disposable, keep the permanent classic." },
      { h2: "Let it evolve" },
      { p: "Your vision will shift as you book real vendors and see real spaces, and that’s fine. Keep your inspiration in one place so it grows with you instead of scattering across screenshots — a living mood board beats a folder you never reopen." },
    ],
  },
  {
    slug: "planning-together-as-a-team",
    title: "Planning together: keeping your whole team in sync",
    category: "Collaboration",
    readMinutes: 5,
    date: "2026-04-06",
    excerpt:
      "A wedding is a group project. Here’s how to share the load with your partner, family, and vendors without the chaos of scattered texts.",
    body: [
      { p: "Almost no one plans a wedding alone, yet most of the planning tools assume one person holds it all. The result is a familiar mess: details in one person’s head, decisions buried in text threads, and the same question asked three times. A wedding is a group project — running it like one is what keeps it calm." },
      { h2: "Give everyone one source of truth" },
      { p: "The single biggest fix is a shared plan everyone can see. When your partner, your maid of honor, and your coordinator are all looking at the same task list, you stop being the switchboard that relays every update. Nothing lives only in your head." },
      { h2: "Assign owners, not just tasks" },
      { p: "A task with no name attached is a task nobody does. Give each responsibility an owner — who’s chasing the florist, who’s finalizing the seating chart — and a due date. Clear ownership prevents both the dropped ball and the awkward duplicate effort." },
      { ul: [
        "Decide who owns each area: budget, vendors, guests, day-of logistics.",
        "Set due dates so “later” has a meaning.",
        "Keep decisions where everyone can find them, not in a private thread.",
      ] },
      { h2: "Match the role to the person" },
      { p: "Your wedding party has different strengths. The organized friend is your logistics lead; the calm one is your day-of point of contact. Assigning roles to real strengths turns a group of willing helpers into an actual team." },
      { h2: "Protect your own bandwidth" },
      { p: "Delegating isn’t offloading stress onto others — it’s refusing to be the only person who knows everything. The couples who enjoy the process are the ones who built a plan their team could run without them, so the final weeks are shared, not shouldered alone." },
    ],
  },
  {
    slug: "how-ai-helps-plan-a-wedding",
    title: "5 ways AI makes wedding planning easier",
    category: "AI",
    readMinutes: 4,
    date: "2026-03-23",
    excerpt:
      "Not magic — just a faster way through the busywork, so you spend your time on the decisions that are actually yours to make.",
    body: [
      { p: "AI won’t choose your venue or feel your excitement. What it does well is the busywork — the drafting, the estimating, the first-pass structure — so you spend your energy on the decisions that genuinely need a human. Here’s where it actually helps." },
      { h2: "1. A timeline built around your date" },
      { p: "Instead of a generic checklist, AI can generate a month-by-month plan tuned to your specific date, guest count, and priorities — then adjust it when something changes. It’s a starting draft you edit, not a template you fight." },
      { h2: "2. A realistic budget in seconds" },
      { p: "Give it a headcount and a region and it returns a category breakdown you can adjust, rather than a blank spreadsheet. You still make the trade-offs; it just removes the intimidating first step." },
      { h2: "3. Vendor questions you didn’t know to ask" },
      { p: "AI can tell you what to ask a caterer, what a photography contract should cover, and which vendors to book first — the institutional knowledge that usually only comes from having done this before." },
      { h2: "4. Ideas when you’re stuck" },
      { p: "Describe a vibe and get a palette, a mood direction, or a day-of schedule to react to. Reacting to a draft is far easier than starting from nothing." },
      { h2: "5. Keeping the plan moving" },
      { p: "The quiet value is momentum: turning a vague worry into a concrete next step, and keeping the whole plan in one place so nothing slips. Used well, AI isn’t a gimmick bolted onto planning — it’s the assistant that handles the busywork so the day stays yours." },
    ],
  },
];

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug);
}

// Newest first for the listing.
export const POSTS_BY_DATE = [...POSTS].sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
);
