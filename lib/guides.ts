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
  {
    slug: "how-to-choose-a-wedding-photographer",
    title: "How to choose a wedding photographer",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 7,
    excerpt:
      "How to compare photographers on what matters, the questions to ask, and the contract details that protect the photos you'll keep forever.",
    intro:
      "Your photos are what's left when the day is over, so this is one vendor worth choosing carefully. The good news: once you know what to look for, comparing photographers gets a lot simpler. Here's how to find someone whose work — and working style — fits your day.",
    body: [
      { h2: "Judge a full gallery, not highlights" },
      { p: "Anyone can assemble a dazzling highlight reel from years of work. Ask to see two or three complete weddings, start to finish. A full gallery shows consistency — how they handle harsh midday light, dim receptions, group shots, and quiet in-between moments, not just the ten best frames." },
      { h2: "Match the style to your taste" },
      { p: "Photographers tend toward a style: light and airy, dark and moody, classic and timeless, or documentary. None is better — but you'll live with it forever, so pick the one you genuinely love. Look at how they edit skin tones and whether the mood feels like your day." },
      { h2: "Meet them before you book" },
      { p: "You'll spend the entire day with your photographer, and their presence shapes how relaxed you feel. A quick call or coffee tells you whether they put you at ease and how they direct people — which is most of what makes group photos painless." },
      { h2: "Questions to ask" },
      { ul: [
        "Will you personally shoot our wedding, or an associate? Is there a second shooter?",
        "How many hours of coverage, and what's the overtime rate?",
        "When do we get the photos, and roughly how many do we receive?",
        "Do we get full printing/sharing rights to the images?",
        "What's your backup plan for gear failure or illness?",
        "Have you shot at our venue or one like it?",
      ] },
      { h2: "Read the contract" },
      { p: "Confirm the deliverables in writing: hours of coverage, number of edited images, delivery timeline, image rights, and the cancellation and illness-backup policy. Clarity here prevents the most common post-wedding disputes." },
    ],
    faqs: [
      {
        q: "How much does a wedding photographer cost?",
        a: "It varies widely by market and experience, but photography typically runs 10–15% of the total wedding budget. Compare packages on hours of coverage, number of edited images, and image rights — not just the headline price.",
      },
      {
        q: "What should you look for in a wedding photographer?",
        a: "Review two or three complete galleries for consistency, make sure their editing style matches your taste, confirm who actually shoots your day, and meet them to check you feel at ease together.",
      },
      {
        q: "How far in advance should you book a wedding photographer?",
        a: "Book 9–12 months out. Photographers take one wedding per date, so the best ones fill popular dates a year ahead.",
      },
    ],
    keywords: [
      "how to choose a wedding photographer",
      "questions to ask wedding photographer",
      "wedding photographer tips",
      "hiring a wedding photographer",
    ],
  },
  {
    slug: "how-to-choose-a-wedding-florist",
    title: "How to choose a wedding florist",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "How to brief a florist, keep flowers on budget with seasonal choices, and the questions that reveal whether they're the right fit.",
    intro:
      "Flowers set the mood of a room more than almost anything else — and they're easier to keep on budget than most couples expect, if you make a few smart choices early. Here's how to find a florist who gets your vision and works within your number.",
    body: [
      { h2: "Bring a visual brief" },
      { p: "Florists think in images, so come with a small collection of photos you love — plus your colors, your venue, and any flowers you adore or can't stand. A tight brief gets a far more useful (and accurate) quote than 'something pretty and seasonal.'" },
      { h2: "Let season and locality do the work" },
      { p: "In-season, locally grown flowers cost less and look fresher than imported blooms flown in out of season. A good florist will suggest beautiful seasonal stand-ins for pricey requests — peonies in winter, for instance, are expensive and fragile. Flexibility here saves real money." },
      { h2: "Prioritize where flowers are seen" },
      { p: "Spend on the pieces people actually notice up close and photograph most — the bouquet, the ceremony backdrop, the centerpieces — and go simpler on spots guests barely register. Reusing ceremony arrangements at the reception stretches the budget further." },
      { h2: "Questions to ask" },
      { ul: [
        "Have you worked at our venue, and are there any floral restrictions?",
        "What's realistic for our budget — and where would you splurge or save?",
        "Do you offer rentals (vases, arches, candles) or is everything purchased?",
        "Can ceremony flowers be repurposed at the reception?",
        "Who sets up and breaks down, and is that included?",
        "What happens if a flower we chose isn't available that week?",
      ] },
      { h2: "Confirm the details" },
      { p: "Get an itemized proposal listing each arrangement, the setup and breakdown plan, delivery timing, and the rental return terms. An itemized quote makes it easy to trim a piece or two if you need to reach your number." },
    ],
    faqs: [
      {
        q: "How much should you spend on wedding flowers?",
        a: "Flowers usually take about 8–10% of the wedding budget. Choosing in-season, local blooms and reusing ceremony arrangements at the reception keeps costs down without sacrificing impact.",
      },
      {
        q: "How do you save money on wedding flowers?",
        a: "Pick in-season, locally grown flowers, spend on high-visibility pieces (bouquet, ceremony backdrop, centerpieces), repurpose ceremony arrangements, and ask your florist for seasonal stand-ins for expensive requests.",
      },
      {
        q: "What should you bring to a florist consultation?",
        a: "Bring a few inspiration photos, your color palette, your venue details, your budget, and a short list of flowers you love or want to avoid — a clear brief gets a more accurate quote.",
      },
    ],
    keywords: [
      "how to choose a wedding florist",
      "wedding flowers budget",
      "questions to ask wedding florist",
      "how to save on wedding flowers",
    ],
  },
  {
    slug: "how-to-choose-a-wedding-dj-or-band",
    title: "How to choose a wedding DJ or band",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "DJ vs. band, how to judge an entertainer who can also run your reception, and the questions that keep the dance floor full.",
    intro:
      "Music and the MC set the energy of your reception — a great entertainer keeps the dance floor full and the night flowing, while the wrong one can flatten the room. Here's how to decide between a DJ and a band, and how to vet either.",
    body: [
      { h2: "DJ or band?" },
      { p: "A DJ offers the widest range of songs, exact recordings, and usually a lower price — great if you want a specific playlist and a packed dance floor. A live band brings energy and spectacle but costs more, takes more space, and works from a set repertoire. Some couples split the difference: a DJ for the reception, a soloist or trio for the ceremony and cocktail hour." },
      { h2: "They're also your MC" },
      { p: "Your DJ or bandleader usually runs the room — announcing entrances, cueing toasts and dances, and reading the crowd. That hosting skill matters as much as the music. Ask how they handle the flow of the night and how they take (or limit) requests." },
      { h2: "Hear them in a real setting" },
      { p: "A polished promo video is table stakes. Ask for audio or video from an actual wedding, or whether you can hear them live. You're listening for how they blend songs, manage transitions, and keep momentum — not just whether they sound good in a studio clip." },
      { h2: "Questions to ask" },
      { ul: [
        "Will the person we meet be the one performing on our date?",
        "How do you handle must-play and do-not-play lists and guest requests?",
        "What does setup need — space, power, and how long?",
        "Do you provide ceremony and cocktail-hour sound, and microphones for toasts?",
        "What's your backup plan if equipment fails or you're ill?",
        "How much overtime is available and at what rate?",
      ] },
      { h2: "Lock the details" },
      { p: "Put the performer's name, hours, equipment, breaks, and backup plan in the contract. Share your must-play and do-not-play lists early so there are no surprises when the dancing starts." },
    ],
    faqs: [
      {
        q: "Should you hire a DJ or a band for a wedding?",
        a: "A DJ gives you a wider song range and lower cost; a live band brings energy and spectacle at a higher price and larger footprint. Many couples use a DJ for the reception and live musicians for the ceremony or cocktail hour.",
      },
      {
        q: "What questions should you ask a wedding DJ?",
        a: "Confirm the actual performer on your date, how they handle must-play/do-not-play lists and requests, setup and power needs, ceremony/cocktail sound and toast mics, overtime rates, and their equipment-failure backup plan.",
      },
      {
        q: "How much does a wedding DJ or band cost?",
        a: "Music and entertainment typically run about 8–10% of the budget. A DJ is usually less than a live band; the exact figure depends on your market, the hours, and whether you also need ceremony and cocktail-hour music.",
      },
    ],
    keywords: [
      "how to choose a wedding DJ",
      "wedding DJ vs band",
      "questions to ask wedding DJ",
      "wedding band vs DJ",
    ],
  },
  {
    slug: "how-to-choose-a-wedding-caterer",
    title: "How to choose a wedding caterer",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "Service styles compared, what a per-plate quote really includes, and the questions to ask before you book the biggest line item after your venue.",
    intro:
      "Catering is usually the largest expense after the venue, and it shapes how the reception feels — from a relaxed buffet to a formal plated dinner. Here's how to compare caterers on real total cost and find food your guests will actually remember.",
    body: [
      { h2: "Start with service style" },
      { p: "The style drives both cost and atmosphere. Plated service is formal and needs more staff; buffets are relaxed and let guests choose; family-style lands in between and encourages conversation; stations and heavy passed appetizers suit a livelier, mingling reception. Pick the feel you want first, then price it." },
      { h2: "Understand what a per-plate price includes" },
      { p: "A per-head quote can mean very different things. Confirm whether it covers staff, rentals (plates, glassware, linens), setup and cleanup, and service charges — or whether those are extra. The lowest per-plate number often isn't the lowest total once the add-ons appear." },
      { h2: "Always do a tasting" },
      { p: "Never book significant catering without tasting the actual menu. A tasting also shows how the food holds up at scale and lets you fine-tune seasoning, portions, and presentation. Bring anyone helping decide, and ask how they handle dietary needs." },
      { h2: "Questions to ask" },
      { ul: [
        "Is the per-person price all-in, or are staff, rentals and service charges extra?",
        "How do you handle allergies, and vegetarian, vegan or other dietary needs?",
        "What's the staff-to-guest ratio, and are gratuities included?",
        "Do you provide the bar, or is that separate? Can we bring our own alcohol?",
        "Have you worked at our venue, and do you handle setup and cleanup?",
        "When do you need the final headcount, and what's the cancellation policy?",
      ] },
      { h2: "Compare on total cost" },
      { p: "Add up everything — food, staff, rentals, bar, service charge, and tax — before comparing caterers. And nail down the final-headcount deadline, since that number sets your final bill." },
    ],
    faqs: [
      {
        q: "How much does wedding catering cost?",
        a: "Venue and catering together are typically 40–50% of the wedding budget, and catering is usually the biggest line item after the venue. Compare total cost — food plus staff, rentals, bar, and service charges — not just the per-plate price.",
      },
      {
        q: "What is the best service style for a wedding?",
        a: "It depends on the feel you want: plated is formal, buffet is relaxed and budget-friendly, family-style encourages conversation, and stations suit a lively, mingling reception. Choose the atmosphere first, then price it.",
      },
      {
        q: "What questions should you ask a wedding caterer?",
        a: "Ask whether the per-person price is all-inclusive, how they handle dietary needs, the staff-to-guest ratio and gratuities, bar options, venue experience and cleanup, and the final-headcount and cancellation terms.",
      },
    ],
    keywords: [
      "how to choose a wedding caterer",
      "wedding catering cost",
      "questions to ask wedding caterer",
      "wedding catering styles",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export const GUIDE_CATEGORIES = [...new Set(GUIDES.map((g) => g.category))];
