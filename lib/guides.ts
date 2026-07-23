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
  {
    slug: "how-to-choose-a-wedding-videographer",
    title: "How to choose a wedding videographer",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "Whether you need video, the film styles to know, and the questions that get you a wedding film you'll actually rewatch.",
    intro:
      "Photos freeze moments; video keeps the movement, the voices, and the vows. If reliving the day matters to you, a videographer is worth the budget. Here's how to decide whether you need one and how to pick someone whose films you'll love.",
    body: [
      { h2: "Decide if video is for you" },
      { p: "Not every couple wants video, and that's fine. But the things a photo can't capture — your partner's voice during the vows, a parent's toast, the roar of the dance floor — are exactly what couples say they treasure most later. If those moments matter, it's money well spent." },
      { h2: "Know the styles" },
      { p: "Videographers work in recognizable styles. Cinematic films are polished and edited to music like a short movie; documentary films play events out more fully and in order; some deliver a short highlight reel, others a longer feature, many both. Decide whether you want a tight 3–5 minute film, a full documentary, or both before comparing." },
      { h2: "Watch full films and listen to the audio" },
      { p: "Audio is where cheap video falls apart. Watch a couple of complete films — not just highlight reels — and listen: are the vows and toasts crisp, or muddy and wind-blown? Clean audio usually means they use proper mics, which separates the pros from the rest." },
      { h2: "Coordinate with your photographer" },
      { p: "Your photographer and videographer share the same key moments all day. Pros are used to working together, but it helps if they've met a similar setup. Ask how they stay out of each other's shots — you don't want a camera operator in every photo." },
      { h2: "Questions to ask" },
      { ul: [
        "What deliverables do we get — highlight film, full film, raw footage — and how long?",
        "How do you capture audio for vows and toasts?",
        "When will the film be ready, and how many revisions are included?",
        "Will you personally film, and is there a second shooter?",
        "How do you coordinate with our photographer?",
        "What's your backup plan for gear or illness?",
      ] },
    ],
    faqs: [
      {
        q: "Do you need a videographer for a wedding?",
        a: "It's optional, but video captures what photos can't — your vows spoken aloud, toasts, and the energy of the day. If reliving those moments matters to you, it's worth budgeting for.",
      },
      {
        q: "How much does a wedding videographer cost?",
        a: "Costs vary by market and deliverables. Compare on what you receive — highlight film, full film, raw footage — audio quality, and delivery time, rather than price alone.",
      },
      {
        q: "What is the difference between cinematic and documentary wedding video?",
        a: "Cinematic films are polished and edited to music like a short movie; documentary films present events more fully and in order. Many videographers offer a short highlight film plus a longer documentary edit.",
      },
    ],
    keywords: [
      "how to choose a wedding videographer",
      "do you need a wedding videographer",
      "wedding videographer questions",
      "wedding video styles",
    ],
  },
  {
    slug: "wedding-hair-and-makeup-guide",
    title: "Booking wedding hair and makeup: a complete guide",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "Why the trial matters most, how to build a realistic morning timeline, and the questions to ask your hair and makeup artists.",
    intro:
      "Hair and makeup is the vendor closest to you on the morning of the wedding, and the one most likely to run late if you don't plan it. Get the trial and the timeline right and you'll start the day calm and looking like the best version of yourself.",
    body: [
      { h2: "The trial is non-negotiable" },
      { p: "Always book a trial before the wedding, ideally near your date so your hair length and skin match. A trial is where you catch what photos and words can't convey — how a look wears over hours, how it photographs with flash, and whether it truly feels like you. Bring inspiration photos and wear a light-colored top." },
      { h2: "Build the morning timeline backward" },
      { p: "Hair and makeup almost always run longer than quoted. Work backward from when you need to be ready, allow 45–60 minutes per person, and add a 30-minute cushion. Decide the order — often the person being photographed getting ready goes last so their look is freshest." },
      { h2: "Decide who's in the chair" },
      { p: "Count everyone getting professional hair or makeup — you, attendants, mothers — because it drives both timing and cost. More people means an earlier start or a second artist. Confirm whether the quote is per person and whether there's a minimum." },
      { h2: "Questions to ask" },
      { ul: [
        "Is a trial included, and when should we schedule it?",
        "Do you come to us, and is there a travel fee?",
        "How long do you allow per person, and do you bring an assistant for larger groups?",
        "Do you use long-wear or airbrush products for photos and heat?",
        "Can you do touch-ups later, or provide a touch-up kit?",
        "What's the deposit and cancellation policy?",
      ] },
      { h2: "Lock the logistics" },
      { p: "Confirm the arrival time, the number of services, travel fees, and the trial date in writing. Share your morning timeline so the artist knows exactly when each person needs to be finished." },
    ],
    faqs: [
      {
        q: "Should you do a hair and makeup trial before the wedding?",
        a: "Yes — always. A trial shows how a look wears over hours and photographs with flash, and lets you adjust before the day. Book it close to your wedding date so hair length and skin tone match.",
      },
      {
        q: "How long does wedding hair and makeup take?",
        a: "Allow roughly 45–60 minutes per person and add a 30-minute cushion. For larger groups, ask about a second artist so you're not starting before dawn.",
      },
      {
        q: "How much does wedding hair and makeup cost?",
        a: "It's usually priced per person, often with a minimum, plus a possible travel fee. Confirm whether the trial is included and whether pricing changes for the bridal look versus attendants.",
      },
    ],
    keywords: [
      "wedding hair and makeup",
      "wedding makeup trial",
      "bridal hair and makeup timeline",
      "wedding makeup artist questions",
    ],
  },
  {
    slug: "how-to-choose-a-wedding-cake",
    title: "How to choose a wedding cake",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 5,
    excerpt:
      "How cake pricing really works, how much to order, and the questions to ask at your tasting — plus ways to save.",
    intro:
      "The cake is part dessert, part centerpiece, and its price can swing widely based on choices most couples don't realize matter. A little know-how gets you something delicious and beautiful without overspending.",
    body: [
      { h2: "Understand how cakes are priced" },
      { p: "Wedding cakes are usually priced per slice, and the number climbs with complexity: hand-piped detail, sugar flowers, fondant, and multiple tiers all add labor. A simpler design in the same flavor can cost far less and photograph just as beautifully." },
      { h2: "Order the right amount" },
      { p: "You generally need about one slice per guest, but you don't need every slice to come from the display cake. A common money-saver is a smaller decorated cake for the cutting photo plus a plain 'kitchen cake' or sheet cake sliced in the back — guests never know the difference." },
      { h2: "Make the tasting count" },
      { p: "Taste before you commit, and bring your color palette and a photo or two of styles you like. Ask how the cake holds up in your venue's temperature — buttercream can soften in summer heat, which affects both flavor and design choices." },
      { h2: "Questions to ask" },
      { ul: [
        "How is it priced, and what drives the cost up or down?",
        "Do you handle delivery and setup, and is that included?",
        "How will it hold up in our venue's temperature?",
        "Can you accommodate allergies or a gluten-free tier?",
        "Do we owe a deposit on rented stands or toppers?",
        "When do you need the final design and guest count?",
      ] },
    ],
    faqs: [
      {
        q: "How much does a wedding cake cost?",
        a: "Wedding cakes are typically priced per slice, and cost rises with complexity — sugar flowers, fondant, hand-piping, and extra tiers. A simpler design in the same flavor can be much cheaper.",
      },
      {
        q: "How do you save money on a wedding cake?",
        a: "Order a smaller decorated cake for the cutting photo plus a plain sheet 'kitchen cake' sliced in the back, choose a simpler design, and skip elaborate sugar work — guests remember the taste more than the tiers.",
      },
      {
        q: "How much wedding cake do you need per guest?",
        a: "Plan on about one slice per guest. Not all of it has to come from the display cake — many couples supplement with a back-of-house sheet cake in the same flavor.",
      },
    ],
    keywords: [
      "how to choose a wedding cake",
      "wedding cake cost",
      "wedding cake per slice",
      "how to save on wedding cake",
    ],
  },
  {
    slug: "how-to-choose-a-wedding-officiant",
    title: "How to choose a wedding officiant",
    category: "Vendors",
    updated: "2026-07-22",
    readMinutes: 5,
    excerpt:
      "Your options for who marries you, how to make the ceremony legal, and the questions to ask so the ceremony sounds like you.",
    intro:
      "The officiant shapes the one part of the day that's legally required and emotionally central — the ceremony itself. Choosing the right person, and handling the legal side correctly, makes sure your marriage is both meaningful and valid.",
    body: [
      { h2: "Know your options" },
      { p: "You can be married by a religious leader, a professional celebrant, a civil officiant like a judge or registrar, or — in many places — a friend or family member who gets temporarily authorized to officiate. A personal officiant makes the ceremony intimate; a professional brings polish and experience. There's no wrong choice, only the right fit for you." },
      { h2: "Handle the legal side early" },
      { p: "The officiant's authority and your marriage license are what make the marriage legal — and the rules vary by location. Confirm what your area requires: who may legally officiate, whether the officiant must register in advance, and the license timing (some places have a waiting period or an expiry window). Sort this out well before the date, and verify the specifics with your local marriage authority." },
      { h2: "Make the ceremony sound like you" },
      { p: "A good officiant tailors the ceremony to your story rather than reading a generic script. Meet them, share how you met and what your relationship means, and ask to review the ceremony draft. Decide together on readings, vows (written or traditional), and any cultural or religious elements." },
      { h2: "Questions to ask" },
      { ul: [
        "Are you legally able to officiate in our location, and do you handle the license paperwork?",
        "Do you personalize the ceremony, and can we review a draft?",
        "Can we write our own vows, and will you help structure them?",
        "Will you run the rehearsal?",
        "How long does a typical ceremony run?",
      ] },
    ],
    faqs: [
      {
        q: "Who can legally officiate a wedding?",
        a: "Depending on your location, that can be a religious leader, a civil officiant such as a judge or registrar, a professional celebrant, or a friend or family member who gets temporarily authorized. Rules vary, so confirm the requirements with your local marriage authority.",
      },
      {
        q: "Can a friend or family member officiate your wedding?",
        a: "In many places, yes — a friend or family member can get temporarily authorized to officiate. Check your local rules early, since some require the officiant to register in advance.",
      },
      {
        q: "What makes a wedding legal?",
        a: "A valid marriage license and an authorized officiant, filed correctly after the ceremony. Requirements and timing (including any waiting period or license expiry) vary by location, so verify the specifics locally.",
      },
    ],
    keywords: [
      "how to choose a wedding officiant",
      "who can officiate a wedding",
      "wedding officiant questions",
      "can a friend officiate a wedding",
    ],
  },
  {
    slug: "how-to-plan-a-wedding-in-6-months",
    title: "How to plan a wedding in 6 months",
    category: "Planning",
    updated: "2026-07-22",
    readMinutes: 7,
    excerpt:
      "A focused, month-by-month plan for a shorter engagement — what to lock immediately, what to skip, and how to stay sane.",
    intro:
      "Six months is plenty of time to plan a beautiful wedding — you'll just make decisions faster and in a tighter order. The key is to move on the things that book up first and let go of the pressure to do everything. Here's a realistic month-by-month plan.",
    body: [
      { h2: "Month 1: lock the anchors" },
      { p: "With a short runway, speed on the big three matters most. Set your budget and guest count, then book a date and venue quickly — flexibility on the day of the week or season opens up far more options at better prices." },
      { ul: [
        "Set budget and rough guest count.",
        "Book venue and date (be flexible for availability).",
        "Book the one-per-day vendors immediately: photographer, caterer, band or DJ.",
      ] },
      { h2: "Month 2: the vendors and the dress" },
      { p: "Order attire now — off-the-rack or made-to-order with a rush, since traditional gown timelines won't fit. Book the remaining key vendors before dates fill." },
      { ul: [
        "Order dress/suit (ask about rush alterations).",
        "Book florist, cake, hair and makeup, officiant.",
        "Send save-the-dates or go straight to invitations.",
      ] },
      { h2: "Months 3–4: details and paper" },
      { p: "Now the choices that personalize the day. With a compressed timeline, send invitations on the early side so RSVPs come back in time." },
      { ul: [
        "Mail invitations (aim for 6–8 weeks before).",
        "Finalize menu and do a tasting.",
        "Buy rings; book transportation and room blocks.",
        "Plan the ceremony and choose readings and vows.",
      ] },
      { h2: "Month 5: confirm everything" },
      { p: "Chase RSVPs, build the seating chart as numbers firm up, and confirm timelines and arrival times with every vendor. Handle the marriage license within your area's valid window." },
      { h2: "Month 6: the final stretch" },
      { p: "Give the caterer a final headcount, do a final dress fitting, confirm day-of logistics, and delegate. Assign someone (or a coordinator) to field vendor questions so you can be present." },
      { h2: "What to let go of" },
      { p: "A short timeline is permission to simplify. Skip elaborate DIY projects, trust vendors' recommendations instead of over-researching, and remember that guests come for you, not for perfection." },
    ],
    faqs: [
      {
        q: "Can you plan a wedding in 6 months?",
        a: "Yes. Six months is enough for a beautiful wedding — you'll just decide faster. Lock your budget, guest count, venue, and one-per-day vendors (photographer, caterer, band/DJ) in the first few weeks, then work through details month by month.",
      },
      {
        q: "What should you book first for a short-notice wedding?",
        a: "Book the venue and date immediately, then the vendors that take one wedding per day — photographer, caterer, and band or DJ. Flexibility on the day or season dramatically improves availability.",
      },
      {
        q: "How late can you send wedding invitations?",
        a: "With a short timeline, aim to mail invitations 6–8 weeks before the wedding so RSVPs return in time to finalize your headcount and seating.",
      },
    ],
    keywords: [
      "how to plan a wedding in 6 months",
      "short engagement wedding planning",
      "plan a wedding fast",
      "6 month wedding timeline",
    ],
  },
  {
    slug: "wedding-invitations-guide",
    title: "Wedding invitations: wording, timing, and what to include",
    category: "Stationery",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "When to send, what every invitation must include, wording basics, and how to count quantities so you don't over- or under-order.",
    intro:
      "Invitations do real work: they tell guests when and where to show up, set the tone, and collect the RSVPs your headcount depends on. Here's how to get the timing, wording, and quantities right.",
    body: [
      { h2: "When to send" },
      { p: "Mail invitations about 8 weeks before the wedding — 12 weeks for a destination or holiday weekend, so guests can book travel. Set the RSVP deadline 3–4 weeks before the date, which gives you time to chase stragglers and give the caterer a final count." },
      { h2: "What every invitation includes" },
      { p: "At minimum, guests need to know who, when, where, and how to respond." },
      { ul: [
        "Hosts (traditionally whoever is contributing) and the couple's names.",
        "Date, start time, and ceremony location.",
        "Reception details (or a separate reception card).",
        "An RSVP method and deadline.",
        "Dress code, if you have one.",
        "Where to find more info — often a wedding website URL.",
      ] },
      { h2: "Wording basics" },
      { p: "Formality is a spectrum. Traditional wording spells everything out (\"request the honour of your presence\"); modern wording is warmer and plainer (\"together with their families, invite you to celebrate\"). Match the wording to the wedding's tone, and be consistent across every piece." },
      { h2: "How many to order" },
      { p: "Order by household, not by guest — one invitation per couple or family, not per person. Count your households, then add 15–20 extras for mistakes, keepsakes, and last-minute additions. Reprinting a small batch later costs far more per piece than ordering the extras now." },
      { h2: "Don't forget the extras" },
      { p: "Budget for postage (bulky or square envelopes cost more), RSVP-card return postage if you're using mail replies, and any inner envelopes, belly bands, or wax seals. These small line items add up quickly." },
    ],
    faqs: [
      {
        q: "When should you send wedding invitations?",
        a: "Mail them about 8 weeks before the wedding, or 12 weeks for a destination wedding, and set the RSVP deadline 3–4 weeks before the date so you can finalize your headcount.",
      },
      {
        q: "What information goes on a wedding invitation?",
        a: "The hosts and couple's names, the date, time, and ceremony location, reception details, an RSVP method and deadline, any dress code, and often a wedding website for extra information.",
      },
      {
        q: "How many wedding invitations should you order?",
        a: "Order one per household (not per guest), then add 15–20 extras for addressing mistakes, keepsakes, and last-minute additions — reprinting a few later costs much more per piece.",
      },
    ],
    keywords: [
      "wedding invitations guide",
      "wedding invitation wording",
      "when to send wedding invitations",
      "what to include on wedding invitation",
    ],
  },
  {
    slug: "save-the-dates-vs-invitations",
    title: "Save-the-dates vs. invitations: what's the difference?",
    category: "Stationery",
    updated: "2026-07-22",
    readMinutes: 4,
    excerpt:
      "What each one is for, when to send them, who gets them, and whether you need save-the-dates at all.",
    intro:
      "Save-the-dates and invitations do two different jobs at two different times. Mixing them up leads to confused guests or double-booked weekends. Here's the simple breakdown.",
    body: [
      { h2: "Save-the-dates: the heads-up" },
      { p: "A save-the-date is an early announcement — it tells guests to hold the day so they can plan travel and time off. It's short: your names, the date, and the city. Formal details and the RSVP come later, on the invitation. Send save-the-dates 6–8 months ahead, or up to a year for a destination wedding." },
      { h2: "Invitations: the formal ask" },
      { p: "The invitation is the official request to attend, with the full when-and-where and how to RSVP. It sets the tone and collects responses. Send invitations about 8 weeks before the wedding (12 for a destination)." },
      { h2: "Who gets which" },
      { p: "One rule prevents awkwardness: everyone who receives a save-the-date must receive an invitation. A save-the-date is effectively a promise. So only send them to guests you're certain you're inviting — finalize the core list first." },
      { h2: "Do you even need save-the-dates?" },
      { p: "They're optional. They're most valuable for destination weddings, holiday weekends, or when many guests travel — anything that requires advance planning. For a local wedding with a short timeline, you can skip straight to invitations." },
    ],
    faqs: [
      {
        q: "What is the difference between a save-the-date and an invitation?",
        a: "A save-the-date is an early heads-up (names, date, city) sent 6–8 months ahead so guests can plan; the invitation is the formal request with full details and RSVP, sent about 8 weeks before the wedding.",
      },
      {
        q: "Do you have to invite everyone who got a save-the-date?",
        a: "Yes. A save-the-date is a promise, so everyone who receives one must also receive an invitation. Finalize your core guest list before sending them.",
      },
      {
        q: "Do you need save-the-dates?",
        a: "They're optional, but valuable for destination weddings, holiday weekends, or when many guests travel. For a local wedding on a short timeline, you can skip them and send invitations only.",
      },
    ],
    keywords: [
      "save the dates vs invitations",
      "when to send save the dates",
      "do you need save the dates",
      "save the date etiquette",
    ],
  },
  {
    slug: "wedding-registry-guide",
    title: "How to create a wedding registry",
    category: "Planning",
    updated: "2026-07-22",
    readMinutes: 5,
    excerpt:
      "When to register, how many gifts to add across price ranges, cash and honeymoon funds, and how to share your registry politely.",
    intro:
      "A registry makes gift-giving easy for guests and gets you things you'll actually use. A little strategy — range of prices, enough options, the right timing — makes it work smoothly for everyone.",
    body: [
      { h2: "Register early" },
      { p: "Set up your registry before you send save-the-dates, because eager guests (and anyone throwing a shower) will look for it as soon as they hear the news. You can keep adding to it over time — start early, refine later." },
      { h2: "Offer a range of prices and plenty of options" },
      { p: "Guests have different budgets, so include gifts across low, medium, and higher price points. And add more items than you have guests — a good rule is roughly two gifts per guest — so people still have good choices late, when the affordable items are gone." },
      { h2: "Consider cash, honeymoon, and charity funds" },
      { p: "Many couples already have a full kitchen, so cash funds, honeymoon funds, or a charity option are increasingly normal and welcome. Mix these with physical gifts so guests who prefer picking something tangible still can." },
      { h2: "Share it the right way" },
      { p: "Never print registry details on the invitation itself — it reads as asking for gifts. Instead, put the registry link on your wedding website, and let family and the wedding party share it when guests ask. Word of mouth does most of the work." },
    ],
    faqs: [
      {
        q: "When should you set up a wedding registry?",
        a: "Register before you send save-the-dates. Guests and shower hosts look for it as soon as they hear the news, and you can keep adding items over time.",
      },
      {
        q: "How many items should you put on a wedding registry?",
        a: "Aim for roughly two gifts per guest, spread across low, medium, and higher price points, so people always have good options — even late, after the affordable items are claimed.",
      },
      {
        q: "Is it okay to have a cash or honeymoon fund?",
        a: "Yes — cash, honeymoon, and charity funds are widely accepted now, especially for couples who already have a furnished home. Offer a mix so guests who prefer a physical gift still have choices.",
      },
    ],
    keywords: [
      "wedding registry guide",
      "how to create a wedding registry",
      "how many items wedding registry",
      "honeymoon fund registry",
    ],
  },
  {
    slug: "honeymoon-planning-guide",
    title: "How to plan your honeymoon",
    category: "Planning",
    updated: "2026-07-22",
    readMinutes: 6,
    excerpt:
      "When to book, how to budget, whether to leave right after the wedding, and how to choose a destination you'll both love.",
    intro:
      "The honeymoon is the reward at the end of all the planning — but it deserves a little planning of its own so it's relaxing, not rushed. Here's how to choose, budget, and time it well.",
    body: [
      { h2: "Choose a destination together" },
      { p: "Start with the kind of trip you both want — beach and rest, city and culture, adventure and outdoors — before picking a place. Factor in the season (you want good weather at your destination, which may be opposite your wedding season) and travel time. A shorter flight leaves more days to actually relax." },
      { h2: "Set a realistic budget" },
      { p: "Decide the honeymoon budget alongside the wedding budget, not after — it's easy to spend everything on the day and leave nothing for the trip. Account for flights, lodging, food, activities, and a cushion. A honeymoon registry or cash fund can help guests contribute." },
      { h2: "Book in the right order" },
      { p: "Lock flights and lodging early, especially for popular destinations and peak seasons — prices climb and the best resorts fill. Then arrange activities and reservations closer to the date. Don't forget passports (renew early if they expire within six months) and any visas or vaccinations." },
      { h2: "Leave right away, or later?" },
      { p: "A 'minimoon' — leaving immediately for a short trip, then taking the big honeymoon later — is increasingly popular. It lets you decompress right after the wedding without the pressure (and expense) of planning a major trip during an already busy time. There's no rule; do what fits your energy and budget." },
      { h2: "Tell vendors you're newlyweds" },
      { p: "Hotels and airlines often add small perks — a room upgrade, a welcome treat — for honeymooners. Mention it when booking; the worst they can say is no." },
    ],
    faqs: [
      {
        q: "When should you book your honeymoon?",
        a: "Book flights and lodging early — several months out for popular destinations and peak seasons — then arrange activities closer to the date. Check that passports won't expire within six months of travel.",
      },
      {
        q: "How much should you budget for a honeymoon?",
        a: "Set the honeymoon budget alongside the wedding budget so you don't spend it all on the day. Include flights, lodging, food, activities, and a cushion; a honeymoon fund can let guests contribute.",
      },
      {
        q: "Should you go on your honeymoon right after the wedding?",
        a: "It's up to you. Many couples take a short 'minimoon' right after and save the big trip for later, which avoids planning a major vacation during an already hectic time.",
      },
    ],
    keywords: [
      "how to plan a honeymoon",
      "when to book honeymoon",
      "honeymoon budget",
      "minimoon vs honeymoon",
    ],
  },
  {
    slug: "who-pays-for-the-wedding",
    title: "Who pays for the wedding? A modern guide",
    category: "Budget",
    updated: "2026-07-22",
    readMinutes: 5,
    excerpt:
      "How wedding costs are split today, what tradition used to dictate, and how to have the money conversation without friction.",
    intro:
      "The old rules about who pays for what have largely given way to whatever works for each family. Knowing both the tradition and the modern reality helps you have a calm, clear conversation — which matters more than any etiquette chart.",
    body: [
      { h2: "The modern reality" },
      { p: "Today, most weddings are paid for by some mix of the couple and both families, in whatever proportions make sense. Plenty of couples pay for the whole thing themselves; others split costs three ways with each set of parents. There's no single 'correct' split anymore — only what's fair and affordable for the people involved." },
      { h2: "What tradition used to say" },
      { p: "Historically, etiquette assigned specific costs to each side — one family covered the ceremony and reception, the other the rehearsal dinner, and so on. It's useful as a reference point and a conversation starter, but few families follow it to the letter now, and you don't have to either." },
      { h2: "Have the conversation early" },
      { p: "The single most important step is talking about money before you start booking. Ask each contributor what they're comfortable giving — as a fixed amount, not a blank check — and whether their contribution comes with expectations (like guest-list input). Knowing the real total up front prevents overspending and awkward surprises." },
      { h2: "Contributions and expectations go together" },
      { p: "Money often comes with a say. If a parent is funding a big share, they may expect input on the guest list or the venue. Decide together how much influence a contribution carries, and set that expectation kindly and clearly at the start rather than negotiating it later." },
      { h2: "Keep one shared budget" },
      { p: "However the money is split, track it in one place — total funds in, costs out, who's covering what. A single shared budget keeps everyone aligned and stops the total from quietly creeping past what anyone agreed to." },
    ],
    faqs: [
      {
        q: "Who traditionally pays for the wedding?",
        a: "Traditional etiquette split specific costs between the two families — one covering the ceremony and reception, the other the rehearsal dinner, and so on. Today most weddings are funded by a mix of the couple and both families in whatever proportions work.",
      },
      {
        q: "How do modern couples split wedding costs?",
        a: "There's no fixed rule now. Some couples pay entirely themselves; others split three ways with each set of parents. The best approach is whatever is fair and affordable for everyone involved.",
      },
      {
        q: "How do you talk to family about paying for the wedding?",
        a: "Have the conversation before booking anything. Ask each contributor for a specific amount they're comfortable with (not a blank check), clarify any expectations that come with it, and track everything in one shared budget.",
      },
    ],
    keywords: [
      "who pays for the wedding",
      "wedding cost split",
      "who pays for what wedding",
      "wedding budget who pays",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export const GUIDE_CATEGORIES = [...new Set(GUIDES.map((g) => g.category))];
