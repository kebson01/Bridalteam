# Florida vendor prospects

A research shortlist for the founding-vendor outreach in `VENDOR-OUTREACH.md`.
931 real businesses across 34 categories and seven metros, sourced from public
web search. South Florida came first and is still much the deepest; the rest
were added on 2026-10-19 and 2026-10-20. Later passes also filled gaps in
earlier rows, so a row's data may be newer than the row.

| Metro | Published | With a phone |
|---|---|---|
| South Florida | 333 | 166 |
| Orlando | 103 | 64 |
| Tampa Bay | 103 | 61 |
| Jacksonville | 82 | 64 |
| Southwest Florida | 42 | 36 |
| Panhandle | 28 | 28 |
| Space Coast & Daytona | 19 | 11 |

The four newest are below the 100-per-metro mark Orlando and Tampa Bay hold.
Jacksonville is still producing; the Panhandle and the Space Coast are limited
by vendors who live on The Knot and Instagram rather than on their own sites,
which a search snippet cannot read a phone number out of.

**This file is a record of what is in the database, not a staging area.** That
is a reversal from how it started, and it matters: 930 of these 931 rows are
live listings created by `create_claimable_listing`, and **710 of them are
published and visible to couples on `/vendors`** right now. The one row that is
not in the database is `Marry Me Mendez`, held back because the search result
could not be told apart from `Marry Me, LLC`, which is listed.

Publishing is no longer withheld until a vendor claims their listing. A
directory entry is the business's own public facts — name, category, city,
phone, a link to the site they already run — which is what a directory has
always been, and a listing nobody can act on is a listing that fails the
couple reading it. What the paid tiers sell is their *work* and their *reach*:
gallery, Inspiration posts, an inquiry inbox, placement. See the note at the
top of `lib/tiers.ts`.

A row is held back as a draft only when it has **neither a phone nor a
website**, because then it gives a couple no way to make contact at all. 220
rows are in that state. Fill in either field and it publishes.

**The research flags on the 171 newest rows are thinner than on the rest.** The
scratch files holding them were lost when the container was recycled, and only
the flags that had been written out in the session transcript could be
restated. So an unflagged row in Jacksonville, Southwest Florida, the Panhandle
or the Space Coast has not necessarily been checked more carefully than a
flagged one -- it may just have lost its note. Treat the absence of a flag
there as no information rather than as reassurance.

## Read this before using it

Two things are missing, and the first one is why there is a file here instead of
rows in the database.

**1. Contact emails — 422 of 931.** The sessions that built this could
run web *search* but could not open the vendors' own websites; the network egress
proxy blocked every one, on both passes. So every name, URL, address and phone
below came from a search result rather than from first-party verification.

The thorough search mode quotes contact details out of the pages it reads, and
every one of the 31 addresses came in that way -- a search snippet, not a
verified fact. Several sit on consumer domains (`hotmail`, `yahoo`, `gmail`)
but with the *business* as the local part rather than a person's name, which is
a published shopfront address and not the same thing as the four below.
**Four of the 31 are flagged `personal-looking email — do not mail`**: a
solo officiant's own `gmail`/`comcast` address is not a business contact point,
and `VENDOR-OUTREACH.md` is explicit — *the business's own published contact
address, never a scraped personal one.* Those four are listed so nobody
re-researches them, not so they can be mailed.

For the remaining 509 rows the email still has to be gathered by hand, from each
business's own published contact page.

**Allowing the vendor domains would end this.** The block is the environment's
network policy, not a per-request limit — so adding the vendors' domains under
**Network access → Allowed domains** in the environment settings would let a
session read the real contact pages and fill the column properly, instead of
quoting whatever a directory happened to publish. That is the single highest-value
change available to this file.

Do not guess at `info@` or `hello@` addresses to fill the gap. This domain already
had its sending reputation put at risk once (M9 in `SECURITY-AUDIT-MAIN.md`,
28 password-reset emails to harvested addresses in a day), and the confirmation
emails real customers depend on are the first thing to land in spam when
reputation goes. `VENDOR-OUTREACH.md` says it too: *the business's own published
contact address, never a scraped personal one.*

**2. No outreach can legally go out yet.** `TERMS.md:202` is still
`[TODO: mailing address for legal notices]`. CAN-SPAM requires a physical mailing
address *inside* the message, so the first cold email is blocked on that TODO
regardless of how many prospects are listed here.

## How the columns work

- **Business / Website / City / Phone** — only what a search result actually
  stated. A blank website means the business is real and named in results but no
  first-party URL appeared; find it before contacting them. A **Phone** number
  means this row can be contacted today without an email address — see the
  section above; 430 of the 931 qualify.
- **Email** — empty on 509 of 931 rows. Fill from the vendor's own site. Where
  one is present it came from a search snippet, so confirm it before use.
- **Outcome** — also carries research flags (`verify`, `do not mail`,
  `corporate`) until there is a real outcome to record.
- **Sent / Outcome** — the tracking `VENDOR-OUTREACH.md` asks for. Record a "no"
  and a "no reply" differently: a "no" is permanent.

Verify before you contact. A search snippet is a lead, not a fact — check the
business still trades, still does weddings, and is in the metro before you spend
a claim link on it.

## Call these 430 first — the widest unblocked path

Every table below has a **Phone** column, and 430 of the 931 rows have a number
because a search result published one. Those 430 can be contacted **today**:

- **CAN-SPAM does not apply to a phone call.** The unresolved
  `[TODO: mailing address for legal notices]` in `TERMS.md` blocks commercial
  *email*. It does not block picking up the phone.
- **The phone-claim flow is live.** Search the number on `/admin/claims`, type
  the address the vendor reads out, and tell them to sign up with it — their
  listing is offered to them above the onboarding form. See
  `supabase/migrations/20261006210000_claim_listing_by_email.sql`. Matching
  ignores formatting, so type the number however it appears below.
- **The number is not a credential.** These came from the businesses' own
  public pages, so knowing one proves nothing, and caller ID is forgeable. What
  authorises a claim is possession of the confirmed email inbox. Never attach an
  address to a listing on the strength of a number alone — confirm the business
  on the call first.

This table is **generated from the category tables below** — every row here also
appears there. Do not edit it by hand; record outcomes in the category table so
there is one row per business.

| Business | Category | Phone | Flag |
|---|---|---|---|
| Deivis Archbold Photography | Photographer | 954-945-8116 |  |
| Little's Photography | Photographer | 954-563-0444 | weddings one of several services |
| Michael Murphy Photographic Imaging | Photographer | 877-564-8555 | event photographer; toll-free line |
| Joey G Photography | Photographer | 954-986-4455 |  |
| Marco Palmieri Photographer | Photographer | 954-471-5870 | **directory listing inconsistent - verify** |
| Supanik Photography | Photographer | 786-385-1100 |  |
| db Wolin Photography | Photographer | 561-762-5349 |  |
| Lukas G Photography | Photographer | 561-246-2403 |  |
| Photography South Florida | Photographer | 561-951-8800 |  |
| Clickety Chicks | Photographer | 561-662-0455 |  |
| Appeal Photography | Photographer | 561-478-7340 |  |
| Alan Luby Photography | Photographer | 561-577-9246 |  |
| Chris Joriann Photography | Photographer | 561-246-9271 | **name/number pairing inferred from page layout - verify** |
| Frank Donnino Photography | Photographer | 561-776-0099 | **name/number pairing inferred from page layout - verify** |
| Care Studios | Photographer | 305-360-2636 |  |
| Maddness Photography | Photographer | 727-418-9434 |  |
| Couture Bridal Photography | Photographer | 954-399-0741 |  |
| Vanessa + Johnny | Photographer | 954-417-2193 | **was published as 310-819-6544 (Los Angeles); a later source gave this local number** |
| TuKe Photography | Photographer | 407-900-9904 |  |
| Danseni Studios | Photographer | 407-617-2030 |  |
| Rachel V Photography | Photographer | 321-775-5787 |  |
| Magnafoto Event & Wedding Photography | Photographer | 407-733-0015 |  |
| KV Photography | Photographer | 407-923-0183 |  |
| Greg's Gallery | Photographer | 407-619-2525 |  |
| Hinson Photography | Photographer | 386-478-8099 | **386 = Daytona area code against a Lake Mary address - verify** |
| Allan Jay Images | Photographer | 407-252-8094 | collections from $950 |
| Jonathan Fanning Studio & Gallery | Photographer | 727-851-9965 |  |
| Luxus Wedding Photography | Photographer | 727-916-1500 |  |
| Megan Lee Photography | Photographer | 727-481-1188 | **directory-only source** |
| Donald Sexton Photography | Photographer | 727-619-9044 | **directory-only source** |
| Laura Allen Studios | Photographer | 727-584-5040 | **directory-only source** |
| Carrie Wildes Photography | Photographer | 813-480-0324 |  |
| Kristen Marie Photography | Photographer | 813-394-9856 | since 2010 |
| Awey Photography | Photographer | 813-770-8725 | **directory-only source, 33610** |
| Antone's Photography | Photographer | 321-438-0077 | **directory-only source** |
| Nicole Katz Photography | Photographer | 407-227-7900 | **directory-only source** |
| Warren McFerran Photography | Photographer | 407-350-0905 | 45 years; **directory-only source** |
| Park Avenue Photography Studio | Photographer | 407-942-3484 | **directory-only source** |
| Mike Briggs Photography | Photographer | 407-592-5489 | **source over a year old** |
| Amy & Caitie Photography | Photographer | 850-461-1972 | second photographer on 850-217-5500 |
| Art & Alex Photography | Photographer | 904-273-4442 |  |
| Auman Photo Studio | Photographer | 321-636-8550 | **directory-only; wedding focus unconfirmed** |
| Beachside I Dos | Photographer | 321-287-1844 |  |
| Dan Harris PhotoArt | Photographer | 904-398-7668 |  |
| David and Jess Photography | Photographer | 850-512-6275 | no travel fee to Destin / PCB |
| Elizabeth Grace & Co | Photographer | 239-220-8427 |  |
| Elle Kay Photography | Photographer | 850-497-2999 | **listing ~860 days old - verify** |
| Erica Braley Photography | Photographer | 239-357-6704 | **directory-only source** |
| Fish Studio Photography | Photographer | 321-459-9447 |  |
| Helen Werner Photography | Photographer | 239-530-8718 |  |
| Jeani Waters Photography | Photographer | 850-737-0469 | **directory-only source** |
| Kimberly Sutherland Photography | Photographer | 321-223-5065 |  |
| Micha Everett Photography | Photographer | 850-284-0008 | 300+ weddings |
| New Ground Photography | Photographer | 239-449-8897 |  |
| Pure7 Studios | Photographer | 850-654-6523 | on 30A since 2003 |
| Rob & Jill Futrell Photography | Photographer | 904-294-6604 | 600+ weddings |
| Scott Kelsey Photography | Photographer | 239-834-9744 | **directory-only source** |
| Smile Studio Photography | Photographer | 239-464-3159 | **second number 239-207-3770 published - verify** |
| Soltren Photography | Photographer | 321-209-3809 |  |
| Threaded Together Photography | Photographer | 904-383-7468 | **directory-only source** |
| Tonya Beaver Photography | Photographer | 904-382-6354 | **second number 904-253-3364 published - verify** |
| Candid Studios | Videographer | 844-522-6343 |  |
| Default Estudios | Videographer | 786-380-9305 |  |
| Straightawaymovies | Videographer | 305-793-6036 |  |
| VM Productions | Videographer | 305-239-9555 |  |
| Shutter & Sound | Videographer | 800-841-3990 | **site gives 800-841-3990; directories give 443-449-6812 - verify** |
| Global Filmz | Videographer | 888-653-2688 | drone; **page ~3yr old - verify** |
| South Florida Wedding Studio | Videographer | 954-778-2267 |  |
| A Creation Films | Videographer | 305-928-8685 |  |
| Aktion Productions | Videographer | 407-917-5720 |  |
| Elite Video of Orlando | Videographer | 407-504-1941 |  |
| Orlando Video Production Company | Videographer | 321-529-1741 |  |
| DeMarco Films | Videographer | 407-797-6695 | **directory-only source** |
| Imprint Cinema | Videographer | 407-504-1290 | **directory-only source** |
| Luxe Filmography | Videographer | 407-821-7992 | **directory-only source** |
| Any Occasion Event Services | Videographer | 239-645-3399 | **directory-only source** |
| Bari Productions | Videographer | 239-560-2728 | **directory-only source** |
| Naples Wedding Films | Videographer | 239-302-0011 |  |
| Releve Films | Videographer | 904-994-0652 |  |
| Sweet Apple Films | Videographer | 239-841-7313 |  |
| Flowers Unveiled | Florist | 954-806-8406 |  |
| Cortez Event Agency | Florist | 786-983-7092 | event agency, not florist-only |
| Beautiful Kreations | Florist | 954-933-7530 | from a Carats & Cake listing |
| Concept Flowers | Florist | 305-300-4758 | wedding focus unconfirmed |
| Jose Graterol Designs | Florist | 305-788-0562 | wedding focus unconfirmed |
| Wildflowers of Parkland | Florist | 954-752-6999 |  |
| Orange Blossoms Florals and Event Styling | Florist | 561-568-0528 |  |
| Wellington Florist | Florist | 561-333-4441 |  |
| Beldens Florist | Florist | 561-832-2871 |  |
| Twice the Style | Florist | 561-939-9589 |  |
| Xquisite Events Production | Florist | 561-988-9798 |  |
| Floral Fantasy of the Keys | Florist | 305-664-1063 |  |
| Key Largo Flowers & Gifts | Florist | 305-451-3702 |  |
| Island Blooms | Florist | 305-304-3504 | upper Keys |
| Flowers by J&J | Florist | 305-743-5459 |  |
| Kutchey's Flowers | Florist | 305-292-8181 |  |
| Milan Event Floral & Decor | Florist | 305-735-4749 |  |
| Bayfront Floral & Event Design | Florist | 954-981-1024 |  |
| In Bloom Florist Weddings & Events | Florist | 407-676-5271 |  |
| Raining Roses Productions | Florist | 407-854-3500 | floral + decor design house |
| Le Fleur Atelier | Florist | 352-217-4947 |  |
| Botanica Design Studio | Florist | 813-831-0965 | Cypress St, near Hyde Park |
| Stunning Flowers By Shelbie | Florist | 813-875-1106 | Seminole Heights |
| A Fantasy in Flowers | Florist | 904-268-7022 |  |
| Aime Peterson Flowers and Event Design | Florist | 904-413-1234 | florist + coordination |
| Anything With Plants & Flowers | Florist | 904-398-9880 | **listing ~4 years old - verify** |
| Bella Flora 30A | Florist | 850-267-1111 | **directory-only source** |
| Blooming Blossoms Design | Florist | 904-853-0455 |  |
| Destin Blooms | Florist | 850-376-1699 |  |
| Destin Floral Designs | Florist | 850-654-4646 |  |
| Feather + Bloom | Florist | 904-806-5850 | serves Jax + Amelia Island |
| Flower Girlz Inc | Florist | 850-865-1245 |  |
| Flowerama Gulf Breeze | Florist | 850-916-7673 |  |
| Fort Myers Florist | Florist | 239-931-0506 |  |
| GG Bloom | Florist | 850-460-2078 | **directory-only source** |
| Jade Violet Wedding Floral | Florist | 904-415-2480 |  |
| Jardin Floral Design | Florist | 239-451-9498 | **second number 239-404-1050 published - verify** |
| Magnolia Flowers | Florist | 850-249-6009 |  |
| Midtown Flowers | Florist | 239-261-4414 | delivery focus; confirm weddings |
| Naples Floral Design | Florist | 239-514-1414 |  |
| Naples Picasso Flowers | Florist | 239-297-0352 |  |
| Navarre Beach Flowers | Florist | 850-939-2288 |  |
| Ruby Reds Floral and Garden | Florist | 904-476-9282 |  |
| Silver Leaf Flowers | Florist | 239-777-8803 | appointment only, text to book |
| Surfside Florist | Florist | 407-970-7314 | inside Surfside Wedding Chapel; **407 number in a 321 city - verify** |
| Tula Rose Floral & Event Design | Florist | 904-599-5470 | full service from $5,000 |
| Weddings by Beasley's Floral | Florist | 321-613-0601 | **listing ~1,608 days old - verify** |
| LoveLee Bakeshop | Cake | 954-715-2050 |  |
| We Take The Cake | Cake | 954-764-2253 |  |
| Panchis Bakery | Cake | 754-600-3370 |  |
| La Cake Cafe | Cake | 754-779-2965 |  |
| Stackd Cake Studio | Cake | 941-465-8108 | no storefront; serves Sarasota + Tampa Bay |
| 4R Bakery and Specialty Cakes | Cake | 407-543-8589 |  |
| Classic Cakes | Cake | 904-246-6408 |  |
| Cupcake Connection Bakery | Cake | 904-874-5101 |  |
| D & D Cake Designs | Cake | 904-316-7013 |  |
| Ella's Cakes | Cake | 239-643-0778 |  |
| Kakes by Katie | Cake | 904-716-9915 | appointment only, consultations Sundays |
| Love + Cake Bakery Jax | Cake | 904-710-8046 |  |
| LuLu's Cupcakes and More | Cake | 386-785-7038 | **from a venue's preferred-vendor list - verify** |
| My Cupcake Insanity | Cake | 239-738-4994 | **no source stated a city; filed region-wide on the 239 area code** |
| SassyCakes | Cake | 239-687-5100 |  |
| Sweet By Holly | Cake | 904-564-2711 |  |
| Sweets By Staci | Cake | 904-254-6394 |  |
| Palm Beach Party DJ | DJ | 561-285-2640 | **1600-day-old source - verify** |
| DJ Javier Cabal & Event Services | DJ | 786-708-0848 |  |
| Zeta Event Productions | DJ | 954-732-1350 | **second number 786-452-8742 published - verify** |
| White Rose Entertainment | DJ | 407-375-4042 |  |
| 5 Star Premier | DJ | 407-910-5790 | serves Orlando + Tampa |
| Empire Entertainment | DJ | 407-440-8060 | South Asian weddings |
| Eddie B & Company | DJ | 954-721-9911 |  |
| A1A DJs | DJ | 954-531-8146 |  |
| All Events DJ Services | DJ | 954-290-6032 |  |
| Vision DJs | DJ | 954-418-2203 |  |
| Wileysounds DJ & Entertainment | DJ | 727-678-9264 |  |
| Sound Ryte Mobile DJs | DJ | 813-370-0113 | **jumbled directory listing** |
| Orlando DJ and Lighting | DJ | 321-695-4072 |  |
| A Sound Choice Entertainment | DJ | 239-352-9988 |  |
| Aardvark DJ & Bands | DJ | 850-390-0650 |  |
| Boogie Inc | DJ | 850-438-1660 |  |
| Emerald Coast Mobile DJ | DJ | 850-424-4650 | office in Fort Walton Beach |
| Frank Roberts | DJ | 386-767-0946 | **from a venue's preferred-vendor list - verify** |
| Ikeman Entertainment | DJ | 904-803-4297 | from $695 / 5 hours |
| South Coast DJ Service | DJ | 850-240-2485 |  |
| SW Florida Entertainment | DJ | 239-200-5688 |  |
| White Sands Entertainment | DJ | 850-320-7007 |  |
| Florida Music Group | Band | 772-924-9302 | **second number 772-781-7415 published - verify** |
| Paul Vesco Band | Band | 407-466-5781 |  |
| CK Entertainment | Band | 954-436-1230 |  |
| Sekond Nature | Band | 954-607-8334 |  |
| DeLeon Entertainment | Band | 813-933-3924 |  |
| Bold City Classics | Band | 904-234-6554 | trios up to a 14-piece big band |
| Mandalla Music Band | Band | 904-796-8327 | local best-band awards |
| The Band Be Easy | Band | 904-861-8128 | **directory-only source** |
| The Rivertown Band | Band | 904-614-3711 | **directory-only source** |
| Just Married by Rosy | Officiant | 305-610-0308 | **personal-looking email - do not mail** |
| Patti Roman | Officiant | 305-283-7647 | **personal-looking email - do not mail** |
| Eddie Rodriguez | Officiant | 305-596-1810 | Eventective listing |
| Marry Me Mendez | Officiant | 305-439-5553 | **may be the same business as Marry Me, LLC below - check before importing** |
| SosFloWeddings | Officiant | 305-807-3898 | Eventective listing |
| The Officiants | Officiant | 800-354-4990 | team led by Dominic Church |
| Mitchell Cohen | Officiant | 954-757-0083 | Eventective listing |
| Hey Reverend | Officiant | 604-574-7731 | **604 = British Columbia, not FL - verify** |
| Terri Golden | Officiant | 561-685-9038 | **personal-looking email - do not mail** |
| Cantor Ann Turnoff | Officiant | 561-445-8914 | stale directory - verify |
| Cantor Ellen Stettner | Officiant | 561-213-1277 | stale directory - verify |
| Ceremonies by Cindy | Officiant | 954-781-8822 | stale directory - verify |
| Florida Weddings by Cecilia | Officiant | 561-231-0043 | stale directory - verify |
| Gracefully Wed Events | Officiant | 561-532-7919 | stale directory - verify |
| Modern Love South Florida | Officiant | 561-401-3072 | stale directory - verify |
| Love Unions | Officiant | 561-504-5107 | stale directory - verify |
| Wedding Officiant Fort Lauderdale | Officiant | 954-240-6234 |  |
| Rainbow Notary & Nuptials | Officiant | 954-579-3953 |  |
| Weddings by Brandi | Officiant | 727-360-6963 |  |
| Dr. Michael Woods | Officiant | 813-895-4298 |  |
| A Florida Wedding Ceremony | Officiant | 727-422-5291 |  |
| Katherine Imundi | Officiant | 407-619-0173 | FL marriage notary |
| A Bride, A Groom, A Notary | Officiant | 407-760-7397 | bilingual |
| I DO Weddings by Sheri | Officiant | 407-375-3258 | since 2006 |
| Notary of Orlando | Officiant | 407-494-4736 |  |
| Dream Occasions Marriage Officiants | Officiant | 321-300-4354 |  |
| 2 Love 4 Ever | Officiant | 904-738-0966 | English + Spanish |
| Barefoot To Elegant Weddings of Daytona | Officiant | 386-747-0552 | Volusia + Flagler |
| Beth Briand | Officiant | 904-514-4242 |  |
| Danielle Drayson | Officiant | 904-413-8866 | **directory-only source** |
| FLWedShop | Officiant | 850-441-3788 |  |
| Glenn Guiler | Officiant | 904-707-7712 | **directory-only source** |
| Life Events Mobile Notary Services | Officiant | 904-894-2454 |  |
| Mila Notary & Wedding Solutions | Officiant | 904-207-5295 |  |
| Panama City Beach Wedding Officiant | Officiant | 850-276-0022 | **generic trading name - verify** |
| Rainbow Wedding Chapel | Officiant | 904-724-6269 | ceremonies from $100 |
| Say I Do With Deb | Officiant | 239-243-2067 |  |
| Wedding Ceremonies by Tom | Officiant | 239-541-2927 |  |
| Wondrous Look | Hair & makeup | 305-890-4778 |  |
| Michele Renee The Studio | Hair & makeup | 813-531-7770 | **second number (727) 642-8017 in page data - verify** |
| Lili's Weddings | Hair & makeup | 813-313-6747 | reaches Orlando |
| Art by Izzy | Hair & makeup | 727-966-2655 | reaches Orlando |
| Posh Bridal Team | Hair & makeup | 844-382-1346 | **name collides with Bridal Team - see note** |
| Adore Bridal | Hair & makeup | 202-996-7690 | **202 = Washington DC area code - verify** |
| Elegant Brides | Hair & makeup | 813-966-7050 | serves Tampa + Orlando |
| Destiny & Light | Hair & makeup | 813-476-8386 |  |
| Asteria Beauty Studio | Hair & makeup | 954-531-8831 |  |
| Hans on Beauty | Hair & makeup | 954-667-9940 |  |
| Courtney Christopherson Glamour Group | Hair & makeup | 561-289-2138 |  |
| The Makeup Team | Hair & makeup | 813-694-3646 | on-location Tampa/Clearwater/St Pete |
| Beautiful You Hair & Makeup | Hair & makeup | 813-503-9936 | text preferred |
| About Face Design Team | Hair & makeup | 407-647-2700 | **source 449 days old** |
| KC Makeup Artistry | Hair & makeup | 904-303-9752 |  |
| Kimtasha | Hair & makeup | 904-535-1755 | **listing ~1,224 days old - verify** |
| Maria Teresa On Location Hair and Make Up | Hair & makeup | 904-584-0697 | serves Ponte Vedra + St Augustine |
| NIC Studios | Hair & makeup | 904-252-3243 |  |
| Salon Bamboo | Hair & makeup | 239-594-7055 | salon or on-location |
| Ideal Events | Planner | 305-709-1900 |  |
| My Italian Favors | Planner | 866-236-1695 |  |
| BOLD Impact Events & Wedding Planners | Planner | 561-320-1517 |  |
| Olive & Ivory Events | Planner | 561-613-3456 |  |
| Weddings To Go Key West | Planner | 305-879-2795 |  |
| Vidal Wedding & Event Planner | Planner | 305-942-1604 | also event photography |
| Say Yes In Key West | Planner | 305-396-7602 | **second number 305-747-5700 published elsewhere - verify** |
| Little Miss Planner | Planner | 786-334-0124 |  |
| Family Affair Key West | Planner | 305-433-0700 |  |
| Ocean Breeze Weddingz | Planner | 305-902-7688 |  |
| Big Day in Key West | Planner | 305-647-9262 |  |
| Key West Casual Weddings | Planner | 305-849-1179 | no longer offers full planning |
| As You Wish Wedding Planning | Planner | 305-849-1268 |  |
| Winter Park Wedding Company | Planner | 407-539-1538 | in-house photo, video, florals, officiants |
| Blue Orchid Events & Design | Planner | 248-840-4204 |  |
| Très Chic Event Planning & Design | Planner | 954-517-1818 |  |
| A. Marie Events & Design | Planner | 321-205-8326 |  |
| Event Bliss Design | Planner | 954-463-9120 |  |
| AM Event Co. | Planner | 954-588-7869 |  |
| Fabuluxe Events | Planner | 561-254-2041 |  |
| Simple Weddings | Planner | 727-537-9331 | planning + photography |
| Wondrous Event Planners | Planner | 321-200-3746 | email info@ published on own site |
| 30A To Wed | Planner | 850-687-0076 | also trades as Destin To Wed on the same line |
| A Beautiful Florida Wedding | Planner | 239-269-8983 |  |
| Destin Wedding Company | Planner | 850-685-0190 |  |
| Fancy Events | Planner | 850-685-4472 |  |
| First Coast Weddings and Events | Planner | 904-739-8003 | since 2002 |
| Forever I Do Weddings | Planner | 850-314-9448 |  |
| Forever Together Beach Weddings | Planner | 850-533-1292 |  |
| Panama City Beach Weddings | Planner | 850-819-6333 | **three numbers published across listings - verify** |
| Pensacola Beach Weddings | Planner | 850-293-2457 |  |
| Bill Hansen Catering | Caterer | 305-858-6660 | serves Miami + Ft Lauderdale |
| Thierry Isambert Culinary & Event Design | Caterer | 305-635-6626 |  |
| Miami Wedding Caterer | Caterer | 305-669-5221 |  |
| Chef's Delights Catering | Caterer | 786-287-6283 |  |
| Catering By Lovables | Caterer | 305-640-1921 |  |
| A Paella Party | Caterer | 305-252-6669 |  |
| Sensory Delights | Caterer | 954-394-8465 | Caribbean + Haitian cuisine |
| Broward Catering | Caterer | 954-983-6937 | Jamaican + Haitian; **listing marked current only through 2024 - verify** |
| Dade County Food Group | Caterer | 305-965-7764 | Caribbean + Latin American |
| Park Ave VIP Catering | Caterer | 252-772-4972 | **252 = North Carolina area code against an Orlando address - verify** |
| Hugh's Catering | Caterer | 954-563-4844 |  |
| Eggwhites Catering | Caterer | 305-892-2066 |  |
| Culinary Artz Catering | Caterer | 954-803-8818 | **may be the same business as Florida Cater - same site, check before publishing** |
| Simply Gourmet Caterers | Caterer | 941-218-3671 | also planning + coordination |
| Premier Event & Catering Services | Caterer | 407-285-0284 |  |
| Magic Occasions Catering | Caterer | 407-927-4515 |  |
| Plus Catering Orlando | Caterer | 407-438-2900 |  |
| Orlando Food Truck Catering | Caterer | 407-900-6481 | $3,500 minimum |
| Puff 'n Stuff Catering | Caterer | 407-581-3343 | FL-based, Tampa + Orlando |
| Good Food Events + Catering | Caterer | 813-241-9500 | **listings disagree on address** |
| Catering By The Family | Caterer | 813-875-2000 | 40+ years |
| G. Elliot's Catering | Caterer | 813-748-6315 | since 1993 |
| Elite Events Catering | Caterer | 813-361-8473 | **listings disagree on address** |
| C.B.K Catering & Events | Caterer | 813-699-3060 | **directory-only source** |
| Gaston's Culinary Services | Caterer | 813-280-2257 | **directory-only source** |
| 3 C's Catering | Caterer | 813-753-9900 | **directory-only source** |
| Mi Havana Latin Catering | Caterer | 813-451-4187 | **stale listing** |
| A Chef's Touch | Caterer | 321-638-0022 |  |
| Anthony's Gourmet Catering | Caterer | 904-264-1338 | off-premise |
| Bernwood Catering Co | Caterer | 239-777-5137 |  |
| Carolina Catering Company | Caterer | 239-384-9800 | **directory-only source** |
| Chef's Dinner Table | Caterer | 904-484-6065 | **directory-only source** |
| Creative Catering Naples | Caterer | 239-351-9867 |  |
| Davoli's Catering | Caterer | 904-738-5415 |  |
| Express Catering | Caterer | 904-771-5737 | corporate focus; confirm weddings |
| G3 Catering | Caterer | 239-887-0069 | 30+ years, Lee + Collier |
| Naples Wedding Catering by Friscos | Caterer | 239-784-1705 |  |
| PJ's Catering | Caterer | 904-619-9410 |  |
| Prestige Catering | Caterer | 239-272-7180 |  |
| Savour First Choice Catering | Caterer | 239-351-5547 |  |
| Two Guys Catering | Caterer | 239-384-9072 | family-owned since 2015 |
| Well Oiled Events | Caterer | 904-515-5071 |  |
| Prestige Estate | Venue | 786-612-1542 |  |
| The Addison | Venue | 561-372-0568 | glatt kosher venue + caterer |
| The Venue Fort Lauderdale | Venue | 954-765-6968 |  |
| Deering Estate | Venue | 305-235-1668 |  |
| Villa Toscana Miami | Venue | 305-908-8586 |  |
| Curtiss Mansion | Venue | 305-869-5180 |  |
| Royal Mansion & Garden | Venue | 786-386-1116 |  |
| Villa Casa Casuarina | Venue | 786-485-2200 |  |
| Vizcaya Museum & Gardens | Venue | 305-615-8735 | **number from a caterer page, not the museum - verify** |
| SeaFair Miami | Venue | 786-353-4738 | yacht |
| Boat Miami | Venue | 305-758-2500 | yacht; **two numbers published - verify** |
| Vista Yachts | Venue | 305-407-2324 | yacht |
| Miami Yacht Connect | Venue | 305-813-0537 | yacht; **two numbers published - verify** |
| Charter One Yachts | Venue | 954-833-4731 | yacht |
| Island Queen Cruises | Venue | 305-379-5119 | yacht; **7yr old page - verify** |
| Beth David Congregation | Venue | 305-854-3911 | **two addresses and two numbers published - verify** |
| Atlantic Wedding Chapel | Venue | 954-461-5520 |  |
| The Garden Villa | Venue | 407-745-5718 |  |
| Orlando Celebration Gardens | Venue | 407-960-2853 | up to 250 |
| Villa Tuscany at WinterClub | Venue | 407-618-1123 |  |
| Harry P. Leu Gardens | Venue | 407-246-3681 | capacity 180 |
| Venetian Ballroom | Venue | 407-721-0204 | Orlando + Kissimmee locations |
| Cinderella Ballroom | Venue | 407-807-2246 | capacity 80 |
| Cypress Grove Estate House | Venue | 407-749-0792 | capacity 200 |
| Luxmore Grande Estate | Venue | 407-749-0783 | capacity 200 |
| Gaylord Palms Resort & Convention Center | Venue | 407-586-0000 | **corporate** |
| Reunion Resort | Venue | 888-799-5979 | **corporate** |
| Casa Feliz | Venue | 407-628-8200 | **second number 407-628-0230 published - verify** |
| The Barn at Crescent Lake | Venue | 813-486-2731 | 20 lakefront acres |
| Atlantic Charters | Transportation | 954-448-2032 | charter buses |
| Sal Limo Service | Transportation | 786-816-3259 |  |
| Fort Lauderdale Airport Shuttle Limo | Transportation | 954-688-7738 |  |
| Black Car Miami | Transportation | 786-685-3076 |  |
| Lauderdale Limos | Transportation | 954-951-2348 |  |
| Miami Shuttle & Limo Service | Transportation | 888-657-6842 |  |
| Majestic Limousines | Transportation | 305-774-0117 |  |
| Miami Limo Service | Transportation | 305-414-1111 |  |
| Apex International Transportation | Transportation | 305-707-5837 |  |
| Worldwide Limo | Transportation | 305-440-1111 |  |
| Ambassador Limousine and Sedan | Transportation | 727-442-9050 | **727 number, Tampa address** |
| Showtime Transportation of Tampa | Transportation | 813-749-4900 |  |
| Alora Transportation | Transportation | 813-314-0000 |  |
| Unique Corporate Limos | Transportation | 904-800-5657 | real street address, unlike the generic-domain limo sites |
| Three Sixty Photo Booths Orlando | Photo booth | 407-440-0242 | 360 booths + uplighting |
| Glowshot | Photo booth | 305-303-5740 |  |
| DEMM Photo Booths | Photo booth | 813-214-8098 | 360 video booth |
| BFF Booth | Photo booth | 904-477-9995 | also trades as Big Fun Photo Booth on the same line |
| Forever in the Moment Co | Photo booth | 239-296-9316 |  |
| Instant Photocube | Photo booth | 904-576-5855 |  |
| Jax Booth | Photo booth | 904-504-1759 |  |
| JAXonville 360 | Photo booth | 904-504-1696 |  |
| Lucky Photo Booth | Photo booth | 239-961-7150 |  |
| PhotoBooth Creations | Photo booth | 904-947-8644 |  |
| Photobooth Pixel | Photo booth | 904-419-3029 |  |
| Picture & Pose | Photo booth | 904-326-3428 |  |
| Rent For Event | Lighting | 877-409-6999 | **two conflicting numbers published - verify** |
| Miami Party DJ | Lighting | 305-609-6707 |  |
| DJ Peoples | Lighting | 305-328-9492 | **three numbers published - verify** |
| Kings Rentals | Lighting | 786-541-4892 |  |
| Miami Uplighting Rentals | Lighting | 786-755-3431 |  |
| Boca Raton Bridal | Bridal salon | 561-447-6541 | **959-day-old source - verify** |
| Amazing Brides Couture | Bridal salon | 561-372-9377 | **959-day-old source - verify** |
| Brittany Burns Bridal of Boca | Bridal salon | 561-717-8745 | **959-day-old source - verify** |
| Nuova Vita | Bridal salon | 561-558-5733 | **959-day-old source - verify** |
| Wonderland Bridal | Bridal salon | 954-973-8695 | **959-day-old source - verify** |
| Gloria Couture | Bridal salon | 305-864-1090 |  |
| The Collection Bridal | Bridal salon | 407-740-6003 | in-house alterations |
| Calvet Couture Bridal | Bridal salon | 407-951-5670 | by appointment only |
| The Bridal Finery | Bridal salon | 407-960-5225 |  |
| Angel Rivera Bridal Atelier | Bridal salon | 407-960-7544 |  |
| Magnolia Laine Bridal | Bridal salon | 656-203-8615 | 656 is a valid Tampa overlay |
| Truly Forever Bridal | Bridal salon | 813-931-8991 |  |
| Jade Bridal | Bridal salon | 813-614-1490 | appointment only |
| The Bridal Outlet of Tampa | Bridal salon | 813-289-9400 | inside Ivory & Lace |
| White Closet Bridal | Bridal salon | 813-249-4696 |  |
| Theory Bridal House | Bridal salon | 407-219-4529 | Avalon Park |
| Bridal Gown Studio Orlando | Bridal salon | 407-826-1843 | appointment only |
| Lily's Bridal | Bridal salon | 407-228-4050 |  |
| Love, a Bridal Boutique | Bridal salon | 904-242-9800 | 350+ gowns |
| Palm Bridal | Bridal salon | 239-263-8220 |  |
| The White Magnolia | Bridal salon | 904-352-3309 | San Marco, appointment only |
| Arc Divine | Rentals | 954-319-6126 | chuppah + arch rental; resolves the unattributed 954-319-6126 seen earlier |
| A Linen Valley | Rentals | 727-541-5329 | **directory did not state the service; name implies linen rental - verify** |
| FH Events | Rentals | 813-390-9371 | Tampa + Orlando; furniture + floral |
| Allure Party Rentals | Rentals | 954-598-9595 |  |
| Rent Anything Orlando | Rentals | 407-502-3741 |  |
| 904 Party | Rentals | 904-299-3535 |  |
| A2Z Events FLA | Rentals | 904-417-8585 |  |
| All About Events | Rentals | 904-379-6822 |  |
| Jax Party Company | Rentals | 904-661-9857 |  |
| Luxe Party Rentals | Rentals | 904-576-4098 |  |
| Jacksonville String Quartet | Ceremony music | 904-365-1400 |  |
| Jacksonville Strings | Ceremony music | 904-235-9154 |  |
| String Theory Music | Ceremony music | 904-994-4542 | **directory-only source** |
| Tampa Calligraphy | Stationery | 813-854-6100 | envelope addressing |
| The Write Stuff | Stationery | 813-837-0400 | **directory-only source** |
| Lili V. The Company | Stationery | 813-389-3691 | **directory-only source** |
| Glyk Gelato | Dessert cart | 561-609-4900 | **listed Boca Raton but a Parkland address - verify** |
| GelatoGo | Dessert cart | 786-450-0477 |  |
| Kirk Jewelers | Jeweler | 305-371-1321 |  |
| Jae's Jewelers | Jeweler | 305-443-7724 |  |
| Nemaro Jewelers | Jeweler | 305-358-4399 |  |
| LC Rings | Jeweler | 813-447-5577 | by appointment |
| Tampa Diamond Center | Jeweler | 813-402-2696 | cuts gems on site |
| Awesome Jewelry | Jeweler | 813-831-2419 | family-owned since 1994 |
| Thurber Armstrong Private Jewelers | Jeweler | 656-999-1997 | 656 is a valid Tampa overlay |
| Florida Diamond Center | Jeweler | 727-491-3344 | GIA gemologist on site |
| Balloon World Events | Decor | 954-702-6109 |  |
| Thread and Needle Alterations | Alterations | 407-622-4411 | also tuxedos |
| Diana's Bridal | Alterations | 813-282-7371 | alterations specialist |
| Bridal By Mina | Alterations | 813-732-1762 |  |
| Seamless Alterations Studio | Alterations | 813-389-0132 |  |
| Ella's Alterations | Alterations | 813-445-8894 |  |
| AlterationsJax | Alterations | 904-370-9178 |  |
| Eva's Alterations | Alterations | 904-724-0900 | bridal seamstress, 27 years |
| J&G Entertainment | Hora loca | 305-677-2429 | stilt walkers, Brazilian dancers, LED robots |
| Led Robot Miami | Hora loca | 954-530-6136 | **number from a Facebook listing; 954 area code vs Miami address - verify** |
| Miami Cigar Entertainment | Cigar roller | 845-549-8751 | **845 = New York Hudson Valley area code - verify** |
| Grisel Velasco | Travel agent | 305-282-0809 | destination weddings + honeymoons |
| Karrah Kazravan | Travel agent | 844-950-2143 | honeymoons |
| Mario Lopez | Travel agent | 954-330-1210 | destination weddings |
| Carolyn Drummond | Travel agent | 305-432-5108 | destination weddings |
| Fireworks Over Miami | Fireworks | 305-305-0191 | barges for waterfront venues |
| Firepower Displays | Fireworks | 305-258-8820 | handles permits |
| My 3 Sons Fireworks | Fireworks | 561-210-5176 | PGI certified |






**Flagged rows are not ready to call.** A `verify` flag means the number came
from a directory page that search dated as stale, or the area code does not
match the stated city. Check the business's own site first; a wrong number
burns the call, and a reassigned number is worse than a dead one.

**What a call is for: one email address.** Ask for the best address to send
their listing to, then attach it on `/admin/claims`. A listing claimed off the
back of a conversation is the strongest kind — they have already said yes, so it
is not cold outreach at all.


## Order of attack

`VENDOR-OUTREACH.md` ranks these, and the ranking matters more than the count:
photographers and florists first (visual portfolio, actively chase SEO, usually
one decision-maker), venues and caterers last (multiple decision-makers, existing
marketing contracts, no urgency). The categories below are in that order. The
four hotel venues are marked **corporate** — they have a marketing department and
will be the slowest yes on this entire list.

---

## 1. Photographers (114)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Deivis Archbold Photography | deivisarchbold.com | Fort Lauderdale (6555 Power Line Rd) | 954-945-8116 |  | | no published email found 2026-10-23 |
| Little's Photography | littlesphotography.com | Fort Lauderdale (2552 N Federal Hwy) | 954-563-0444 | info@littlesphotography.com | | weddings one of several services; email: own site via search |
| Michael Murphy Photographic Imaging |  | Fort Lauderdale (261 NE 32nd Ct) | 877-564-8555 | michael@michaelmurphy.com | | event photographer; toll-free line; email: own site via search; Sole photographer's address published as studio contact. Site/FB also give Oakland Park mailing address; site phone 954-564-8555 (input has 877 line). Event/corporate focus |
| Joey G Photography | joeygphoto.com | Hollywood | 954-986-4455 | joeygphoto@yahoo.com | |  |
| Marco Palmieri Photographer |  | Hollywood | 954-471-5870 |  | | **directory listing inconsistent - verify**; no published email found 2026-10-23; No published email. Gmail marcofotografiadigital@gmail.com on an X profile for @marcophotoshoot not confirmed as business contact; mfpalmieri@gmail.com belongs to an unrelated artist - do not mail. Site marcophotoshoot.com has contact form |
| Two Gems Photography |  | Delray Beach |  |  | | no published email found 2026-10-23; Sunbiz: Two Gems Photography LLC voluntarily dissolved 01/13/2025 - likely closed. No email found |
| Alizee Pechmajou Photography |  | Jupiter |  | alizeepechmajouphoto@gmail.com | | email: own site via search; LLC address Palm Beach Gardens; phone 561-379-4377 |
| Topflash Photography & Studio |  | Boynton Beach |  | booktopflashphotography@gmail.com | | email: own site via search; Yelp lists Fort Lauderdale address (5253 NW 33rd Ave), phone 754-444-2667; directories say Boynton Beach |
| What A Natural Photography |  | Delray Beach |  | whatanatural.cmdv@gmail.com | | email: own site via search; Phone 347-603-2885 (NY area code); operated by Creative Depot LLC |
| Starfish Studios Photography and Films |  | Palm Beach County |  | hello@starfishstudiosfl.com | | email: own site via search; Same email on Facebook. Office 561-376-3730. ZoomInfo Chicago data is a different/outdated record |
| Abigail Vigoa Photography |  | Doral |  |  | | no published email found 2026-10-23; No email found. Site abigailvigoa.com (not readable); The Knot lists Hialeah. Contact via The Knot |
| Victoria Machin Photography |  | Doral |  | victoria@victoriamachinphotography.com | | email: own site via search; Email domain differs from site domain victoriamachin.com. Based Miami Lakes/Hialeah, not Doral. Phone 786-615-5918 |
| Michelle VanTine Photography |  | Doral |  | contact@michellevantinephotography.com | | email: own site via search; Same on PartySlate. Site titled Miami commercial photographer; also wedding listings. Old Alexandria VA directory entries |
| Rey Zamora Photography |  | Doral |  | reyzamora0112@gmail.com | | email: own Facebook Page via search, verify; Gmail listed on business FB page. info@reyzamoraphotography.com seen in 2019 Voyage MIA interview (older). WeddingWire ZIP 33018 (Hialeah area), not Doral |
| Courtney Jones Photography |  | Doral |  |  | | no published email found 2026-10-23; No published email; courtneyjonesphoto.com uses a contact form. Other Courtney Jones emails (jones-mgmt, courtneyjonescreative, cjonesdesign) are different businesses - do not use. WeddingWire phone 305-209-0799 (filed Key Largo) |
| Celeste Wedding Photography | celesteweddingphotography.com | Miami |  |  | | no published email found 2026-10-23; site gives a Sammamish, WA address and 425 number: verify it is a real Miami business |
| Adriana Samanez Weddings |  | Doral |  |  | | no published email found 2026-10-23; Based in Orlando/Windermere FL, not Doral. No email found. info@adrianaweddings.com is a different business (destination planner) - do not use |
| Marcelin Photography |  | Hialeah |  | sandra@marcelinphotography.com | | email: own site via search, verify; Site data ~6 years old. Phone 786-350-8182; 805 E 19th St Hialeah |
| Allison Studios |  | Hialeah |  |  | | no published email found 2026-10-23; No email or FB page found. Phone 786-203-4324; 845 W 79th Pl Hialeah (Sunbiz gives 1030 W 37th St) |
| Supanik Photography | supanikphotography.com | Doral | 786-385-1100 | Bruce@supanikphotography.com | | email: own site via search; mostly quinceañeras, verify weddings |
| Lopez Falcon | lopezfalcon.com | Coral Gables |  |  | | no published email found 2026-10-23; quinceañera-focused, verify weddings |
| Robi Studio | robistudio.com | Miami |  | info@robistudio.com | | email: own site via search; quinceañera-focused, verify weddings |
| Ramoneda Photo |  | Miami |  | info@ramonedaphoto.com | | email: own site via search; Mainly quinceanera studio (misquincefoto); also photos4wed.com. Same email on FB. Contact page also mentions Tampa location |
| Alfaaz Photography | alfaazphotography.com | South Florida |  | info@alfaazphotography.com | | Indian weddings; email: own site via search; **based in Mississauga, Ontario, not Florida: verify before contacting** |
| Channa Photography |  | Fort Lauderdale |  |  | | **5+yr old listing - verify**; no published email found 2026-10-23; Different business: Channa Photography (info@channaphotography.com) is Toronto/Brooklyn based. Fort Lauderdale listing may be 'Narvinder Channa Photography' on Sulekha - no email. Do not use |
| Infinite Loop Photography |  | Fort Lauderdale |  | info@infiniteloopphoto.com | | **5+yr old listing - verify**; email: own site via search; Based West Palm Beach/Miami, serves Ft Lauderdale. Phones 561-692-3212, 305-814-8640 |
| Maloman Boutique Photography |  | Fort Lauderdale |  | info@malomanstudios.com | | **5+yr old listing - verify**; email: own site via search; Business now named Maloman Studios. Same email on FB. WeddingWire says they prefer site contact form. Phone 954-353-7887 |
| Haring Photography |  | South Florida |  | info@haringphotography.com | | **5+yr old listing - verify**; email: own site via search; Miami-based (Haring Photography + Films). Phone 786-444-9743 |
| db Wolin Photography |  | West Palm Beach | 561-762-5349 |  | | no published email found 2026-10-23; No published email; site yourweddingstories.com uses contact form. wolbd@aol.com seen only on ContactOut - rejected, personal-looking email: do not mail |
| Lukas G Photography |  | West Palm Beach | 561-246-2403 | photography@lukasg.com | | email: own site via search; Based in Miami Beach (7315 Carlyle Ave), not West Palm Beach. Same on FB |
| Photography South Florida |  | Palm Beach | 561-951-8800 | info@photographysouthflorida.com | | email: own site via search, verify; Site footer copyright 2007-2008 (stale). Site phone 561-662-0455 = input phone for Clickety Chicks (line 629); input phone 561-951-8800 not found. Possibly same operator as Clickety Chicks |
| Clickety Chicks |  | West Palm Beach | 561-662-0455 | kim@kimfontaine.com | | email: own site via search, verify; A Facebook page for Clickety Chicks Photography Inc. says permanently closed. Owner Kim Fontaine now runs Kim Fontaine Photography (same domain). Site phone 561-478-7340 = input phone for Appeal Photography (line 630) |
| Appeal Photography |  | West Palm Beach | 561-478-7340 |  | | no published email found 2026-10-23; No West Palm Beach business found. Appeal Photography with info@appealphotography.com is a DC boudoir studio - different business. Input phone 561-478-7340 matches Clickety Chicks' site number - listing likely mismatched |
| Alan Luby Photography |  | West Palm Beach | 561-577-9246 | aluby1441@aol.com | | email: own listing via search, verify; Address is Riviera Beach (1441 W 33rd St). Email from WeDJ listing; personal-provider aol. Phones seen 561-340-9310 and (561) 845-3865, not input 561-577-9246 |
| Chris Joriann Photography |  | Palm Beach Gardens | 561-246-9271 | info@chrisjoriann.com | | **name/number pairing inferred from page layout - verify**; email: own site via search; Phone on own site is 561-776-0099 (input lists that number under Frank Donnino); input 561-246-9271 likely mispaired |
| Frank Donnino Photography |  | Palm Beach Gardens | 561-776-0099 |  | | **name/number pairing inferred from page layout - verify**; no published email found 2026-10-23; Listed CLOSED (Yelp/MapQuest); based Boynton Beach not PB Gardens; phone (561) 732-1414; input phone 561-776-0099 belongs to Chris Joriann. Only email seen was obfuscated |
| Care Studios | careweddings.com | Key Largo | 305-360-2636 | info@careweddings.com | | email: own site via search |
| Jannette De Llanos Photography | jannettedellanosphotography.com | Key Largo |  | Jannettedellanosweddings@yahoo.com | | email: own site via search, verify; Based Islamorada. Site structured data also lists Jannettedellanos@rocketmail.com (conflict). Pages ~3 yrs old |
| Barbara Knowles Wedding Photography |  | Islamorada |  | iweddu@bellsouth.net | | also planning; email: own site via search, verify; Old bellsouth address. Own site also lists Richard Knowles flkeys@bellsouth.net. Based Key Largo/Islamorada; phone 305-772-0503 |
| Maddness Photography | maddnessphotography.com | Tampa | 727-418-9434 |  | |  |
|---|---|---|---|---|---|---|
| Lenisse Komatsu Photography | lenisse.com | Fort Lauderdale | | hello@lenisse.com | | email: own site and Instagram via search |
| Couture Bridal Photography | couturebridalphotography.com | Boca Raton (137 E Palmetto Park Rd) | 954-399-0741 | mail@couturebridalphotography.com | | |
| Wanderlust Studios | wanderluststudiosfl.com | Fort Lauderdale | | wanderluststudiosfl@gmail.com | | email: own Facebook Page via search; site says texting is preferred |
| Melanie Anne Photography | melanieannephotography.com | Fort Lauderdale | | hello@melanieannephotography.com | | email: own Facebook Page via search |
| La Vie Studios | laviestudios.com | Miami | | smile@laviestudios.com | | email: own site via search |
| Michelle Elyse Photography | michelleelysephotography.com | Miami | | info@michelleelysephotography.com | | email: own site via search; **appears to be based in Raleigh, NC: verify Miami presence** |
| EP Photos | epphotos.studio | Miami | | erica@epphotos.studio | | email: own site via search |
| Kolour Haus | kolourhaus.com | Miami | | info@kolourhaus.com | | email: own contact page via search |
| Jessica Vilchez Photo | jessicavilchez.com | Miami / Palm Beach | | hello@jessicavilchez.com | | email: own site via search |
| LeFever Photo | lefeverphoto.net | Palm Beach | | info@lefeverphoto.net | | email: own site via search; Facebook shows kellie_lefever@hotmail.com (personal-looking email: do not mail) |
| Poirier Wedding Photography | poirierweddingphotography.com | Palm Beach / Jupiter | | poirierphotography@yahoo.com | | email: own site via search, verify; Own homepage instead lists stacey@poirierweddingphotography.com; contact page, Knot and Facebook use the yahoo address. Phone (561) 801-3201 |
| Boogietek Photo+Cinema | boogietek.com | Pembroke Pines | | info@boogietek.com | | email: own site via search |
| Mark Salner Photography | marksalnerphotography.com | West Palm Beach | | mark@marksalnerphotography.com | | email: own site via search; Yelp lists Port St Lucie address; BBB lists West Palm Beach |
| Vanessa + Johnny | vanessaandjohnny.com | South Florida | 954-417-2193 | hello@vanessaandjohnny.com | | **was published as 310-819-6544 (Los Angeles); a later source gave this local number** |
| Bruna Bastos Photography | | Boca Raton (3601 N Dixie Hwy) | | | | no published email found 2026-10-23; No email found; phones (561) 860-1218 (YP) / 561-305-7440 (Groupon) |
| Kenneth Appelbaum Photography | | Boca Raton (121 NW 43rd St) | | kaaphoto@icloud.com | | email: own site via search; Also on Facebook. Mostly commercial/product photography; wedding focus unconfirmed |
| Beautiful Memories Studio | | Fort Lauderdale | | | | no published email found 2026-10-23; No email found; site beautifulmemoriesstudio.photo; WeddingWire phones 1-800-869-4378 / 201-338-0158 (NJ area code) |
| Andrea Harborne Photography | | Fort Lauderdale | | andreaharbornephotography@gmail.com | | email: own listing via search, verify; Only from ~9-yr-old Voyage MIA interview (not own site; own contact page uses a form). Site mentions Marietta (GA) too |
| TuKe Photography |  | Winter Park | 407-900-9904 |  | |  |
| Danseni Studios |  | Winter Park | 407-617-2030 |  | |  |
| Rachel V Photography |  | Winter Park | 321-775-5787 |  | |  |
| Magnafoto Event & Wedding Photography |  | Winter Park | 407-733-0015 |  | |  |
| KV Photography | kvphotographyonline.com | Winter Park | 407-923-0183 |  | |  |
| Greg's Gallery | gregsgallery.net | Lake Mary | 407-619-2525 |  | |  |
| Hinson Photography |  | Lake Mary | 386-478-8099 |  | | **386 = Daytona area code against a Lake Mary address - verify** |
| Allan Jay Images |  | Orlando | 407-252-8094 |  | | collections from $950 |
| Live Happy Studio | livehappystudio.com | Orlando |  |  | |  |
| Marcher Photography | marcherphotography.com | Orlando |  |  | |  |
| Jonathan Fanning Studio & Gallery | jfanphoto.com | Clearwater | 727-851-9965 |  | |  |
| Luxus Wedding Photography |  | Clearwater | 727-916-1500 |  | |  |
| Megan Lee Photography |  | Clearwater | 727-481-1188 |  | | **directory-only source** |
| Donald Sexton Photography |  | Clearwater | 727-619-9044 |  | | **directory-only source** |
| Laura Allen Studios |  | Clearwater | 727-584-5040 |  | | **directory-only source** |
| Carrie Wildes Photography | carriewildes.com | Tampa | 813-480-0324 |  | |  |
| Kristen Marie Photography | kristenmariephotog.com | Tampa | 813-394-9856 |  | | since 2010 |
| Awey Photography |  | Tampa | 813-770-8725 |  | | **directory-only source, 33610** |
| SM Autumn Photo | smautumnphoto.com | Tampa |  |  | | photo + video |
| Antone's Photography |  | Lake Mary | 321-438-0077 |  | | **directory-only source** |
| Nicole Katz Photography |  | Sanford | 407-227-7900 |  | | **directory-only source** |
| Warren McFerran Photography |  | Sanford | 407-350-0905 |  | | 45 years; **directory-only source** |
| Park Avenue Photography Studio |  | Sanford | 407-942-3484 |  | | **directory-only source** |
| Mike Briggs Photography | mikebriggsphoto.com | Orlando | 407-592-5489 |  | | **source over a year old** |
| Amy & Caitie Photography | amyandcaitie.com | Santa Rosa Beach | 850-461-1972 |  | | second photographer on 850-217-5500 |
| Art & Alex Photography |  | Ponte Vedra Beach | 904-273-4442 | artandalex@hotmail.com | |  |
| Auman Photo Studio |  | Cocoa | 321-636-8550 |  | | **directory-only; wedding focus unconfirmed** |
| Beachside I Dos |  | Cocoa Beach | 321-287-1844 |  | |  |
| Dan Harris PhotoArt | danharrisphotoart.com | Jacksonville | 904-398-7668 |  | |  |
| David and Jess Photography |  | Pensacola | 850-512-6275 |  | | no travel fee to Destin / PCB |
| Elizabeth Grace & Co |  | Fort Myers | 239-220-8427 |  | |  |
| Elle Kay Photography |  | Pensacola | 850-497-2999 |  | | **listing ~860 days old - verify** |
| Erica Braley Photography |  | Fort Myers | 239-357-6704 |  | | **directory-only source** |
| Fish Studio Photography |  | Merritt Island | 321-459-9447 |  | |  |
| Helen Werner Photography |  | Naples | 239-530-8718 |  | |  |
| Jeani Waters Photography |  | Santa Rosa Beach | 850-737-0469 |  | | **directory-only source** |
| Kimberly Sutherland Photography |  | Cocoa Beach | 321-223-5065 |  | |  |
| Lauren Linahon Photography | laurenlinahonphotography.com | Melbourne |  |  | |  |
| Let Me Be Candid Photography | letmebecandid.com | Naples |  |  | | **401 area code vs Naples, phone withheld** |
| Lisa Silva Photography | lisasilvaphoto.com | Ponte Vedra Beach |  |  | | **850 area code vs Ponte Vedra, phone withheld** |
| Micha Everett Photography | michaeverettphotography.com | Destin | 850-284-0008 |  | | 300+ weddings |
| Mollie Jane Photography | molliejanephotography.com | St Augustine |  |  | |  |
| Monarch Studio | themonarchwedding.com | St Augustine |  |  | |  |
| New Ground Photography | newgroundphotography.com | Naples | 239-449-8897 |  | |  |
| Phavy Photography | phavyphotos.com | St Augustine |  |  | |  |
| Photographer Ponte Vedra | photographerpontevedra.com | Ponte Vedra Beach |  |  | |  |
| Pixel Groves | pixelgroves.com | Titusville |  |  | |  |
| Pure7 Studios | pure7studios.com | Santa Rosa Beach | 850-654-6523 |  | | on 30A since 2003 |
| Rob & Jill Futrell Photography | robfutrell.com | St Augustine | 904-294-6604 |  | | 600+ weddings |
| Sandy Roots Photography | sandyrootsphotography.com | Cocoa Beach |  |  | |  |
| Scott Kelsey Photography |  | Fort Myers | 239-834-9744 |  | | **directory-only source** |
| Smile Studio Photography | smilestudiophotography.com | Naples | 239-464-3159 |  | | **second number 239-207-3770 published - verify** |
| Soltren Photography |  | Titusville | 321-209-3809 |  | |  |
| Threaded Together Photography |  | Jacksonville | 904-383-7468 |  | | **directory-only source** |
| Tonya Beaver Photography | tonyabeaverphotography.com | Jacksonville Beach | 904-382-6354 |  | | **second number 904-253-3364 published - verify** |
| Tracy Townsend Photography | tracytownsendphotography.com | Cocoa Beach |  |  | |  |

## 2. Videographers (33)

Vanessa + Johnny and Boogietek above shoot both — approach once, not twice.

| Business | Website | City | Phone | Email | Sent | Outcome |
| Marksman Visuals |  | Coconut Creek |  |  | | no published email found 2026-10-23; No email; WeddingWire phone +1 954-654-0115 |
| PRIMEUS Photography & Video |  | Miami |  | primeus.contact@gmail.com | | email: own site via search; Also on Facebook. Phone +1 754 245 2916; also operates in NJ |
| Videography by Cristina |  | Sunrise |  | Cristina_Godshall@hotmail.com | | email: own site via search; Owner's hotmail but published as the business contact on own site and Facebook |
| Bells & Whistles Photography + Videography |  | Miami |  | info@bellswhistlesphoto.com | | email: own site via search; Facebook lists sarah@bellswhistlesphoto.com. Not the Texas Bells & Whistles Productions |
| Candid Studios | candidstudios.net | Miami | 844-522-6343 | support@candidstudios.net | | email: own site via search; National multi-market company (WeddingWire lists Fort Collins, CO); not a local Florida studio |
| Default Estudios |  | Coral Gables | 786-380-9305 |  | | no published email found 2026-10-23; Search found no trace of the business; phone 786-380-9305 unconfirmed |
| Straightawaymovies |  | Coral Gables | 305-793-6036 |  | | no published email found 2026-10-23; Only a WeDJ listing (Miami, phone (305) 793-6036), no email; 2 searches |
| VM Productions |  | Miami | 305-239-9555 | vmpfilm@aol.com | | email: own Facebook Page via search, verify; Conflict: input phone 305-239-9555 belongs to VM Studios (miamivideoproductionhq.com, email masked), a different-named company. VM Productions Inc (9066 SW 73 Ct) uses 305-338-xxxx and vmpfilm@aol.com. Confirm which business is intended |
| Shutter & Sound | shutterandsound.com | Miami Beach | 800-841-3990 | hello@shutterandsound.com | | **site gives 800-841-3990; directories give 443-449-6812 - verify**; email: own site via search; National multi-city company, not Florida-based (ZoomInfo puts it in Baltimore; 443 number is aggregator). Ignore shutterandsound.net addresses |
| Skyview Motions | skyviewmotions.com | Fort Lauderdale |  | fly@skyviewmotions.com | | drone; email: own site via search; Office is Coral Springs (7301 Wiles Rd); phone (954) 369-1464. Drone service |
| Florida Drone Operators | floridadroneoperators.com | Fort Lauderdale |  |  | | drone; also serves the Keys; no published email found 2026-10-23; No published email found (only masked ZoomInfo). ZoomInfo puts HQ in Pensacola; 2 searches |
| Global Filmz | globalfilmz.com | Miami | 888-653-2688 | Info@GlobalFilmz.com | | drone; **page ~3yr old - verify**; email: own site via search, verify; Own sites also list Thinkglobal@usa.com (Miami office, globalfilmzstudios.com/contact) and info@globalfilmzstudios.com. Main contact page gives Fort Lauderdale address. Mostly commercial video production |
| Steven Jim Films |  | Tampa |  |  | |  |
| 360 Photo Entertainment |  | Tampa |  |  | | also 360 booth + photography |
|---|---|---|---|---|---|---|
| Andreo Studio | andreostudio.com | Miami / West Palm Beach | | info@andreostudio.com | | email: own site via search; WeddingWire and site structured data show INFO@CHADANDREO.COM (alternate) |
| Megaset Weddings | megasetphotography.com | South Florida | | megasetphotography@gmail.com | | email: own site via search; Phone 561-302-1676 |
| Quality Media FL | qualitymediafl.com | Boca Raton | | qualitymediafl@gmail.com | | email: own site via search; Phone (734) 604-2846 (Michigan area code) |
| South Florida Wedding Studio | southfloridaweddingstudio.com | South Florida | 954-778-2267 | Daniel@MiamiWeddingStudio.com | | email: own Instagram via search, verify; Instagram @miamiweddingstudio uses name South Florida Wedding Studio but domain miamiweddingstudio.com, not southfloridaweddingstudio.com; link not confirmed. Named-person address |
| A Creation Films | acreationfilms.com | Miami | 305-928-8685 | hello@acreationfilms.com | | |
| Until Forever Photography | untilforeverphotography.com | Fort Lauderdale | | untilforeverfilms@gmail.com | | email: own site via search; Sunbiz principal address is Miami (17160 NW 2nd Ct) |
| Rimas Films | rimasfilms.com | Miami | | rimasfilms@gmail.com | | email: own site via search; Phone 954-600-2055; Miami Beach / Hallandale |
| Aktion Productions | aktionproductions.com | Orlando | 407-917-5720 |  | |  |
| Elite Video of Orlando |  | Orlando | 407-504-1941 |  | |  |
| Orlando Video Production Company | orlandovideoproductioncompany.com | Orlando | 321-529-1741 |  | |  |
| Far Reach Studios | farreachstudios.com | Orlando |  |  | | **786 area code vs Orlando, phone withheld** |
| DeMarco Films |  | Orlando | 407-797-6695 |  | | **directory-only source** |
| Imprint Cinema |  | Orlando | 407-504-1290 |  | | **directory-only source** |
| Luxe Filmography |  | Lake Mary | 407-821-7992 |  | | **directory-only source** |
| Any Occasion Event Services |  | Fort Myers Beach | 239-645-3399 |  | | **directory-only source** |
| Bari Productions |  | Fort Myers | 239-560-2728 |  | | **directory-only source** |
| Naples Wedding Films |  | Naples | 239-302-0011 |  | |  |
| Releve Films | relevefilms.com | Jacksonville | 904-994-0652 |  | |  |
| Sweet Apple Films | sweetapplefilms.com | Fort Myers | 239-841-7313 |  | |  |

## 3. Florists (89)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Flowers Unveiled | flowersunveiled.com | Fort Lauderdale (14310 SW 17th St) | 954-806-8406 | hello@flowersunveiled.com | |  |
| Cortez Event Agency | cortezeventagency.net | Doral (10817 NW 29th St) | 786-983-7092 | cortezeventagency@gmail.com | | event agency, not florist-only |
| Beautiful Kreations |  | Fort Lauderdale | 954-933-7530 | marcia@beautifulkreations.com | | from a Carats & Cake listing; email: own site via search, verify; On beautifulkreations.net contact page; listings point to beautifulkreations.com. Owner Marcia Villiers. Located Sunrise (10140 NW 53rd St) |
| Concept Flowers |  | Miami | 305-300-4758 | info@conceptflowers.com | | wedding focus unconfirmed; email: own site via search; Same address on WeddingWire and FB 'Concept Flowers & Events'. Addresses vary (Miami Lakes vs downtown); offers event design, wedding focus plausible |
| Jose Graterol Designs |  | Miami | 305-788-0562 | josegrateroldesigns@gmail.com | | wedding focus unconfirmed; email: own site via search; Same gmail on own Facebook; addresses conflict (Miramar/Miami/Medley); input notes wedding focus unconfirmed |
| Mint Floral Studio |  | North Miami Beach |  | mintfloralstudio@gmail.com | | email: own site via search, verify; Location unclear: site phone 561, The Knot lists Clearwater; multi-area service; lookalike domain mintfloralstudio.space seems unrelated |
| Petal Productions |  | Miami |  | info@petalproductions.com | | email: own site via search; Also on own Facebook; LinkedIn lists events@petalproductions.com; personal hotmail seen on a directory: do not mail |
| La Feterie by Juliana Schiffer |  | Miami |  | juliana@lafeterie.com | | email: own site via search; Studio is in Hollywood FL (by appointment) |
| Maison la Fleur |  | Aventura / Boca Raton |  | info@maisonlafleur.com | | email: own site via search; Mostly luxury flower-delivery retail; ignore maisonlafleur2@gmail.com from a directory |
| Lush Celebrations |  | Fort Lauderdale |  |  | | no published email found 2026-10-23; Wedding division of Field of Flowers, Davie; only email seen (donnff@fieldofflowers.com) is on localflower.org, not an own source |
| J & J Flowers and Gift Shop |  | Hollywood |  | jjflowers016@gmail.com | | email: own site via search, verify; Own Facebook shows jjflowers015@gmail.com (conflict); shop is in Pembroke Pines (8366 Pines Blvd) |
| Petals & Stems |  | Hollywood |  |  | | no published email found 2026-10-23; No Hollywood FL shop found; only a Davie listing (954-533-6611) with no email; other same-name shops are out of state |
| Kish Events & Decor |  | Boynton Beach |  | info@kishevent.com | | email: own site via search; Also on own Instagram; two domains (kishevent.com / kishevents.com) and conflicting phones/addresses (Boynton vs Wellington) |
| Two Gardenias by Mary |  | Boynton Beach |  | info@twogardeniasbymary.com | | email: own site via search |
| Creative Florals |  | Jupiter |  | creativefloralsfl@aol.com | | email: own site via search; Shop is in Tequesta (271 S US Hwy 1) |
| Heirloom Rosie |  | Jupiter |  | hello@heirloomrosie.com | | email: own site via search; Not Heirloom Roses (Oregon) |
| Wildflowers of Parkland | wildflowersofparkland.com | Coral Springs | 954-752-6999 | info@wildflowersofparkland.com | | email: own site via search |
| The Indian Wedding Decor Company | indianweddingdecorator.com | Miami |  |  | | mandap + decor; no published email found 2026-10-23; indianweddingdecorator.com serves NJ/NY/CT/OH etc.; no Florida base or email found |
| Orange Blossoms Florals and Event Styling | orangeblossomsflorals.com | West Palm Beach | 561-568-0528 | events@orangeblossomsflorals.com | | email: own site via search; Also on own Instagram |
| Wellington Florist | wellingtonflorist.com | Wellington | 561-333-4441 | service@wellingtonflorist.com | | email: own site via search; barb_vinson@yahoo.com on a directory: personal-looking email, do not mail |
| Beldens Florist | beldensflorist.com | West Palm Beach | 561-832-2871 | beldensflorist01@bellsouth.net | | email: own site via search |
| Twice the Style | twicethestyle.net | West Palm Beach | 561-939-9589 | twicethestyle@yahoo.com | | email: own site via search, verify; Interior & landscape design firm in Boca Raton, not a florist; email obscured on page, read from embedded data; phone differs from input |
| Xquisite Events Production | xefla.com | West Palm Beach | 561-988-9798 | designassistant@xefla.com | | email: own site via search, verify; Own Facebook lists info@xefla.com (conflict); based in Boynton Beach |
| Floral Fantasy of the Keys | floralfantasyweddings.com | Islamorada | 305-664-1063 |  | | no published email found 2026-10-23; Only phone/address found; Visit Florida Keys directory has email button with hidden address |
| Key Largo Flowers & Gifts | keylargoflorist.com | Key Largo | 305-451-3702 | keylargoflowersandgifts@gmail.com | | email: own Facebook Page via search, verify; Second own Facebook page lists Keylargoflowers@gmail.com (conflict); none on website |
| Island Blooms | islandblooms.com | Key Largo | 305-304-3504 | lori@islandblooms.com | | upper Keys; email: own site via search; Based in Tavernier, upper Keys |
| Flowers by J&J |  | Marathon | 305-743-5459 | danielle@keysflowers.com | | email: own site via search |
| Kutchey's Flowers |  | Key West | 305-292-8181 | kutcheysflowersinkw@gmail.com | | email: own site via search |
| Milan Event Floral & Decor |  | Key West | 305-735-4749 | milanevent@gmail.com | | email: own site via search, verify; Contact page ~7 years old; own Facebook lists info@milanevent.com |
| Fairbanks Florist |  | Winter Park |  |  | |  |
| Ian Tafoya Designs |  | Winter Park |  |  | |  |
| Atmospheres of Winter Park |  | Winter Park |  |  | |  |
| Apple Blossom Florist & Gifts |  | Winter Park |  |  | |  |
|---|---|---|---|---|---|---|
| Bayfront Floral & Event Design | bayfrontfloral.com | Fort Lauderdale (3414 Griffin Rd) | 954-981-1024 | info@bayfrontfloral.com | | email: own listing via search, verify; Seen on own Pinterest profile plus BizBash and a local directory; own contact page email not visible in results |
| Saucha Floral Design | sauchafloraldesign.com | Fort Lauderdale (2209 NE 54th St) | | info@sauchafloraldesign.com | | email: own site via search; Privacy page lists flowers@sauchafloraldesigns.com (different domain) |
| Coco and Jojo Florals | cocoandjojoflorals.com | Fort Lauderdale | | hello@cocoandjojoflorals.com | | email: own site via search; Also on FB; trades as Coco & Jojo Luxury Florals |
| Victoria Park Flower Studio | victoriaparkflowers.com | Fort Lauderdale (1948 E Sunrise Blvd) | | victoriaparkflowerstudio@gmail.com | | email: own site via search; Nextdoor shows flowers@theflowerstudiobyshilo.com (unverified, not used); About page lists Oakland Park address |
| La Fleur Florals & Events | lafleurfloralsandevents.com | Fort Lauderdale | | lafleurflorals@gmail.com | | email: own site via search; Two addresses seen (N Andrews Ave vs NW 62nd St) |
| A Marc In Design | amarcindesign.com | Fort Lauderdale | | amarcindesign2022@gmail.com | | email: own Facebook Page via search, verify; Own contact page shows no email; older marc@amarcindesign.com in ~9-yr-old VoyageMIA interview |
| Bashful Daisy Florist | bashfuldaisyflorist.com | Fort Lauderdale | | | | no published email found 2026-10-23; bashfuldaisyflorist@comcast.net seen only via intengine directory; own site hides email behind form link - not confirmed |
| La Fleur Bijou | lafleurbijou.com | Fort Lauderdale | | | | no published email found 2026-10-23; Only phone 954-612-7736 found; own contact page shows no email |
| Art of Petals | artofpetals.com | Fort Lauderdale | | artofpetals954@gmail.com | | email: own site via search; Also on FB; usdirectory shows artofpetals@yahoo.com (older/unverified) |
| Fort Lauderdale Florist | fortlauderdaleflorist.com | Fort Lauderdale | | wecare@dgmflowers.com | | email: own site via search, verify; Site operated by DGM Flowers Co.; newer blog post lists hello@dgmflowers.com - two inboxes |
| Aura Design Flowers | auradesignflowers.com | Miami | | info@auradesignflowers.com | | email: own site via search; Studio is in Davie (Broward), serves Miami-Dade; unrelated Montreal 'Aura Design Shop' exists - don't mix up |
| Taylor Event Design | tayloreventdesigns.com | Miami | | | | no published email found 2026-10-23; Own contact page has email section but no address in results; site footer/HQ is Eatonton, GA - Miami presence may be old/secondary. Phone (305) 492-5247 |
| Luxury Flowers Miami | luxuryflowersmiami.com | Miami | | luxuryflorist@icloud.com | | email: own site via search, verify; Miami Beach (907 Alton Rd); consumer icloud domain; similarly named Luxury Diamond Flowers / Luxury Florist Miami are different businesses |
| Neroli Blume | neroliblume.com | Miami | | info@neroliblume.com | | email: own site via search; Wynwood, 132 NW 27th St |
| Nerys Flowers | nerysflowers.com | Miami | | info@nerysflowers.com | | email: own listing via search, verify; Spelled Nery's Flowers; email from VoyageMIA interview and localflower directory, own contact page uses form only; phones/addresses conflict |
| Fleur de Marsca | fleurdemarsca.com | South Florida | | info@fleurdemarsca.com | | email: own Facebook Page via search, verify; Only on FB; own site/Instagram push inquiry form |
| In Bloom Florist Weddings & Events | eventsbyinbloom.com | Orlando | 407-676-5271 | events@inbloomflorist.com | |  |
| Raining Roses Productions | rainingroses.biz | Orlando | 407-854-3500 |  | | floral + decor design house |
| Le Fleur Atelier | lefleuratelier.com | Clermont | 352-217-4947 | hello@lefleuratelier.com | |  |
| Wayward Blooms | waywardblooms.com | Orlando |  |  | |  |
| Dream Designs Florist | dreamdesignsflorist.com | Orlando |  |  | |  |
| Jill Heaton Floral Design |  | Winter Haven |  |  | | serves Kissimmee + Disney area |
| Posey Blooms |  | Orlando |  |  | |  |
| Juluxe Events |  | Orlando |  |  | |  |
| Leaf & Blossom Co |  | Orlando |  |  | |  |
| Botanica Design Studio |  | Tampa | 813-831-0965 |  | | Cypress St, near Hyde Park |
| Stunning Flowers By Shelbie | stunningflowersbyshelbie.com | Tampa | 813-875-1106 |  | | Seminole Heights |
| Eufloria Flowers Tampa | eufloriaflowerstampa.com | Tampa |  |  | |  |
| Albelo's Flowers | albelosflowers.com | Tampa |  |  | |  |
| Milly's Flowers | millysflowers.com | Tampa |  |  | |  |
| A Fantasy in Flowers | afantasyinflowers.com | Jacksonville | 904-268-7022 |  | |  |
| Aime Peterson Flowers and Event Design |  | Orange Park | 904-413-1234 |  | | florist + coordination |
| Anything With Plants & Flowers |  | Jacksonville | 904-398-9880 |  | | **listing ~4 years old - verify** |
| Bella Flora 30A |  | Santa Rosa Beach | 850-267-1111 |  | | **directory-only source** |
| Blooming Blossoms Design |  | Jacksonville | 904-853-0455 |  | |  |
| Destin Blooms | destinblooms.com | Destin | 850-376-1699 |  | |  |
| Destin Floral Designs |  | Destin | 850-654-4646 |  | |  |
| Donya's Florals | donyasflorals.com | St Augustine |  |  | |  |
| Feather + Bloom | featherandbloomflorals.com | St Augustine | 904-806-5850 |  | | serves Jax + Amelia Island |
| Flower Girlz Inc |  | Destin | 850-865-1245 |  | |  |
| Flowerama Gulf Breeze |  | Gulf Breeze | 850-916-7673 |  | |  |
| Fort Myers Florist | fmflorist.com | Fort Myers | 239-931-0506 |  | |  |
| GG Bloom |  | Santa Rosa Beach | 850-460-2078 |  | | **directory-only source** |
| Jade Violet Wedding Floral | jadevioletweddingfloral.com | St Augustine | 904-415-2480 |  | |  |
| Jardin Floral Design | jardinfdflowers.com | Fort Myers | 239-451-9498 |  | | **second number 239-404-1050 published - verify** |
| Magnolia Flowers |  | Panama City Beach | 850-249-6009 |  | |  |
| Midtown Flowers |  | Naples | 239-261-4414 |  | | delivery focus; confirm weddings |
| Naples Floral Design | naplesfloral.com | Naples | 239-514-1414 |  | |  |
| Naples Picasso Flowers | naplespicassoflowers.com | Naples | 239-297-0352 | naplespicassoflowers@gmail.com | |  |
| Navarre Beach Flowers |  | Navarre | 850-939-2288 |  | |  |
| Once And Florall Designs | onceandfloralldesigns.com | St Johns |  |  | |  |
| Ruby Reds Floral and Garden | rubyredsfloral.com | Jacksonville | 904-476-9282 | rubyredsfloral@yahoo.com | |  |
| Silver Leaf Flowers | naplessilverleaf.com | Naples | 239-777-8803 |  | | appointment only, text to book |
| Surfside Florist |  | Cocoa Beach | 407-970-7314 |  | | inside Surfside Wedding Chapel; **407 number in a 321 city - verify** |
| Tula Rose Floral & Event Design |  | St Augustine | 904-599-5470 |  | | full service from $5,000 |
| Weddings by Beasley's Floral | cocoabeachweddings.net | Cocoa Beach | 321-613-0601 |  | | **listing ~1,608 days old - verify** |

## 4. Cake & dessert (44)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Edda's Cake Designs |  | Miami |  |  | | trading since 1978; no published email found 2026-10-23; Own Locations page shows doral@eddascakes... and sm@eddascakes... but domain truncated in results - not constructed; check eddascakedesigns.com/pages/locationsllbjt |
| Lamod Bakery |  | Miami |  |  | | no published email found 2026-10-23; No email found; Instagram @lamodbakery says no phone calls, orders via Bakesy (bakesy.shop/b/lamod-bakery). Home bakery, Doral/Medley per Sunbiz |
| Chef Marian |  | Miami |  | info@chefmariandesserts.com | | email: own listing via search, verify; Seen on WeddingRule directory (~3.5 yrs old), domain matches own site chefmariandesserts.com. Related brand Cakes and The City uses orders@cakesandthecity.com. Phone 305-753-4586 |
| The Sweet House Bakery |  | Fort Lauderdale |  | thesweethousebakeryfl@gmail.com | | email: own Instagram via search; Also on its TikTok. Cottage bakery; address 33322 (Sunrise/Plantation area) |
| Sweet Guilt by Angelica |  | Fort Lauderdale |  | info@sweetguilt.com | | email: own site via search; Studio is in Sunrise (4604 N Hiatus Rd). Older founder address angelica@sweetguilt.com seen in 8-yr-old interview |
| Paty's Bakery |  | Boca Raton |  |  | | no published email found 2026-10-23; Only found on Zola directory with no email. Watch for Patty's Bakery TX and Patsy's Pizzeria Boca - different businesses |
| SugarChef |  | Delray Beach |  | sugar@sugarchef.com | | email: own site via search, verify; Contact page ~2.6 yrs old; FAQ says recently acquired by The Gardens of Bagatelle. Also on its Square booking page |
| Florida Sugar Treats |  | Tamarac |  |  | | no published email found 2026-10-23; Only a WeddingWire 'vendors you may like' mention; no contact details. Do not confuse with Sugar Momma's Petite Treats or Sweet Realities (Tamarac) |
| Forget Me Not Cake Shop |  | Hobe Sound |  |  | | outside the metro - verify |
| Gallery of Cakes |  | Aventura |  | gocakes@yahoo.com | | email: own site via search; Also on its Facebook page. Kosher Miami directory shows gocakes@gmail.com (not an allowed source) - conflict |
| Two to Cake |  | Aventura |  |  | | no published email found 2026-10-23; No email found. Sunbiz shows Two to Cake LLC INACTIVE (admin dissolved 2022) - may be closed. Site twotocake.com, phone 786-310-2253 |
| Ossi's Bake Shop |  | Aventura |  | ossisbakeshop@gmail.com | | email: own site via search, verify; Own Facebook shows a different address Ossi3006@gmail.com - conflict. Located in Sunny Isles Beach, not Aventura |
| Chefness Bakery |  | Aventura |  | info@chefnessbakery.com | | email: own site via search; Location is Hallandale Beach (and Boca Raton), not Aventura. Kosher bakery |
| Paula's Bake Shop |  | Aventura |  | info@paulasbakeshop.com | | email: own site via search; Also on its Facebook. Aventura Mall location |
| Monicakes Sweets & Dreams |  | Tampa |  |  | |  |
|---|---|---|---|---|---|---|
| LoveLee Bakeshop | instagram.com/loveleebakeshop | Fort Lauderdale (603 NE 13th St) | 954-715-2050 | hello@loveleebakeshop.com | | email: own site via search; Also on its Facebook; site says email preferred for custom orders |
| We Take The Cake | | Fort Lauderdale (1211 NE 9th Ave) | 954-764-2253 | sales@wetakethecake.com | | email: own site via search, verify; Yelp shows TEMP. CLOSED; site says no dedicated customer service team; corporate orders via Goldbelly |
| Panchis Bakery | | Fort Lauderdale (2726 Davie Blvd) | 754-600-3370 | panchisbakeries@gmail.com | | email: own Facebook Page via search; Also on second Facebook page and Nextdoor |
| La Cake Cafe | | Fort Lauderdale (2809 E Commercial Blvd) | 754-779-2965 | lacakecafe@gmail.com | | email: own site via search; Own site address is 2633 E Commercial Blvd, not 2809 as in input. Same email on Facebook |
| New River Cafe and Bakery | newrivercafeandbakery.com | Fort Lauderdale | | | | no published email found 2026-10-23; Only email on site is an individual staff address at riversidehotel.com (parent Riverside Hotel) - not a general inbox; not recorded. Phone 954-377-5500 |
| Dominiques Couture Cakes | | Fort Lauderdale | | | | no published email found 2026-10-23; No email found in 2 searches. Site dominiquescouturecakes.com, phone 954-849-0588; address conflicts (1523 E Las Olas vs 1001 W Cypress Creek). RocketReach masked yahoo address ignored |
| Mood 4 Cakes | mood4cakes.com | Davie | | mood4cakes@gmail.com | | email: own site via search; also on own Facebook; pickup-only online cake shop |
| Elegant Temptations | eleganttemptations.com | Miami | | etcakes@me.com | | email: own site via search; address is Hialeah Gardens; phone conflict 786-660-5584 vs 305-556-6111 |
| Johnson's Custom Cakes | | South Florida | | info@johnsonscustomcakes.com | | email: own site via search; based in Wellington (Palm Beach Co.), phone 561-422-0303 |
| Stackd Cake Studio | stackdcakes.com | Ellenton | 941-465-8108 |  | | no storefront; serves Sarasota + Tampa Bay |
| Chantilly Cakes | chantillycakes.com | Clearwater |  |  | |  |
| Alessi Bakery | alessibakery.com | Tampa |  |  | | est. 1912 |
| The Cake Girl | thecakegirl.com | Tampa |  |  | |  |
| The Artistic Whisk | theartisticwhisk.com | St Petersburg |  |  | |  |
| Caketastic | caketasticonline.net | Tampa |  |  | |  |
| 4R Bakery and Specialty Cakes |  | Winter Park | 407-543-8589 |  | |  |
| The Glass Knife | theglassknife.com | Winter Park |  |  | | tastings by appointment |
| Scotchie's Custom Cakes | scotchiescakes.com | Winter Park |  |  | |  |
| Classic Cakes |  | Jacksonville Beach | 904-246-6408 |  | |  |
| Cupcake Connection Bakery | yourcupcakelady.com | Jacksonville | 904-874-5101 |  | |  |
| D & D Cake Designs |  | Jacksonville | 904-316-7013 |  | |  |
| Ella's Cakes |  | Naples | 239-643-0778 |  | |  |
| Kakes by Katie |  | St Johns | 904-716-9915 |  | | appointment only, consultations Sundays |
| Love + Cake Bakery Jax |  | Jacksonville | 904-710-8046 |  | |  |
| LuLu's Cupcakes and More |  | Daytona Beach | 386-785-7038 |  | | **from a venue's preferred-vendor list - verify** |
| My Cupcake Insanity |  | Southwest Florida | 239-738-4994 |  | | **no source stated a city; filed region-wide on the 239 area code** |
| SassyCakes |  | Naples | 239-687-5100 |  | |  |
| Sweet By Holly |  | Jacksonville | 904-564-2711 |  | |  |
| Sweets By Staci |  | Jacksonville | 904-254-6394 |  | |  |

## 5. DJs (60)

| Business | Website | City | Phone | Email | Sent | Outcome |
| The Mix DJs | themixdjs.com | Miami / Fort Lauderdale / WPB |  | DJ@TheMixDJs.com | | email: own site via search; also on own Facebook; phone 786-286-8089 |
| Event Factor | theeventfactor.com | Miami |  | info@theeventfactor.com | | email: own site via search; directory also shows eventfactor84@gmail.com (not confirmed on own site) |
| Pizzle Productions |  | Pembroke Pines |  |  | | no published email found 2026-10-23; no email found; WeddingWire/Knot listings only (Pembroke Pines vs Davie) |
| Legendary Sounds |  | Pembroke Pines |  |  | | no published email found 2026-10-23; no email found; WeddingWire phone 954-604-8897; Knot lists Hollywood; Ontario 'Legendary Sound' is different business |
| DJ Juice Holdings |  | Pembroke Pines |  |  | | no published email found 2026-10-23; no email found; facebook.com/juice404 'DJ Juice' is a different (Atlanta/Texas) DJ - do not use JuiceBoxmp3s@gmail.com |
| Marvelous Entertainment |  | Miramar |  | musicmarvelous@gmail.com | | email: own Facebook Page via search, verify; only source is Facebook page (labelled musician/band); site marvelousentertainmentonline.com; phone 954-805-8096 |
| A&A Musik |  | Miramar |  |  | | no published email found 2026-10-23; no email found; Yellow Pages only, phone 954-589-4918; aa-music.de is unrelated German entity |
| LIVE305 Entertainment |  | Hollywood |  | info@live305entertainment.com | | email: own site via search, verify; own Facebook gives different address live305entertainment@gmail.com; address listed as Hollywood/Pembroke Pines |
| Palm Beach Party DJ | palmbeachpartydj.com | Wellington | 561-285-2640 | info@palmbeachpartydj.com | | **1600-day-old source - verify**; email: own site via search, verify; own Facebook/Nextdoor show booking@palmbeachpartydj.com instead; contact page obfuscated; phone 561-220-8241 most common |
| DJ Javier Cabal & Event Services |  | Miami | 786-708-0848 | djjaviercabal@gmail.com | | email: own Facebook Page via search, verify; Facebook only; own site phone 786-262-3536 differs from input; ZoomInfo/RocketReach ignored |
| Zeta Event Productions |  | Miami | 954-732-1350 | info@zetaeventproductions.com | | **second number 786-452-8742 published - verify**; email: own site via search; located Miami Lakes; own site phone 786-452-8742; older Honeyfund listing shows Roxy@ (staff) |
| Fiesta Time Entertainment |  | South Florida |  |  | | serves the Keys too; number was masked in the listing; no published email found 2026-10-23; No email found; GigSalad lists it in Fort Lauderdale. djfieztacctx@gmail.com on fiestadjservice.com is a different (Texas) business - do not use |
| Rhythm City Productions |  | Hollywood |  | info@rhythmcityweb.com | | 30+ years; number was masked in the listing; email: own listing via search, verify; Only source is a ~11-yr-old BizBash supplier listing (Davie FL); domain matches site on Yelp. Yelp/others show North Miami address; BBB shows Hollywood, phone 954-962-8554 |
| Elegant Entertainment DJ Services Orlando |  | Orlando |  |  | | also photo booth + uplighting |
| Boone's Professional Events | boonesproevents.com | Tampa |  |  | | DJ + photo booth + uplighting |
| White Rose Entertainment | orlandodj.com | Orlando | 407-375-4042 |  | |  |
| 5 Star Premier | 5starpremier.com | Orlando | 407-910-5790 |  | | serves Orlando + Tampa |
| Premium Party DJs | premiumpartydjs.com | Orlando |  |  | | serves Orlando + Tampa |
| Empire Entertainment | empireentertainment.us | Orlando | 407-440-8060 |  | | South Asian weddings |
| Win Show Events | winshowevents.com | Orlando |  |  | | Orlando + Tampa + Space Coast |
| Excellent! Entertainment | excellentdj.com | Orlando |  |  | | Orlando + Tampa |
|---|---|---|---|---|---|---|
| Eddie B & Company | eddieb.com | Fort Lauderdale | 954-721-9911 | eddie@eddieb.com | | |
| A1A DJs | a1adjs.com | South Florida | 954-531-8146 | | | no published email found 2026-10-23; No email found; only ZoomInfo (rejected). a1djs.com (Montreal) is a different business |
| All Events DJ Services | alleventsdjservices.com | South Florida | 954-290-6032 | | | no published email found 2026-10-23; No email found in 2 searches; business in Sunrise FL (9033 NW 54th St). Other 'All Events DJs' (NC, Seattle) are different businesses |
| Xpress Entertainment | xpressdjs.com | Miami / Fort Lauderdale | | events@xpressdjs.com | | email: own site via search, verify; From site structured data; Facebook shows event@xpressdjs.com (singular) - conflict. Pembroke Pines |
| Edifying Beats | edifyingbeats.com | South Florida | | info@edifyingbeats.com | | email: own site via search, verify; Seen on an older page of own site; contact page email obfuscated. Boca Raton / Fort Lauderdale |
| Vision DJs | visiondjs.com | South Florida | 954-418-2203 | info@visiondjs.com | | |
| Deco DJs | decodjs.com | South Florida | | ernie@lightfxpros.com | | email: own site via search, verify; Published on Deco DJs contact page but on a different domain (lightfxpros.com, likely sister lighting company); named person. Miami, 7261 NW 43rd St |
| DJ AJ Falcon | djajfalcon.com | Miami | | djajfalcon@gmail.com | | email: own site via search; Also on Yelp. Sole DJ/emcee |
| Power Parties | powerparties.com | Miami / Fort Lauderdale | | bigwill@powerparties.com | | email: own site via search, verify; Only seen in site's embedded page data; named owner address. Moved to Medley FL, by appointment |
| NYX Events | nyxevents.com | Boca Raton | | info@nyxevents.com | | email: own site via search, verify; Based in Rockville, MD (DC area); Boca Raton is only a service-area page. Location mismatch |
| Masso Entertainment | massoentertainment.com | West Palm Beach | | Matt@massoentertainment.com | | email: own site via search; Owner's address published as the business contact; also on Timeless I Do's listing |
| Vivid Source Events | vividsourceevents.com | Palm Beach County | | vividsourceevents@gmail.com | | email: own site via search; Also on its Facebook. Palm Beach Gardens; rentals/photo booth/speakers company rather than pure DJ |
| Traxx Entertainment | traxxentertainment.com | Florida | | | | |
| Tampa Bay DJ Company |  | Tampa |  |  | | preferred provider at 100+ venues |
| COS Celebrations | coscelebrations.com | Tampa |  |  | | DJ + live saxophone |
| Reign Entertainment | reigndjs.com | Tampa |  |  | | also photo booth |
| Wileysounds DJ & Entertainment | wileysounds.com | Tampa | 727-678-9264 |  | |  |
| Graingertainment |  | Tampa |  |  | | DJ + band, cold sparklers |
| Sound Ryte Mobile DJs | soundrytemobiledjs.com | Tampa | 813-370-0113 |  | | **jumbled directory listing** |
| Celebrations24 | celebrations24.com | Tampa |  |  | |  |
| Inner Circle DJs | innercircledjsfl.com | New Port Richey |  |  | | serves Tampa |
| Party Time Productions | ptpdj.com | Tampa |  |  | |  |
| Orlando DJ and Lighting | orlandodjandlighting.com | Orlando | 321-695-4072 |  | |  |
| Soundwave Entertainment | djsoundwave.net | Orlando |  |  | | since 2001 |
| DJ Danny Garcia | djdannygarcia.com | Orlando |  |  | |  |
| A Sound Choice Entertainment |  | Naples | 239-352-9988 |  | |  |
| Aardvark DJ & Bands |  | Pensacola | 850-390-0650 |  | |  |
| Boogie Inc |  | Pensacola | 850-438-1660 |  | |  |
| DJ Darion | djdarion.com | South Daytona |  |  | |  |
| DJ PAV Events | djpavevents.com | Jacksonville |  |  | |  |
| Emerald Coast Mobile DJ | destinweddingdj.com | Fort Walton Beach | 850-424-4650 |  | | office in Fort Walton Beach |
| Frank Roberts |  | Daytona Beach | 386-767-0946 |  | | **from a venue's preferred-vendor list - verify** |
| Ikeman Entertainment |  | Atlantic Beach | 904-803-4297 |  | | from $695 / 5 hours |
| MK Entertainment | mkentertainmentdj.com | Naples |  |  | |  |
| South Coast DJ Service |  | Pensacola | 850-240-2485 |  | |  |
| SW Florida Entertainment |  | Naples | 239-200-5688 |  | |  |
| White Knight Entertainment | eclipsejacksonville.com | Jacksonville |  |  | |  |
| White Sands Entertainment | whitesands-entertainment.com | Panama City Beach | 850-320-7007 |  | |  |
| Y Entertainment | yentertainmentdjs.com | Jacksonville |  |  | |  |

## 6. Bands & live music (35)

| Business | Website | City | Phone | Email | Sent | Outcome |
| FM Band Miami |  | Miami |  | moralmusicinc@gmail.com | | email: own site via search, verify; Own contact page gives this with a West Palm Beach address (looks like a parent/management name). ProvenExpert shows citationfmband@gmail.com (not allowed source) - conflict. Phone 786-630-6260 |
| Bay Kings Band |  | South Florida |  | info@baykingsband.com | | email: own site via search, verify; Location mismatch: WeddingWire lists Tampa; phones are 201/646 (NJ/NY); older Seth@baykingsband.com on Keys directory |
| Shane Duncan Band |  | Fort Lauderdale |  | info@shaneduncanmusic.com | | email: own site via search, verify; Page shows 2022 copyright; email domain differs from shaneduncanband.com |
| AAMusicians |  | Miami |  | Alan@AAMusicians.com | | email: own site via search; Owner Alan Andai, sole-operator contact; older AlanAndai@aol.com on personal site (do not use); Miami Beach |
| Inner Music Management |  | Miami |  | info@innermusiclive.com | | email: own site via search, verify; Appears rebranded as Inner Music Live; own FB lists innermusicmanagement@yahoo.com (older) |
| Sunbeat Entertainment |  | Miami |  |  | | no published email found 2026-10-23; Own contact page shows phone 305-988-6613 only; ZoomInfo masked emails rejected |
| La Nota Band |  | Miami |  | info@lanotaband.com | | email: own site via search |
| Florida Music Group | floridamusicgroup.com | Miami | 772-924-9302 | info@floridamusicgroup.com | | **second number 772-781-7415 published - verify**; email: own site via search; 772 = Treasure Coast area code, not Miami; FB lists rschilling6@comcast.net - personal-looking email: do not mail |
| The Sparkle Band | thesparkleband.com | Miami |  | hello@thesparkleband.com | | **646 = New York area code - verify local presence**; email: own site via search, verify; UK/London-based band with Miami landing page and 646 NY number; no confirmed Florida presence |
| Louis Pettinelli Entertainment |  | Miami |  | louis@louispettinellientertainment.com | | email: own site via search, verify; Based in NJ (Tri-State), Miami only via Thumbtack; older pettinellilouis@gmail.com on old contact page |
| Mercier's Music |  | Miami |  |  | | no published email found 2026-10-23; Hollywood FL; only phone (443) 310-8927 found |
| Mariachi los Mensajeros |  | Miami |  | mariachilosmensajeroseljr@gmail.com | | email: own site via search; Phones conflict (786-792-8441 vs 786-457-8739) |
| Mariachi Fiesta Grande |  | Miami |  | infofiestagrande@gmail.com | | email: own Facebook Page via search, verify; Only on Facebook page; not confirmed on own site mariachifiestagrande.com. Phone (786) 486-1758 |
| Mariachi Mexico 88 |  | Miami |  | Mariachimexico88@aol.com | | email: own site via search, verify; Own site contact page looks dated; booking phone (305) 200-6437. Ignore booking@gigroster.com (platform) |
| Mariachi Aventureros |  | Miami |  |  | | no published email found 2026-10-23; No email found; site mariachimiamiaventureros.com; phones conflict (786) 486-1389 vs (786) 590-9633; Sunbiz LLC administratively dissolved 2023 - may be inactive |
| Hermanos Mora Arriaga | hermanosmoraarriaga.com | Fort Lauderdale |  | info@HermanosMoraArriaga.com | | mariachi; email: own site via search; Headquarters address on own site; phone 786-303-8675 |
| Fondo Blanco Band |  | Miami |  | info@fondoblanco.net | | **15-month-old listing - verify**; email: own site via search; FB Entertainment LLC (Eduardo Ron), (954) 289-3570. Facebook 'Fondo Blanco' with Fondoblancoficial@gmail.com is a different Colombian group - do not use |
| Caesar Vera y El Sexteto Nuevoson |  | Miami |  |  | | salsa; no published email found 2026-10-23; No email found in 2 searches; booking only via The Bash/GigSalad. GigSalad lists Hollywood FL; Gulf Coast Symphony phone is the orchestra's, not the band's |
| Kenny Quintero Y Su Orquesta Brava |  | Miami |  | orquestabrava@aol.com | | email: own site via search; Phone 954-899-3516 |
| Paul Vesco Band | paulvesco.com | Orlando | 407-466-5781 |  | |  |
| Matt Winter Band | mattwinterband.com | Orlando |  |  | |  |
|---|---|---|---|---|---|---|
| CK Entertainment | ckentertainmentinc.com | South Florida | 954-436-1230 | info@ckentertainmentinc.com | | email: own site via search; Privacy policy has typo 'ckentertianment'; different company ckentertainment.com (chuck@) is unrelated |
| Sekond Nature | sekondnature.com | Fort Lauderdale | 954-607-8334 | juan@sekondnature.com | | email: own site via search, verify; Contact page ~7 years old per metadata; named person but published as direct contact |
| The Swooners | theswooners.com | South Florida | | | | no published email found 2026-10-23; no email in results; band also based in Rochester NY (FL in winter); phone 585-208-0924 on PartySlate |
| Heatwave Band | heatwavemusic.com | South Florida | | arthw@bellsouth.net | | email: own Facebook Page via search, verify; legacy bellsouth address on SFL Heatwave FB page; may be personal/unmonitored; phone 954-748-8555 |
| Private Property Band | privatepropertyband.com | Miami / Fort Lauderdale | | info@privatepropertyband.com | | email: own site via search; Pembroke Pines address; phone 786-859-2236 |
| Haviv Entertainment | shlomohaviv.com | Miami / Fort Lauderdale | | HavivEntertainment@gmail.com | | email: own site via search; phone 347-242-1846; RocketReach shows shlomohavivmusic@gmail.com (rejected source) |
| Joe Farren Live Music & DJ Services |  | St Petersburg |  |  | |  |
| DeLeon Entertainment | deleonentertainment.com | Tampa | 813-933-3924 |  | |  |
| Strings Attached | stringsattachedfl.com | Tampa |  |  | | **941 area code vs Tampa, phone withheld** |
| Bold City Classics | boldcityclassics.com | Jacksonville | 904-234-6554 |  | | trios up to a 14-piece big band |
| Bread and Butter | breadandbutterband.com | Jacksonville |  |  | |  |
| Mandalla Music Band | mandallamusic.com | Jacksonville | 904-796-8327 |  | | local best-band awards |
| The Band Be Easy |  | Jacksonville | 904-861-8128 |  | | **directory-only source** |
| The Rivertown Band |  | Jacksonville | 904-614-3711 |  | | **directory-only source** |

## 7. Officiants (61)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Just Married by Rosy | justmarriedbyrosy.com | Miami | 305-610-0308 | rosyfigueroa7@gmail.com | | **personal-looking email - do not mail** |
| Patti Roman |  | Miami / Cutler Bay | 305-283-7647 | rainbowpatti2020@gmail.com | | **personal-looking email - do not mail** |
| Eddie Rodriguez |  | Miami | 305-596-1810 |  | | Eventective listing; no published email found 2026-10-23; only Eventective listing with phone; no email |
| Marry Me Mendez |  | Miami | 305-439-5553 | chris@marrymemendez.com | | **may be the same business as Marry Me, LLC below - check before importing**; email: own site via search; sole officiant Chris Mendez; check overlap with Marry Me, LLC |
| SosFloWeddings |  | Miami Beach | 305-807-3898 |  | | Eventective listing; no published email found 2026-10-23; only Eventective listing with phone; no email |
| The Officiants |  | Fort Lauderdale | 800-354-4990 |  | | team led by Dominic Church; no published email found 2026-10-23; aka South Florida Officiants (southfloridaofficiants.com); email masked on Voyage Miami; Yelp phone 754-333-4990 |
| Mitchell Cohen |  | Fort Lauderdale | 954-757-0083 |  | | Eventective listing; no published email found 2026-10-23; no result matching this officiant |
| Hey Reverend |  | Fort Lauderdale | 604-574-7731 |  | | **604 = British Columbia, not FL - verify**; no published email found 2026-10-23; only Eventective listing; 604 BC area code |
| Terri Golden |  | Palm Beach / Broward | 561-685-9038 | goldt3@comcast.net | | **personal-looking email - do not mail** |
| Cantor Ann Turnoff | cantorannturnoff.com | Palm Beach County | 561-445-8914 |  | | stale directory - verify; no published email found 2026-10-23; no email found; now Director at Mark Center (Boca Raton); may no longer officiate weddings |
| Cantor Ellen Stettner | yourpersonalclergy.com | Palm Beach County | 561-213-1277 | elstet33@gmail.com | | stale directory - verify; email: own listing via search, verify; from Keshet inclusive-clergy directory, not own site; same phone 561-213-1277; Radaris addresses rejected |
| Ceremonies by Cindy | ceremoniesbycindy.com | Palm Beach County | 954-781-8822 |  | | stale directory - verify; no published email found 2026-10-23; no email in results; Pompano Beach address 2781 NE 15th St |
| Florida Weddings by Cecilia | floridaweddingsbycecilia.com | Palm Beach County | 561-231-0043 | weddingsbycecilia@gmail.com | | stale directory - verify; email: own site via search; Own site, Yelp and MapQuest give phone 954-560-5546; directory phone 561-231-0043 looks stale |
| Gracefully Wed Events | gracefullywedevents.com | Palm Beach County | 561-532-7919 | gracefullywedevents@gmail.com | | stale directory - verify; email: own site via search; Jupiter-based; serves Palm Beach and Martin counties |
| Modern Love South Florida |  | Palm Beach County | 561-401-3072 |  | | stale directory - verify; no published email found 2026-10-23; Only a Square site (modernlovebyg.square.site) and a phone number on a directory about 3 years old |
| Love Unions |  | Palm Beach County | 561-504-5107 |  | | stale directory - verify; no published email found 2026-10-23; Ryan Stifter; FB facebook.com/loveunions; no email shown |
| Liz Oliver, Ordained Minister |  | Palm Beach County |  | lizoliver914@gmail.com | | **personal-looking email - do not mail** |
| Eltard "Elta" Alexis |  | Fort Lauderdale |  | eltardsengagements@gmail.com | | email: own site via search; Business name Eltard's Engagements, LLC; phone 954-652-8323 |
| The Officiant FLA (Judge Rob) |  | Davie |  | FTLRobby@Gmail.com | | email: own site via search, verify; Owner's gmail, published as the contact on his own site's funerals page and his older FB page (facebook.com/OfficiantRob); phone 646-342-7738; not confirmed as current |
| HeartsFlow |  | Sunrise |  | info@heartsflow.org | | email: own site via search, verify; Nonprofit (HeartsFlow Inc.) that also offers officiant/MC services; older andy.mroc@gmail.com on hhweek.org is personal-looking: do not mail |
| The Vow Experience |  | Davie |  | info@thevowexperience.com | | email: own site via search; From the contact page's structured data (visible text obfuscated); phones differ between site (954-754-1915) and The Knot (305-495-4686) |
| Rabbi-Cantor Gaston Bogomolni |  | Davie |  | info@tzimtzum33.org | | email: own site via search, verify; Address belongs to his congregation Kehillat Tzimtzum (which he founded), not a wedding-specific site; WhatsApp 786-716-2172 matches WeddingWire |
| Wedding Ceremonies by Ketty Urbay | weddingceremoniesbyketty.com | Miami |  | RevKetty@gmail.com | | email: own site via search, verify; Site pages date from about 2019; do not use her realty address Ketty@UrbayRealtyGroup.com |
| Souls United Orlando |  | Orlando |  |  | |  |
| Steven Bechtel |  | Winter Park |  |  | |  |
| Joanne Zito |  | Winter Park |  |  | |  |
| Sensational Ceremonies | sensationalceremonies.com | Orlando |  |  | | Lon Tosi |
|---|---|---|---|---|---|---|
| All Faith Ministry | allfaithministry.com | Fort Lauderdale | | info@allfaithministry.com | | email: own site via search, verify; Online ordination organization with a New York address and 858 phone; the Fort Lauderdale page is marketing for getting ordained, not a local officiant. Probably not a wedding vendor |
| Wedding Officiant Fort Lauderdale | weddingofficiantfortlauderdale.com | Fort Lauderdale | 954-240-6234 | bblakene@bellsouth.net | | email: own site via search, verify; Becky Blakeney; old bellsouth.net ISP address published on her own site as the contact |
| Weddings by Lowell | weddingsbylowell.com | South Florida | | weddingsbylowell@gmail.com | | email: own site via search; Lowell Gannon, Oakland Park; phone 954-240-1944. ZoomInfo masked address ignored |
| From Engaged To Married | fromengagedtomarried.com | South Florida | | hello@fromengagedtomarried.com | | email: own site via search; Dania Beach / Hollywood; phone 954-951-2070 |
| South Florida Wedding Officiant & Notary | southfloridaweddingofficiantnotary.com | South Florida | | southflweddingofficiant@gmail.com | | email: own site via search; Raymond Rosales; phone 954-715-6297 |
| Rainbow Notary & Nuptials | rainbownotaryandnuptials.com | Miami / Fort Lauderdale | 954-579-3953 | southfloridarainbows@gmail.com | | |
| Just UnI Weddings | | South Florida | | emwise@justuniwedding.com | | email: own Facebook Page via search; Minister Edgar Wise; address on own domain justuniwedding.com; phone 954-546-0688; listings disagree on city (North Lauderdale / Pompano Beach) |
| Marry Me, LLC | | South Florida | | marrymellc@aol.com | | email: own Facebook Page via search, verify; Constance Rovetto; works South Florida, NY and NJ; 201 (NJ) phone; not confirmed on marrymellc.com |
| Weddings by Brandi |  | St Petersburg | 727-360-6963 |  | |  |
| Dr. Michael Woods |  | St Petersburg | 813-895-4298 |  | |  |
| A Florida Wedding Ceremony |  | St Petersburg | 727-422-5291 |  | |  |
| Ceremonies by Nan | ceremoniesbynan.com | Tampa |  |  | | notary + officiant, whole Tampa Bay |
| Katherine Imundi | imarrycouples.com | Orlando | 407-619-0173 |  | | FL marriage notary |
| A Bride, A Groom, A Notary |  | Orlando | 407-760-7397 |  | | bilingual |
| I DO Weddings by Sheri |  | Orlando | 407-375-3258 |  | | since 2006 |
| Notary of Orlando |  | Orlando | 407-494-4736 |  | |  |
| Dream Occasions Marriage Officiants |  | Davenport | 321-300-4354 |  | |  |
| Central Florida Ceremonies | centralfloridaceremonies.com | Orlando |  |  | |  |
| Ceremonies by Ray | ceremoniesbyray.com | Orlando |  |  | |  |
| A Beautiful Ceremony | abeautifulceremony.net | Orlando |  |  | |  |
| 2 Love 4 Ever |  | Jacksonville | 904-738-0966 |  | | English + Spanish |
| Barefoot To Elegant Weddings of Daytona | beachweddingsofdaytona.com | Daytona Beach | 386-747-0552 |  | | Volusia + Flagler |
| Beth Briand |  | Jacksonville | 904-514-4242 |  | |  |
| Danielle Drayson |  | Jacksonville | 904-413-8866 |  | | **directory-only source** |
| FLWedShop | flwedshop.com | Panama City Beach | 850-441-3788 | love@FLWedShop.com | |  |
| Glenn Guiler |  | Jacksonville | 904-707-7712 |  | | **directory-only source** |
| Life Events Mobile Notary Services |  | Jacksonville | 904-894-2454 |  | |  |
| Mila Notary & Wedding Solutions | milanotaryandweddingsolutions.com | Jacksonville | 904-207-5295 |  | |  |
| Naples Wedding Woman | naplesweddingwoman.com | Naples |  |  | | **813 area code vs Naples, phone withheld** |
| Panama City Beach Wedding Officiant |  | Panama City Beach | 850-276-0022 |  | | **generic trading name - verify** |
| Paradise Beach Weddings | paradisebeachweddings.net | New Smyrna Beach |  |  | |  |
| Rainbow Wedding Chapel | jacksonvilleweddingchapel.com | Jacksonville | 904-724-6269 |  | | ceremonies from $100 |
| Say I Do With Deb | sayidowithdeb.com | Naples | 239-243-2067 |  | |  |
| Wedding Ceremonies by Tom |  | Cape Coral | 239-541-2927 |  | |  |

## 8. Hair & makeup (49)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Tashy Marie Beauty | tashymariebeauty.com | South Florida |  | hello@tashymariebeauty.com | | page ~2yr old - verify; email: own site via search; Also on own FB; older info@tashymariemakeup.com seen in a Voyage MIA interview |
| Divine Beauty Artists | divinebeautyartists.com | Miami / Fort Lauderdale |  | info@divinebeautyartists.com | | email: own Facebook Page via search; multi-state (CO/FL/AZ) company; FL office Fort Lauderdale; phone 954-882-3593 |
| Kiss This Makeup | kissthismakeup.com | South Florida |  | info@kissthismakeup.com | | team of 85, mobile; email: own site via search; The Knot shows office@kissthismakeup.com; ignore catanisthemes@gmail.com (template leftover) |
| Aimee Beauty Co |  | Miami |  | info@aimeebeautyco.com | | email: own site via search; owner Aimee Ortega; Hialeah per WeddingWire |
| Not Just Blonde Studio (Alissa Westcott) |  | South Florida |  | korubeauty@outlook.com | | email: own listing via search, verify; name mismatch (Koru Beauty / Alissajane Beauty); GlossGenius booking page; Fort Lauderdale |
| Coastal Pearl Beauty |  | South Florida |  |  | | no published email found 2026-10-23; only Zola listing (owner Morgan Joy); no email |
| FeNom Salon |  | Aventura |  |  | | no published email found 2026-10-23; no email; phone 786-320-6187; info@fenom.com is a different (French) company |
| Beauty Arquitek |  | Aventura |  | info@beautyarquitek.com | | email: own Facebook Page via search; hair salon; unclear bridal focus |
| The Changing Room |  | North Miami Beach |  | thechangingroomfd@bellsouth.net | | email: own site via search, verify; hair salon; older site page showed info@changingroomsalon.com; bellsouth is current per site |
| Wondrous Look | wondrouslook.com | Miami | 305-890-4778 | info@wondrouslook.com | | email: own site via search; from site structured data (visible text obfuscated) |
| Beauty Studio | beautystudioinc.com | Miami |  | contact@beautystudioinc.com | | mobile; email: own site via search; national on-demand company HQ Las Vegas NV, not FL-based; phone 1-800-243-2240 |
| Mari D. MUA | maridmua.com | Miami |  | info@maridmua.com | | Brickell studio; email: own site via search, verify; site also shows mariana@maridmua.com (contact page); FB shows maridlsmua@gmail.com; also does quinces |
| Miami Beach Glam | miamibeachglam.com | Miami Beach |  |  | | no published email found 2026-10-23; no email in results; conflicting phones 305-800-5355 / 786-355-5468 |
| Art of Hair by Claudia |  | Miami |  | claudia@artofhairbyclaudia.com | | email: own site via search; also on Instagram; FB shows older artofhairbyclaudia@yahoo.com |
| Nova MakeUp and Hair |  | Miami |  | supernovabeautyglobal@gmail.com | | email: own site via search; also on FB; Coral Gables address |
| Michele Renee The Studio | michelereneethestudio.com | Tampa | 813-531-7770 |  | | **second number (727) 642-8017 in page data - verify** |
| Lili's Weddings | lilisweddings.com | Tampa | 813-313-6747 |  | | reaches Orlando |
| Art by Izzy | beautybyizzy.com | Tampa | 727-966-2655 |  | | reaches Orlando |
| Posh Bridal Team | poshbridalteamfl.com | Tampa | 844-382-1346 |  | | **name collides with Bridal Team - see note** |
| Adore Bridal | adorebridalservices.com | Tampa | 202-996-7690 |  | | **202 = Washington DC area code - verify** |
| Elegant Brides | elegantbrideshairandmakeup.com | Tampa | 813-966-7050 |  | | serves Tampa + Orlando |
| Destiny & Light | destinyandlight.com | Tampa | 813-476-8386 |  | |  |
| Beauty Brought Out | beautybroughtout.com | Tampa |  |  | |  |
|---|---|---|---|---|---|---|
| Asteria Beauty Studio | asteriamakeup.net | Fort Lauderdale | 954-531-8831 | bookings@asteriabeautystudio.com | | |
| Robbin Junnola Beauty | robbinjunnolabeauty.com | Fort Lauderdale (6278 N Federal Hwy #144) | | info@robbinjunnolabeauty.com | | email: own site via search |
| Hans on Beauty | hansonbeauty.com | South Florida | 954-667-9940 | tricia.hans@hansonbeauty.com | | email: own Facebook Page via search, verify; owner Patricia Hans; unclaimed directories show trishlynnhands@gmail.com |
| Faces by April | facesbyapril.com | Coral Springs / Fort Lauderdale | | facesbyapril@gmail.com | | email: own site via search; also on FB |
| Jules Fleming Artistry | julesflemingartistry.com | Fort Lauderdale | | info@julesflemingartistry.com | | email: own site via search; Also has Chicago office; FL phone (954) 902-5683 |
| Courtney Christopherson Glamour Group | courtneychristopherson.com | Boca Raton / Palm Beach | 561-289-2138 | courtneychristopherson@gmail.com | | email: own site via search; Also on own Facebook page. admin@courtneychristopherson.com only in page structured data - not used. Boca Raton |
| PriscillaM Beauty | priscillambeauty.com | South Florida | | priscillambeautyinquiry@gmail.com | | email: own site via search, verify; Based in Germantown MD (DC/MD/VA); site says it also serves Florida - location mismatch. Phone (800) 897-2893 |
| Glam By Carmen | glambycarmen.info | South Florida | | info@glambycarmen.info | | email: own Facebook Page via search, verify; Own site email masked in search; Nextdoor lists info@carmencabrera.com instead (conflict). Hollywood/Dania Beach FL, text 954-870-4139 |
| The Makeup Team | themakeupteam.us | Tampa | 813-694-3646 |  | | on-location Tampa/Clearwater/St Pete |
| Beautiful You Hair & Makeup | beautifulyoumakeup.net | Tampa | 813-503-9936 |  | | text preferred |
| Glam To Be | glamtobe.com | Tampa |  |  | |  |
| Savannah Olivia Beauty | savannaholiviabeauty.com | Tampa |  |  | |  |
| Gulf Beach Bride | gulfbeachbride.com | Tampa |  |  | | beach weddings |
| About Face Design Team | aboutfacedesignteam.com | Orlando | 407-647-2700 |  | | **source 449 days old** |
| Laura Reynolds Artistry | laurareynoldsartistry.com | Orlando |  |  | |  |
| The Glam Room Orlando | theglamroomorlando.com | Orlando |  |  | |  |
| Karmel Design Team | karmeldesignteam.com | Orlando |  |  | |  |
| Brides by Aymee | bridesbyaymee.com | Naples |  |  | |  |
| Invite Bride | invitebride.com | Fort Myers |  |  | |  |
| KC Makeup Artistry | kcmakeupartistry.com | Jacksonville | 904-303-9752 |  | |  |
| Kimtasha |  | Jacksonville | 904-535-1755 |  | | **listing ~1,224 days old - verify** |
| Maria Teresa On Location Hair and Make Up |  | Jacksonville | 904-584-0697 |  | | serves Ponte Vedra + St Augustine |
| Naples Makeup Artistry | naplesmakeupartistry.com | Naples |  |  | |  |
| NIC Studios | nicstudios.net | Jacksonville | 904-252-3243 |  | |  |
| Salon Bamboo | salonbamboonaples.com | Naples | 239-594-7055 |  | | salon or on-location |
| Sol Beautiful Makeup & Style | solbeautifulmakeupstyle.com | Jacksonville |  |  | |  |

## 9. Planners (55)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Ideal Events | idealeventsweddings.com | Miami | 305-709-1900 | idealevents.miami@gmail.com | |  |
| Luxy Events | luxy-events.com | Lauderhill |  | luxyeventplanning@gmail.com | | also in-house catering; email: own site via search, verify; Instagram shows thomas@luxy-events.com and different phone (786) 932-4188 - conflict. Site phone (561) 816-8220 |
| Stephanie Verrmar | stephanieverrmar.com | Miami |  | Team@StephanieVerrmar.com | | planner + florist; email: own site via search; Stephanie Verrmar Event Co.; stephanie@ address is for related booth business. Personal-looking gmail seen on a listing: do not mail |
| Gina Marie Weddings & Events | ginamarieevents.com | Miami / Fort Lauderdale / WPB |  | gina@ginamarieevents.com | | email: own site via search; Sole-owner contact, also on own Facebook; (954) 288-6234 |
| Memories for You, Weddings and Events | memoriesforyouevents.com | Wellington |  | info@memoriesforyouevents.com | | email: own site via search; (561) 573-3006 |
| Oh My Occasions | ohmyoccasions.com | South Florida |  | plan@ohmyoccasions.com | | email: own site via search, verify; Contact page dated; also info@ohmyoccasions.com on own site and amber@ on PartySlate. Phone is Tampa (813); listings say Pembroke Pines |
| Events by Tahimy |  | Miami |  | contact@tahimy.com | | Zola listing; email: own site via search; Now Tahimy & Co. Events, Cutler Bay; (954) 480-3401 |
| My Italian Favors |  | Boynton Beach | 866-236-1695 | info@myitalianfavors.com | | email: own site via search, verify; Favors retailer, not a planner - category mismatch. Also on own Facebook; order@ on a policy page |
| BOLD Impact Events & Wedding Planners |  | Boynton Beach | 561-320-1517 | info@boldimpactevents.com | | email: own site via search |
| Olive & Ivory Events |  | Boynton Beach | 561-613-3456 | christine@oliveandivoryevents.com | | email: own site via search; Owner Christine Olive's address published as the contact; marketing centered on Jupiter/Palm Beach |
| Events by Mala | eventsbymala.com | Fort Lauderdale |  | info@malaevents.com | | Indian weddings; email: own site via search, verify; Facebook lists info@eventsbymala.com instead (conflict). Phone 917 (NY) - multi-city company, FL presence unclear |
| Suhaag Garden |  | South Florida |  | events@suhaaggarden.com | | Indian weddings; email: own site via search; South Asian wedding decor, Homestead FL; (772) 528-0394 |
| Eventsource |  | Miami |  | customerservice@eventsource.com | | **5+yr old listing - verify**; email: own site via search, verify; Unclear this is the same business: Event Source appears to be a multi-market company with Miami brand Panache Events (info@panacheevents.com). Old listing; match uncertain |
| JRN Events |  | Boca Raton |  | jrneventdecors@gmail.com | | **5+yr old listing - verify**; email: own site via search; 561-451-5824; listing flagged 5+ yrs old but site appears current |
| Weddings To Go Key West |  | Key West | 305-879-2795 | weddingstogokw@gmail.com | | email: own site via search |
| Vidal Wedding & Event Planner |  | Key West | 305-942-1604 | vidalofkeywest@gmail.com | | also event photography; email: own Facebook Page via search, verify; Only on Facebook page; not confirmed on vidalofkeywest.com |
| Say Yes In Key West |  | Key West | 305-396-7602 | surpriseinparadise@gmail.com | | **second number 305-747-5700 published elsewhere - verify**; email: own site via search, verify; Address on keywestwedding.com (Surprise in Paradise LLC, apparently the business's own second site) and Crunchbase; not shown on sayyesinkeywest.com contact page. Directory also lists 305-433-0700 |
| Little Miss Planner | littlemissplannerkw.com | Key West | 786-334-0124 | info@littlemissplannerkw.com | | email: own site via search; Same address on The Knot and Facebook |
| Family Affair Key West | familyaffairkeywest.com | Key West | 305-433-0700 | info@familyaffairkeywest.com | | email: own site via search |
| Ocean Breeze Weddingz |  | Key West | 305-902-7688 | info@weddingplanningfl.com | | email: own site via search; site is weddingplanningfl.com; phone matches 305-902-7688 |
| Big Day in Key West | bigdayinkeywest.com | Key West | 305-647-9262 | bigdayinkeywest@gmail.com | | email: own site via search |
| Key West Casual Weddings | keywestcasualweddings.com | Key West | 305-849-1179 | dan@keywestcasualweddings.com | | no longer offers full planning; email: own Facebook Page via search, verify; owner Dan Leatherman's address on own FB page; site email obscured in results; no longer offers full planning |
| As You Wish Wedding Planning |  | Key West | 305-849-1268 |  | | no published email found 2026-10-23; 2 searches: Key West listings give phone only; @asyouwishfl Facebook is Winter Park (hello@asyouwishplanners.com), plus TX/CO/Marathon namesakes - none confirmed for Key West |
| Florida Weddings | floridaweddings.com | Fort Lauderdale |  | Daylen@FloridaWeddings.com | | beach packages; **553-day-old listing - verify**; email: own site via search, verify; named-person address on own contact page; page indexed ~2500 days ago; statewide company (14 destinations), not FTL-specific |
| Coastal Coordinating |  | Tampa |  |  | |  |
| Prodigy Event Planning |  | Tampa |  |  | |  |
| Bustle and Bloom |  | Tampa |  |  | | also florals |
| Truly Yours Event Planning |  | St Petersburg |  |  | |  |
| Winter Park Wedding Company | winterparkweddingcompany.com | Winter Park | 407-539-1538 |  | | in-house photo, video, florals, officiants |
|---|---|---|---|---|---|---|
| Blue Orchid Events & Design | blue-orchid-events.com | Fort Lauderdale | 248-840-4204 | abby@blue-orchid-events.com | | email: own site via search; site structured data also lists blueorchided@gmail.com |
| Très Chic Event Planning & Design | treschiceventplanning.com | Miramar (18741 SW 39th Ct) | 954-517-1818 | info@treschiceventplanning.com | | |
| A. Marie Events & Design | amarieevents.us | Fort Lauderdale | 321-205-8326 | info@amarieevents.us | | email: own site via search; related Simply Chic Weddings page lists simplychicweddingss@gmail.com |
| Event Bliss Design | eventblissdesign.com | Fort Lauderdale | 954-463-9120 | info@eventblissdesign.com | | email: own site via search, verify; Nextdoor marks business closed (may be stale); directories show second phone 954-319-1830 |
| AM Event Co. | ameventco.com | South Florida | 954-588-7869 | info@ameventco.com | | email: own site via search; florist/event co; address Deerfield Beach vs Pompano Beach across listings |
| Fabuluxe Events | fabuluxeevents.com | South Florida | 561-254-2041 | jennifer@fabuluxeevents.com | | email: own site via search; owner address published as the contact; older PRLog profile lists info@fabuluxeevents.com; unrelated Australian Fabuluxe Events uses .com.au |
| Ramos Events | ramosevents.com | Fort Lauderdale | | hello@ramosevents.com | | email: own site via search; WeddingWire places in Pembroke Pines; phone 954-637-6901 |
| Urbanica Luxury Events | urbanicaevents.com | Fort Lauderdale | | hello@urbanicaevents.com | | email: own site via search; also on own Facebook |
| Rodriguez Event Design | | South Florida | | rodriguezeventdesign@gmail.com | | email: own site via search; South Florida & Asheville; email seen in site structured data |
| Simple Weddings | simpleweddingsflorida.com | Gulfport | 727-537-9331 |  | | planning + photography |
| Wondrous Event Planners | wondrouseventplanners.com | Orlando | 321-200-3746 |  | | email info@ published on own site |
| Amore Events II | amoreeventsii.com | Orlando |  |  | | bilingual |
| Signature Weddings and Events | signatureweddingsorlando.com | Orlando |  |  | |  |
| Golden Hour Events | goldenhoureventsfla.com | Orlando |  |  | | day-of coordination |
| LT Events | weddingsbyltevents.com | Orlando |  |  | |  |
| The Chaos Coordinator | theechaoscoordinator.com | Orlando |  |  | |  |
| 30A To Wed | 30atowed.com | Santa Rosa Beach | 850-687-0076 |  | | also trades as Destin To Wed on the same line |
| A Beautiful Florida Wedding | abeautifulfloridawedding.com | Naples | 239-269-8983 |  | |  |
| Cata Events | cataevents.com | Melbourne |  |  | |  |
| Destin Wedding Company |  | Destin | 850-685-0190 |  | |  |
| Fancy Events | yourfancyevent.com | Santa Rosa Beach | 850-685-4472 |  | |  |
| First Coast Weddings and Events | firstcoastweddings.com | Jacksonville | 904-739-8003 | hello@firstcoastweddings.com | | since 2002 |
| Forever I Do Weddings | foreveridoweddings.com | Destin | 850-314-9448 |  | |  |
| Forever Together Beach Weddings | forevertogetherbeachweddings.com | Destin | 850-533-1292 |  | |  |
| Panama City Beach Weddings | panamacitybeachweddings.net | Panama City Beach | 850-819-6333 |  | | **three numbers published across listings - verify** |
| Pensacola Beach Weddings | pensacolabeachweddings.com | Pensacola Beach | 850-293-2457 |  | |  |

## 10. Caterers (56)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Bill Hansen Catering | billhansencatering.com | Coconut Grove | 305-858-6660 | info@billhansencatering.com | | serves Miami + Ft Lauderdale; email: own site via search; Hansen Group page lists bill@billhansen.com (relation unclear) |
| Thierry Isambert Culinary & Event Design | thierryisambert.com | Miami (915 NW 72nd St) | 305-635-6626 | info@thierryisambert.com | | email: own site via search; also on own Facebook; wedding page lists alt phone 305-912-9379 |
| Miami Wedding Caterer | miamiweddingcaterer.net | Miami (7049 SW 47th St) | 305-669-5221 | les@miamiweddingcaterer.net | | email: own site via search; named-person address on own contact page |
| Chef's Delights Catering |  | Miami (3520 NW 50th St) | 786-287-6283 | info@chefsdelights.com | | email: own site via search |
| Catering By Lovables |  | Miami (860 NE 79th St) | 305-640-1921 | info@lovablescatering.com | | email: own site via search, verify; site address Opa Locka, phone 305-751-1101 (input has 860 NE 79th St / 305-640-1921); own Facebook lists catering@gate.net; ~11yr-old article lists info@cateringbylovables.com |
| A Paella Party |  | Miami | 305-252-6669 |  | | no published email found 2026-10-23; 2 searches: directory listing confirms phone + 16155 SW 117th Ave, no email or Facebook found; a Chicago 'Paella Party' (paella-party.com) is a different/unclear business |
| VNV Events | vnvevents.com | Sunrise |  | info@vnvevents.com | | email: own site via search; site also lists contact@vnvevents.com |
| Premier Event Catering | eatwithpremier.com | Aventura |  | info@eatwithpremier.com | | kosher; email: own Facebook Page via search; ORB-certified kosher |
| Sensory Delights | sensorydelights.net | Pembroke Pines | 954-394-8465 | info@sensorydelights.net | | Caribbean + Haitian cuisine; email: own site via search |
| Broward Catering | browardcatering.com | Fort Lauderdale | 954-983-6937 | sales@browardcatering.com | | Jamaican + Haitian; **listing marked current only through 2024 - verify**; email: own site via search, verify; address/phone conflict across sources (Stirling Rd vs 401 E Las Olas); input flags listing current only through 2024; also in-house caterer for Lavan venue |
| Dade County Food Group |  | Miami | 305-965-7764 | dadecountyfoodgroup@gmail.com | | Caribbean + Latin American; email: own site via search |
| Park Ave VIP Catering | parkavevipcatering.com | Orlando | 252-772-4972 |  | | **252 = North Carolina area code against an Orlando address - verify** |
| Exclusive Affairs Catering | exclusiveaffairscatering.com | Winter Park |  |  | |  |
| John Michael Weddings & Special Events |  | Orlando |  |  | |  |
|---|---|---|---|---|---|---|
| Another Perfect Party | anotherperfectparty.com | Palm Beach / Broward / Dade | | contactus@anotherperfectparty.com | | email: own site via search; Pompano Beach; site also lists Alessandro@anotherperfectparty.com |
| 954 Catering | catering954.com | Fort Lauderdale | | | | no published email found 2026-10-23; no email in results; site lists (833) 228-3727 and contact form; based Deerfield Beach |
| Boca Joe's Catering | bocajoescatering.com | South Florida | | | | no published email found 2026-10-23; info@bocajoescatering.com and bocajoescatering@gmail.com seen only on third-party directories (justcatered, localbiznetwork); own contact page shows phones/form only |
| Hugh's Catering | hughscatering.com | South Florida | 954-563-4844 | info@hughscatering.com | | email: own site via search; Oakland Park |
| Catering by Kerrisha | cateringbykerrisha.com | South Florida | | kerrisha@cateringbykerrisha.com | | email: own site via search; owner-named address published as the business contact |
| Florida Cater | floridacater.com | Fort Lauderdale | | info@floridacater.com | | email: own Facebook Page via search, verify; floridacater.com is Culinary Artz Catering (same business as line 1211); own site shows malformed info@www.floridacater.com |
| Eggwhites Catering | eggwhitescatering.com | Miami | 305-892-2066 | events@eggwhitescatering.com | | email: own site via search |
| Elegant Kosher Catering & Events | elegantkoshercatering.com | Miami / Fort Lauderdale | | info@elegantkoshercatering.com | | email: own site via search |
| Eden Catering | kosherweddingsmiami.com | Hollywood | | events@cateringeden.com | | email: own site via search, verify; from cateringbyeden.com (Eden Regal Ballroom & Catering, Hollywood); kosherweddingsmiami.com contact email hidden; info@cateringeden.com seen on a venue vendor page |
| Shaike's Kosher Catering | shaikes.com | Southeast Florida | | info@shaikes.com | | email: own site via search |
| Kosher From Z Heart | kosherfromzheart.com | South Florida | | KosherZohara@gmail.com | | email: own site via search |
| Culinary Artz Catering | | South Florida | 954-803-8818 | info@floridacater.com | | **may be the same business as Florida Cater - same site, check before publishing**; email: own Facebook Page via search, verify; same business as Florida Cater (line 1205) - dedupe before outreach |
| Simply Gourmet Caterers | simplygourmetcaterers.com | Sarasota | 941-218-3671 |  | | also planning + coordination |
| Premier Event & Catering Services | premiereventservices.net | Orlando | 407-285-0284 |  | |  |
| Magic Occasions Catering |  | Orlando | 407-927-4515 |  | |  |
| Plus Catering Orlando |  | Orlando | 407-438-2900 |  | |  |
| Orlando Food Truck Catering | orlandofoodtruckcatering.com | Orlando | 407-900-6481 |  | | $3,500 minimum |
| Puff 'n Stuff Catering | puffnstuff.com | Orlando | 407-581-3343 |  | | FL-based, Tampa + Orlando |
| Good Food Events + Catering | goodfoodtampa.com | Tampa | 813-241-9500 |  | | **listings disagree on address** |
| Catering By The Family | cateringbythefamily.com | Tampa | 813-875-2000 |  | | 40+ years |
| G. Elliot's Catering | gelliotscatering.com | Tampa | 813-748-6315 |  | | since 1993 |
| Elite Events Catering |  | Tampa | 813-361-8473 |  | | **listings disagree on address** |
| C.B.K Catering & Events |  | Tampa | 813-699-3060 |  | | **directory-only source** |
| Gaston's Culinary Services |  | Tampa | 813-280-2257 |  | | **directory-only source** |
| 3 C's Catering |  | Tampa | 813-753-9900 |  | | **directory-only source** |
| J and T Fresh Catering | jandtfreshcatering.com | Tampa |  |  | |  |
| Mi Havana Latin Catering |  | Tampa | 813-451-4187 |  | | **stale listing** |
| A Chef's Touch | achefstouch.com | Melbourne | 321-638-0022 | info@achefstouch.com | |  |
| Anthony's Gourmet Catering | anthonysgourmetcatering.com | Jacksonville | 904-264-1338 |  | | off-premise |
| Bernwood Catering Co | bernwoodcatering.com | Naples | 239-777-5137 |  | |  |
| Carolina Catering Company |  | Naples | 239-384-9800 |  | | **directory-only source** |
| Chef's Dinner Table |  | Jacksonville | 904-484-6065 |  | | **directory-only source** |
| Creative Catering Naples | creativecateringnaples.com | Naples | 239-351-9867 |  | |  |
| Davoli's Catering |  | Jacksonville | 904-738-5415 |  | |  |
| Express Catering | expresscateringjax.com | Jacksonville | 904-771-5737 |  | | corporate focus; confirm weddings |
| G3 Catering | g3catering.com | Fort Myers | 239-887-0069 |  | | 30+ years, Lee + Collier |
| Naples Wedding Catering by Friscos | naplesweddingcatering.com | Naples | 239-784-1705 |  | |  |
| PJ's Catering | jaxcaterer.com | Jacksonville | 904-619-9410 | info@jaxcaterer.com | |  |
| Prestige Catering |  | Naples | 239-272-7180 |  | |  |
| Savour First Choice Catering |  | Fort Myers | 239-351-5547 |  | |  |
| Two Guys Catering | twoguyscatering.com | Naples | 239-384-9072 |  | | family-owned since 2015 |
| Well Oiled Events |  | Jacksonville Beach | 904-515-5071 |  | |  |

## 11. Venues (70) — approach last

| Business | Website | City | Phone | Email | Sent | Outcome |
| Sundy House |  | Delray Beach |  |  | | no published email found 2026-10-23; Yelp marks CLOSED, Downtown Delray says temporarily closed; info@sundyhouse.com only on third-party listings |
| The Soundpost Venue |  | Pompano Beach |  | info@soundpostvenue.com | | email: own site via search |
| Barn 305 | thebarn305.com | Homestead |  | info@thebarn305.com | | email: own site via search; Nextdoor shows ivan@thebarn305.com (owner) |
| The Club at Weston Hills |  | Weston |  | sales@theclubatwestonhills.com | | email: own listing via search, verify; only from club's own LinkedIn post about a Jan 2024 showcase (older); site uses contact form, wedding line 954-384-4600; Arcis Golf managed |
| Grand Ballroom at Sunrise Civic Center |  | Sunrise |  |  | | no published email found 2026-10-23; city-run; no email found; Leisure Services 954-747-4600 via sunrisefl.gov |
| Aqua Reception Hall | aquareception.com | Miami |  | info@aquareception.com | | email: own site via search |
| Prestige Estate | prestige-estate.com | Miami | 786-612-1542 | info@prestige-estate.com | | email: own site via search; also on own Facebook |
| The Addison | theaddisonofbocaraton.com | Boca Raton | 561-372-0568 | specialevents@theaddison.com | | glatt kosher venue + caterer; email: own Facebook Page via search, verify; domain theaddison.com differs from listed website; a photographer guide gives info@theaddison.com instead; do not confuse with Addison condos |
| The Venue Fort Lauderdale |  | Fort Lauderdale | 954-765-6968 | info@thevenueftlauderdale.com | | email: own site via search; from privacy/terms pages; blog/FB also give brett@thevenueftlauderdale.com |
| Crystal Ballroom BeachPlace | crystalballroomfortlauderdale.com | Fort Lauderdale |  | crystalballroombeachplace@gmail.com | | email: own site via search; also on own FB; site also lists eventplanning@crystalballroomfortlauderdale.com; part of Crystal Ballroom chain |
| The Westin Fort Lauderdale Beach Resort |  | Fort Lauderdale |  |  | | **corporate**; no published email found 2026-10-23; corporate (Marriott); only spa@ address found; events via Marriott form, 954-467-1111 |
| Broward Center for the Performing Arts |  | Fort Lauderdale |  | facilityrentals@browardcenter.org | | email: own site via search; rental inquiries address; catering/private events 954-468-2544 |
| Deering Estate | deeringestate.org | Miami | 305-235-1668 |  | | no published email found 2026-10-23; official contact page shows info@dev.deeringestate.org (dev subdomain, suspect); deeringevents@gmail.com on a Setmore booking page of unclear ownership; wedding page emails obscured; events 305-235-1668 opt 2 |
| Villa Toscana Miami |  | Homestead | 305-908-8586 | hello@villa-toscana-miami.com | | email: own site via search; Also on own Facebook. Directories show villatoscana.miami@gmail.com (older) |
| Curtiss Mansion | curtissmansion.com | Miami Springs | 305-869-5180 | events@curtissmansion.org | |  |
| Royal Mansion & Garden | royalmansiongardens.com | Homestead | 786-386-1116 |  | | no published email found 2026-10-23; No email published; contact form only. Also does quinceaneras |
| Villa Casa Casuarina | vmmiamibeach.com | Miami Beach | 786-485-2200 | events@vmmiamibeach.com | | email: own site via search, verify; Own pages dated a few years old. Named-person address seen on third-party page; not used |
| Vizcaya Museum & Gardens |  | Miami | 305-615-8735 | facility.rentals@vizcaya.org | | **number from a caterer page, not the museum - verify**; email: own site via search; From structured data on wedding page. Rentals phone 305-860-8448 (input number 305-615-8735 not confirmed) |
| SeaFair Miami |  | Miami | 786-353-4738 | info@seafairyachts.com | | yacht; email: own site via search; OpenTable shows events@seafairyachts.com. Site phone +1 786 305 8018 differs from input |
| Boat Miami | boatmiami.com | Miami | 305-758-2500 | charters@boatmiami.com | | yacht; **two numbers published - verify**; email: own Facebook Page via search; Not seen on boatmiami.com in results |
| Vista Yachts | vistayachts.com | Miami | 305-407-2324 | info@vistayachts.com | | yacht; email: own site via search |
| Miami Yacht Connect | miamiyachtconnect.com | Miami | 305-813-0537 | info@miamiyachtconnect.com | | yacht; **two numbers published - verify**; email: own site via search; Phone numbers inconsistent across site |
| Charter One Yachts |  | Fort Lauderdale | 954-833-4731 | info@charter1now.com | | yacht; email: own site via search; Own site (yachtchartersnow.com) main phone 954-771-0102; input number 954-833-4731 appears on one company page |
| Island Queen Cruises | islandqueencruises.com | Miami | 305-379-5119 | islandqueen@islandqueencruises.com | | yacht; **7yr old page - verify**; email: own Facebook Page via search, verify; Only source is Facebook; own contact page uses form/'Email Reservations' link. Does wedding charters |
| Beth David Congregation |  | Miami | 305-854-3911 | info@bethdavidmiami.org | | **two addresses and two numbers published - verify**; email: own listing via search, verify; From congregation's own Flickr profile, not its website. Related Center for Jewish Life uses info@centerbd.org |
| Trinity Episcopal Cathedral |  | Miami |  | office@trinitymiami.org | | email: own site via search; Wedding page says contact office. Phone numbers conflict. Different Trinity Cathedral in Phoenix: ignore |
| Miami Beach Community Church |  | Miami Beach |  | contactus@miamibeachcommunitychurch.com | | email: own site via search |
| Coral Gables Congregational UCC |  | Coral Gables |  | info@gablesucc.org | | email: own site via search; Wedding coordinator Mariana Broadmeadow published at MarianaB@gablesucc.org on gablesweddings.org (alt for weddings). Older info@ucc-cgcc.org seen on directory: outdated |
| Atlantic Wedding Chapel | atlanticweddingchapel.com | Pompano Beach | 954-461-5520 | atlanticweddingchapel@gmail.com | | email: own listing via search, verify; only source is Nextdoor business page; listings show phone 954-782-2925 (input has 954-461-5520); two addresses (627 E Atlantic Blvd vs 112 N Ocean Blvd) |
| The Ancient Spanish Monastery |  | North Miami Beach |  | info@spanishmonastery.com | | email: own site via search; directory shows info@ancientspanishmonastery.com; prefer official site |
| Miami Beach Botanical Garden |  | Miami Beach |  | growwithus@mbgarden.org | | email: own site via search; general garden contact, may need routing to events; older wedding guide named maurice@mbgarden.org (~3 yrs old) |
| Historic Virginia Key Beach Park |  | Miami |  | info@virginiakeybeachpark.net | | email: own site via search; venue rentals; reservations also via HVKBPReservations@miamigov.com |
| Fort Lauderdale Historical Society |  | Fort Lauderdale |  | info@historyfortlauderdale.org | | email: own site via search; now operates as History Fort Lauderdale; weddings go through Venue Rental Form (Rebecca Morse) |
| Wine + Garden |  | Fort Lauderdale |  | events@wineandgarden.com | | email: own site via search; private parties over 20 guests; general winegarden@nbvresorts.com |
| Stonebridge Country Club |  | Boca Raton |  | info@stonebridgefl.com | | country club; email: own Facebook Page via search, verify; general club address; official site obscures email; ignore other Stonebridge clubs (Aurora IL, Naples) |
| Boca Lago Golf & Country Club |  | Boca Raton |  | jen.marden@bocalago.com | | 35-350 guests; email: own listing via search, verify; named private-events contact from club's LinkedIn post (may be dated); club site redacts email |
| Boca Dunes Golf & Country Club |  | Boca Raton |  | cateringdirector@bocadunes.com | | email: own site via search, verify; conflict: older site page and Facebook show tracy@bocadunes.com |
| The Club at Boca Pointe |  | Boca Raton |  | fbalan@heritagegolfgroup.com | | email: own Facebook Page via search, verify; Director of Catering Fabienne Balan; club site obfuscates her email; confirm current |
| Jacaranda Country Club | jacarandacountryclub.com | Plantation |  |  | | no published email found 2026-10-23; No email on own site; only office@jacwestcc.com on a third-party directory with a different domain (likely outdated, not used). Phone 954-474-8998 |
| Plantation Preserve Golf Course & Club |  | Plantation |  | membership@plantation.org | | email: own site via search, verify; City of Plantation membership/marketing address, not catering-specific; catering line 954-585-5030; ignore catering@plantationgcc.com (Venice FL club) |
| The Garden Villa | thegardenvilla.com | Winter Park | 407-745-5718 |  | |  |
| Orlando Celebration Gardens | orlandocelebrationgardens.com | Winter Park | 407-960-2853 |  | | up to 250 |
| Villa Tuscany at WinterClub | winterclubvenue.com | Winter Park | 407-618-1123 |  | |  |
| Harry P. Leu Gardens |  | Orlando | 407-246-3681 |  | | capacity 180 |
| Venetian Ballroom | orlandovenetianballroom.com | Orlando | 407-721-0204 |  | | Orlando + Kissimmee locations |
| Cinderella Ballroom |  | Saint Cloud | 407-807-2246 |  | | capacity 80 |
| Cypress Grove Estate House |  | Orlando | 407-749-0792 |  | | capacity 200 |
| Luxmore Grande Estate |  | Winter Springs | 407-749-0783 |  | | capacity 200 |
| Gaylord Palms Resort & Convention Center |  | Kissimmee | 407-586-0000 |  | | **corporate** |
| Reunion Resort |  | Kissimmee | 888-799-5979 |  | | **corporate** |
| Casa Feliz |  | Winter Park | 407-628-8200 |  | | **second number 407-628-0230 published - verify** |
| The Vinoy Resort & Golf Club |  | St Petersburg |  |  | | **corporate** |
| Hilton Clearwater Beach |  | Clearwater |  |  | | **corporate** |
| The Coliseum |  | St Petersburg |  |  | | run by the City of St Petersburg |
| The Birchwood |  | St Petersburg |  |  | |  |
| Feather Sound Country Club |  | Clearwater |  |  | |  |
| Tampa Bay Watch Community Center |  | Tierra Verde |  |  | |  |
|---|---|---|---|---|---|---|
| Bonnet House Museum & Gardens | bonnethouse.org | Fort Lauderdale | | | | no published email found 2026-10-23; Email masked in all results. Events phone (954) 703-2608; events manager David Woodin |
| Boatyard | boatyard.restaurant | Fort Lauderdale | | | | no published email found 2026-10-23; official site uses Tripleseat form + events phone 954.525.9001; aaron@trp.company seen as unlabeled page data (parent co. The Restaurant People), not used |
| The House on the River | thehouseontheriver.com | Fort Lauderdale | | | | no published email found 2026-10-23; No email in results. Restaurant/event venue; phone (954) 825-2929 |
| The Grateful Palate Catering & Events | thegratefulpalate.com | Fort Lauderdale | | info@gratefulpalate.com | | email: own site via search, verify; on official accessibility page but domain differs from website (thegratefulpalate.com); older listing showed tatiana@thegratefulpalate.com (~6 yrs old) |
| LAVAN Luxury Venue | lavancateringandevents.com | Broward County | | info@lavanvenue.com | | email: own site via search; domain differs from website but listed on official booking page; Nextdoor matches |
| Club of Knights | clubofknights.com | Coral Gables | | sales@clubofknights.com | | email: own site via search; official page indexed ~16 months ago; ignore info@fetesevents.com (BizBash) and maggie@bestmiamiweddings (typo listing) |
| Comber Hall | | Coral Gables | | afancyfiesta@msn.com | | email: own Facebook Page via search, verify; conflict: Comber Hall wix site lists lcuza@cotlf.org (Church of the Little Flower, owner); msn address is the caterer A Fancy Fiesta that runs events |
| Conrad Fort Lauderdale Beach | hilton.com | Fort Lauderdale | | FLLCI.Catering@ConradHotels.com | | **corporate**; email: own site via search; Corporate hotel; listed with Tara Wengert, Senior Catering Sales Manager, 954-414-5133 |
| The Biltmore Hotel | biltmorehotel.com | Coral Gables | | cateringleads@biltmorehotel.com | | **corporate**; email: own site via search; Corporate. General@biltmorehotel.com on contact page; older weddings@biltmorehotel.com on ~6yr-old vendor page |
| Loews Coral Gables | loewshotels.com | Coral Gables | | | | **corporate**; no published email found 2026-10-23; Corporate; sales via contact form only. Only a reservations address on a third-party directory (not used) |
| Faena Hotel | | Miami Beach | | | | **corporate**; no published email found 2026-10-23; Corporate; Special Events email masked on faena.com/contact-us. Phone +1 305 534 8800 |
| The Barn at Crescent Lake | barnatcrescentlake.com | Odessa | 813-486-2731 |  | | 20 lakefront acres |
| Dragonfly Farms | dragonflyfarmsfl.com | Palm Bay |  |  | |  |

## 12. Transportation (30)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Rumbatours Miami | rumbatoursmiami.com | Miami |  | reservations@rumbatoursmiami.com | | classic cars + coaches; email: own site via search; Same operator (Rumba Tours Miami LLC) as Miami White Trolley, line 1325; shared inbox |
| A Family Limo | afamilylimo.com | Miami |  | reservations@afamilylimo.com | | Rolls-Royce + charter; email: own site via search; Based Hallandale Beach, not Miami; sister site afamilycoaches.com uses reservations@afamilycoaches.com |
| American Limo & Transportation Service | americanlimofl.com | Miami |  | info@americanlimofl.com | | email: own site via search; Trades as American Transportation & Limo Service; also reservations@americanlimofl.com |
| American Dream Tour Miami | americandreamtourmiami.com | Miami |  | info@americandreamtourmiami.com | | classic convertibles; email: own site via search; Email from terms page; located Miami Beach |
| Miami White Trolley | miamiwhitetrolley.com | Miami |  | reservations@rumbatoursmiami.com | | trolley, 30 passengers; email: own site via search; Duplicate operator: dba of Rumba Tours Miami LLC (line 1321); same inbox, don't double-mail |
| Molly's Trolleys of West Palm Beach |  | West Palm Beach |  | info@mollystrolleys.com | | 1920s-style trolleys; email: own site via search; BizBash listing shows wpb-info@mollystrolleys.com (unconfirmed); not the Pittsburgh company |
| Atlantic Charters | atlanticchartersinc.com | Fort Lauderdale | 954-448-2032 | sales@atlanticchartersinc.com | | charter buses; email: own site via search; Not Atlantic Air Charter (jet operator) |
| Premier Bus Charters |  | Sunny Isles Beach |  |  | | no published email found 2026-10-23; Site premierbuscharter.com has contact form only; registry email masked |
| Phoenix Bus |  | Orlando |  |  | | minibus to 57-passenger |
| VIP Wedding Transportation |  | Orlando |  |  | | sedans, limos, classic cars |
| Orlando Luxury Transportation | orlandoluxurytransportation.com | Orlando |  |  | |  |
| Black Car Everywhere | blackcareverywhere.com | Orlando |  |  | |  |
| Tampa Minibus Company |  | Tampa |  |  | |  |
| Champa Bay Limo |  | Tampa |  |  | |  |
|---|---|---|---|---|---|---|
| Sal Limo Service | sallimoservice.com | Fort Lauderdale | 786-816-3259 | reservations@sallimoservice.com | | email: own site via search; Address is Miami (734 NE 90th St), not Fort Lauderdale; also on its Facebook |
| Fort Lauderdale Airport Shuttle Limo | fortlauderdaleairportshuttle.com | Fort Lauderdale | 954-688-7738 | info@airportshuttleinc.com | | email: own site via search, verify; Email on a different domain (airportshuttleinc.com) than the site; confirm |
| Black Car Miami | blackcarmia.com | Miami | 786-685-3076 | reservations@blackcarmia.com | |  |
| Lauderdale Limos | lauderdalelimos.com | Fort Lauderdale | 954-951-2348 | lauderdalelimousines@gmail.com | | email: own site via search; Gmail business address published on own contact page and homepage |
| Miami Shuttle & Limo Service | miamifllimousines.com | Miami | 888-657-6842 |  | | no published email found 2026-10-23; Search returned nothing from miamifllimousines.com or this name; only similarly named other companies |
| Majestic Limousines | majesticlimos.com | Coral Gables | 305-774-0117 | info@majesticlimos.com | | email: own site via search |
| Miami Limo Service | miami-limo.com | Miami Beach | 305-414-1111 |  | | no published email found 2026-10-23; No results from miami-limo.com; many similarly named Miami limo sites, could not tell apart |
| Apex International Transportation | apexlimofl.com | Miami | 305-707-5837 | maps@apexlimofl.com | | email: own listing via search, verify; Only from press releases (2024) and a directory; site's own email obfuscated in results; press contact is Boris Pinchevsky |
| Worldwide Limo | worldwidelimo.com | Miami | 305-440-1111 | info@worldwidelimo.com | | email: own site via search, verify; Own site, but pages indexed ~3-4 years ago |
| Ambassador Limousine and Sedan |  | Tampa | 727-442-9050 |  | | **727 number, Tampa address** |
| Showtime Transportation of Tampa | showtimetampa.com | Tampa | 813-749-4900 |  | |  |
| WDT Limo | wedrivetampa.com | Tampa |  |  | | **toll-free + 941 dispatch only, withheld** |
| Alora Transportation | aloraride.com | Tampa | 813-314-0000 |  | |  |
| Skyline Limousine | skyline-limo.com | Tampa |  |  | |  |
| Affari Transportation | affaritampa.com | Tampa |  |  | |  |
| Unique Corporate Limos | uniquecorporatelimos.com | Jacksonville | 904-800-5657 |  | | real street address, unlike the generic-domain limo sites |

## 13. Photo booth (28)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Three Sixty Photo Booths Orlando | threesixtyorlando.com | Orlando | 407-440-0242 |  | | 360 booths + uplighting |
| Orlando's Best PhotoBooth | orlandobestphotobooth.com | Orlando |  |  | |  |
| Magic Booth Photo | magicboothphoto.com | Orlando |  |  | |  |
| Luxe Booth | luxebooth.com | Orlando |  |  | |  |
| Sunshine Snap Photo Booth |  | Orlando |  |  | |  |
| Orlando Event Photo Booth | orlandoeventphotobooth.com | Orlando |  |  | | also LED uplighting |
| Event Heroes of Tampa Bay | eventheroesoftampabay.com | Tampa |  |  | | **listing shows "888shoot55", not a usable number** |
| Pineapple Photo Booth Co | pineapplephotobooth.com | Tampa |  |  | | serves Clearwater + St Petersburg |
|---|---|---|---|---|---|---|
| Glowshot | glowshotevents.com | Miami | 305-303-5740 |  | | no published email found 2026-10-23; Site gives phone/WhatsApp only |
| Ace Photobooth Rentals | acephotoboothrentals.com | Fort Lauderdale |  | sales@acephotoboothrentals.com | | email: own site via search; Contact page also shows a Manchester, CT address alongside Fort Lauderdale; also on its Facebook |
| Esteem 360 Studios | esteem360studios.com | South Florida |  | info@esteem360studios.com | | email: own site via search; Directory gmail (miloadams567@) seen: personal-looking email, do not mail |
| The Gala Photobooth | thegalaphotobooth.com | Fort Lauderdale |  | info@thegalaphotobooth.com | | email: own site via search; Tampa-based (813 number), serves Miami/Fort Lauderdale; structured data typo info@thegalabooth.com |
| MIA Mirror Booth | miamirrorbooth.com | Miami |  | info@miamirrorbooth.com | | email: own site via search; Based Hollywood, FL; also on its YouTube |
| Photo Booth by LNH | photoboothlnh.com | South Florida |  | info@photoboothlnh.com | | email: own site via search; Coconut Creek; also on its Facebook |
| JuJu Booth | jujubooth.com | South Florida |  | info@jujubooth.com | | email: own site via search; HQ South Florida and Raleigh NC |
| DEMM Photo Booths | demmphotobooths.com | Tampa | 813-214-8098 |  | | 360 video booth |
| Snapshot Media | snapshotmediatampa.com | Tampa |  |  | | 360 booth, from $800 |
| Be Glam Photo Booth | beglamphotobooth.com | Sarasota |  |  | |  |
| BFF Booth | bffbooth.com | Jacksonville | 904-477-9995 |  | | also trades as Big Fun Photo Booth on the same line |
| Forever in the Moment Co | foreverinthemomentco.com | Fort Myers | 239-296-9316 | info@foreverinthemomentco.com | |  |
| Instant Photocube | instantphotocube.co | Jacksonville | 904-576-5855 |  | |  |
| Jax Booth | jaxbooth.com | Jacksonville | 904-504-1759 |  | |  |
| JAXonville 360 |  | Jacksonville | 904-504-1696 |  | |  |
| Lucky Photo Booth | yourluckybooth.com | Fort Myers | 239-961-7150 | hello@yourluckybooth.com | |  |
| Mojo of Jacksonville | mojoofjacksonville.com | Jacksonville |  |  | |  |
| PhotoBooth Creations | photobooth-creations.com | Jacksonville | 904-947-8644 |  | |  |
| Photobooth Pixel | photoboothpixel.com | Jacksonville | 904-419-3029 |  | |  |
| Picture & Pose | pictureandpose.com | Jacksonville | 904-326-3428 |  | |  |

## 14. Lighting (6)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Rent For Event | rentforevent.com | Miami | 877-409-6999 | contact@rentforevent.com | | **two conflicting numbers published - verify**; email: own listing via search, verify; Not seen on own contact page in results; from Tumblr profile and AllBusiness; addresses conflict (Miramar/Fort Lauderdale/Miami/LA); national company |
| Miami Party DJ | miamipartydj.com | Miami | 305-609-6707 |  | | no published email found 2026-10-23; Site shows phone and contact form only |
| DJ Peoples |  | Miami | 305-328-9492 | rentals@djpeoples.com | | **three numbers published - verify**; email: own site via search; Facebook also shows weddings@djpeoples.com for wedding inquiries; phones differ across sources |
| Kings Rentals | kings-rental.com | Miami | 786-541-4892 | kingsrental@hotmail.com | |  |
| Miami Uplighting Rentals | miamiuplightingrentals.com | Miami | 786-755-3431 |  | | no published email found 2026-10-23; Site shows phone and form only; similarly named Uplightmiami (contact@uplightmiami.com) is a different business |
| Gabro Event Services | gabroeventservices.com | Tampa |  |  | | draping + uplighting |

## 15. Bridal salon (40)

| Business | Website | City | Phone | Email | Sent | Outcome |
| ANV Bridal Valet | anvbridalvalet.com | Fort Lauderdale |  | Anvbridalvalet@yahoo.com | | **attire care on the day, NOT vehicle parking**; email: own Facebook Page via search, verify; Conflict: ProvenExpert listing shows info@anvbridalvalet.com; own site has phone only; based Plantation; attire care not parking |
|---|---|---|---|---|---|---|
| Boca Raton Bridal | bocaratonbridal.net | Boca Raton | 561-447-6541 | gowns@bocaratonbridal.com | | **959-day-old source - verify**; email: own site via search; Coral Springs 'South' location uses south@bocaratonbridal.com |
| Amazing Brides Couture |  | Boca Raton | 561-372-9377 | amazingbridescouture@gmail.com | | **959-day-old source - verify**; email: own site via search; Address conflict between listings (6349 vs 2831 N Federal Hwy) |
| Brittany Burns Bridal of Boca |  | Boca Raton | 561-717-8745 |  | | **959-day-old source - verify**; no published email found 2026-10-23; Yelp marks CLOSED. No email found |
| Nuova Vita |  | Boca Raton | 561-558-5733 |  | | **959-day-old source - verify**; no published email found 2026-10-23; No email in results; site nuovavita.com, phone 561-558-5733 |
| Wonderland Bridal |  | Margate | 954-973-8695 | hello@wonderlandbridal.com | | **959-day-old source - verify**; email: own site via search; Older info@wonderlandbridal.com on 2015-16 blog posts |
| Patricia South's Bridal & Formal |  | Fort Lauderdale |  | info@psbride.com | | email: own site via search, verify; Also on Facebook, but own dress-authenticity page uses info@patriciasouthsbridal.com: conflict. Located Plantation (4066 W Broward Blvd) |
| Southern Formals |  | Fort Lauderdale |  |  | | tuxedo; no published email found 2026-10-23; Tuxedo. Only southernformals@gmail.com on a supplier store locator (tuxedofit.com), not own source; not used. Phone 954-463-1171 |
| Luv Bridal Fort Lauderdale |  | Fort Lauderdale |  | fortlauderdale@luvbridal.com | | email: own site via search; location-specific showroom inbox; corporate luv@luvbridal.com also on luvbridal.com |
| Savvy Bridal FTL |  | Fort Lauderdale |  | ftl@savvybridal.com | | email: own site via search; FTL location of a Kansas City-based chain; info@savvybridal.com is KC; Facebook shows imene@savvybridal.com (individual) |
| Lauderdale Bride |  | Fort Lauderdale |  | info@lauderdalebride.com | | email: own site via search; Moved to 2741 E Oakland Park Blvd; old 4130 N Federal Hwy location shows CLOSED on MapQuest |
| Talega Atelier |  | Fort Lauderdale |  | info@talegaatelier.com | | email: own site via search; Address conflict: WeddingWire Fort Lauderdale, Yelp Hollywood, own site says Miami |
| AJs Custom Suits & Tuxedos Rentals |  | Boca Raton |  | info@thefirmsuits.com | | tuxedo; email: own Facebook Page via search, verify; AJs Tuxedo Facebook page now branded The FIRM Bespoke Formalwear (thefirmsuits.com), same 1700 S Dixie Hwy Boca address; likely rebrand; tuxedo/menswear |
| House of Seide |  | Boynton Beach |  |  | | no published email found 2026-10-23; No email found; phone 561-336-4480; site possibly lyndaseide.com; address conflicts (1000 Gateway Blvd vs 1101 N Congress) |
| Gloria Couture |  | Miami | 305-864-1090 | info@gloriacouture.com | | email: own site via search; Actually North Miami Beach (13615 Biscayne Blvd); alterations-focused |
| MDO Miami |  | Miami |  | manuel@mdomiami.com | | menswear; email: own Facebook Page via search, verify; Named-person address on Men's Designers Outlet FB page; own site shows no email; menswear |
| LinDi Bridal |  | Sunrise |  | lindiandco@gmail.com | | email: own site via search; Phone numbers vary across directories |
| The Collection Bridal | thecollectionbridal.com | Winter Park | 407-740-6003 |  | | in-house alterations |
| Calvet Couture Bridal | calvetcouture.com | Winter Park | 407-951-5670 |  | | by appointment only |
| The Bridal Finery |  | Winter Park | 407-960-5225 |  | |  |
| Angel Rivera Bridal Atelier |  | Winter Park | 407-960-7544 |  | |  |
| Leonardo Fifth Avenue |  | Winter Park |  |  | | tuxedo, custom-made |
| Magnolia Laine Bridal | magnolialainebridal.com | Tampa | 656-203-8615 |  | | 656 is a valid Tampa overlay |
| Truly Forever Bridal | trulyforeverbridal.com | Tampa | 813-931-8991 |  | |  |
| Jade Bridal | jadebridaltampa.com | Tampa | 813-614-1490 |  | | appointment only |
| The Bridal Outlet of Tampa | thebridaloutletoftampa.com | Tampa | 813-289-9400 |  | | inside Ivory & Lace |
| White Closet Bridal | thewhiteclosetco.com | Tampa | 813-249-4696 |  | |  |
| Maria's Bridal Connection | mariasbridal.net | Tampa |  |  | | **727 area code vs Tampa, phone withheld** |
| Ivory & Lace Bridal | ivoryandlacebridal.com | Tampa |  |  | |  |
| Elliot James Bridal | elliotjamesbridal.com | Tampa |  |  | | appointment only, N Hyde Park |
| Theory Bridal House | theorybridalhouse.com | Orlando | 407-219-4529 |  | | Avalon Park |
| Bridal Gown Studio Orlando | bridalgownstudioorlando.com | Orlando | 407-826-1843 |  | | appointment only |
| Lily's Bridal | lilysbridal.com | Orlando | 407-228-4050 |  | |  |
| Minerva's Bridal | minervasbridal.com | Orlando |  |  | |  |
| Bridal Gallery of Orlando | bridalgalleryoforlando.com | Orlando |  |  | |  |
| Debra's Bridal Shop | bridalshopavenues.com | Jacksonville |  |  | |  |
| Love, a Bridal Boutique | lovebridalboutique.com | Jacksonville Beach | 904-242-9800 |  | | 350+ gowns |
| One Bridal | onebridalboutique.com | Jacksonville |  |  | |  |
| Palm Bridal |  | Naples | 239-263-8220 |  | |  |
| The White Magnolia | whitemagnoliabridal.com | Jacksonville | 904-352-3309 |  | | San Marco, appointment only |

## 16. Rentals (33)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Mi Vintage |  | Miami |  | LetsParty@mivintagerentals.com | | decor + rentals; email: own site via search |
| Eventluxe Rentals |  | Miami |  | info@eventluxe.com | | decor + rentals; email: own Facebook Page via search, verify; Own site email obfuscated; info@ also on BizBash directory. Do not confuse with Events Luxe (eventsluxe.com) or The Event Luxe (Toronto) |
| Elements and Access Event Rentals |  | Doral |  | sales@elementsandaccents.com | | **5+yr old listing - verify**; email: own site via search, verify; Real name is Elements & Accents (input says 'Access'); old listing; FB page also shows elementsandaccents@yahoo.com (older) |
| Arc Divine | arcdivine.com | Miami | 954-319-6126 | weddings@arcdivine.com | | chuppah + arch rental; resolves the unattributed 954-319-6126 seen earlier; email: own site via search; Also on own Instagram; based Coconut Creek/Davie, serves Miami |
| Arches By Design | archesbydesign.com | South Florida |  | info@archesbydesign.com | | builds in-house, incl. the Keys; email: own site via search; FAQ page also lists archesbydesignfl@gmail.com; Dania Beach |
| Eventgi Party Rental | eventgipartyrental.com | Miami |  | info@eventgipartyrental.com | | email: own site via search; Also on The Knot/WeddingWire |
| A Linen Valley |  | St Petersburg | 727-541-5329 |  | | **directory did not state the service; name implies linen rental - verify** |
| On The Move Wedding & Event Rentals |  | Tampa |  |  | |  |
| Golden Events |  | Tampa |  |  | | furniture, tableware, specialty linens |
| A Chair Affair |  | Tampa |  |  | |  |
| Connie Duglin Linen |  | Tampa |  |  | | linens |
| Kate Ryan Linens |  | Tampa |  |  | | linens + chair covers |
| Chairs4allevents |  | Largo |  |  | | chairs, tables, flatware |
| iRent Everything | irenteverything.com | Tampa |  |  | |  |
| Atlas Event Rental | atlaseventrental.com | Orlando |  |  | | serves Orange County |
| FH Events | fheventrentals.com | Tampa | 813-390-9371 |  | | Tampa + Orlando; furniture + floral |
|---|---|---|---|---|---|---|
| Allure Party Rentals | allurepartyrentals.com | Fort Lauderdale | 954-598-9595 | info@allurepartyrentals.com | | email: own site via search |
| Christina's Party Rentals | christinaspartyrentals.net | Miami |  | cpr.christina@gmail.com | | email: own site via search; Old BizBash listing shows a personal AOL address: do not mail |
| Over the Top Rental Linens |  | Fort Lauderdale |  | info@ottrl.com | | linens; email: own site via search, verify; Own site says info@ottrl.com; Crunchbase and FB say info@overthetopinc.com (conflict) |
| Weston Events Party Rentals |  | Weston |  | info@weston-events.com | | email: own site via search; Not to be confused with We Rent Fun |
| Imperial Event Rentals | imperialeventrentals.com | Miami |  | info@imperialeventrentals.com | | email: own site via search; Older address info@imperialpartyrentals.com on WeddingWire/FB; Hialeah HQ |
| Rent Anything Orlando | rentanythingorlando.com | Orlando | 407-502-3741 |  | |  |
| Signature Event Rentals | signatureeventrentalsllc.com | Orlando |  |  | |  |
| Party Rentals of Orlando | partyrentalsoforlando.com | Orlando |  |  | | tents |
| All Occasions Rentals | alloccasionsorlando.com | Orlando |  |  | |  |
| Alpine Events | alpineevents.com | Orlando |  |  | |  |
| Panache Events | panacheevents.com | Orlando |  |  | |  |
| 904 Party | 904party.com | Jacksonville | 904-299-3535 |  | |  |
| A2Z Events FLA | a2zeventsfl.com | Jacksonville | 904-417-8585 |  | |  |
| All About Events | allabouteventsjax.com | Jacksonville | 904-379-6822 |  | |  |
| Jax Party Company | jaxpartycompany.com | Jacksonville | 904-661-9857 |  | |  |
| Luxe Party Rentals | luxepartyrentals.com | Jacksonville | 904-576-4098 |  | |  |
| Sunshine Event Rentals | sunshineeventrentals.com | Jacksonville |  |  | |  |

## 17. Bar service (12)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Fire Water Bars | firewaterbars.com | South Florida |  | alan@firewaterbars.com | | email: own site via search; Owner Alan Oria's address published as the contact; based Miramar; BizBash shows older firewaterbars@gmail.com |
| With A Twist Bartending Service | twistbartendingservice.com | South Florida |  | info@withatwistevents.com | | email: own site via search, verify; Multi-state chain; Florida unit based in Lithia (Tampa area), not South FL; conflicting addresses (FB florida@twistbartending.com, info@getwithatwist.com) |
| Bar2Hire USA |  | South Florida |  |  | | no published email found 2026-10-23; No email found; Zola lists Bar2HireUSA (South Florida), Yelp 'Bar 2 Hire' Sunrise 786-508-5910; bar2hire.com is an unrelated UK company |
| Craft Bar Co. |  | Deerfield Beach |  | info@craft-barco.com | | email: own site via search, verify; Own site says South Florida but Deerfield Beach not confirmed; site also lists Craftbarco@outlook.com; phone 561-982-6326 |
| Cocktail Couture Mobile |  | Fort Lauderdale |  | shannon@cocktailcouturemobile.com | | email: own site via search; Owner Shannon's address, also on own FB; phone is 631 area code; other unrelated 'Cocktail Couture' businesses exist in MI/NC/KS |
| Mr Barrtenderr | mrbarrtenderr.com | South Florida |  | info@mrbarrtenderr.com | | email: own site via search, verify; Based in Jacksonville, FL (not South FL); pages cover Central/North FL |
| Boozy Bear Mobile Bartending | myboozybear.com | Tampa |  |  | |  |
| Encore Bartending Service | encorebartendingservice.com | Tampa |  |  | | licensed + insured |
| Deluxe Bartending Service | deluxebartendingservice.com | Tampa |  |  | |  |
| Tampa Bay Bartenders | tampabaybartenders.com | Tampa |  |  | |  |
| The Tap Nomad | thetapnomad.com | Tampa |  |  | | mobile bar |
| Hook Line & Drinker | hldrinker.com | Tampa |  |  | |  |

## 18. Ceremony music (7)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| The Elegant Harp | elegantharp.net | West Palm Beach |  | esther@elegantharp.net | | harp + string quartet; email: own site via search; Sole harpist Esther Underhay |
| Serenade Events | serenadeevents.com | South Florida |  | Info@SerenadeEvents.com | | strings; email: own site via search; National multi-city company (FL, NC, TX, etc.), not a local South FL business |
| Jade Strings | jadestrings.com | South Florida |  | info@jadestrings.com | | strings; email: own site via search, verify; based in Naples (SW Florida), not South Florida; site also lists contact@ and hello@jadestrings.com; NY 'Jade String Trio' is unrelated |
| Manhattan Music | manhattanmusic.com | South Florida |  | info@manhattanmusic.com | | email: own site via search, verify; contact page ~3.5 yrs old; Deerfield Beach; legal pages list htiano@gmail.com (personal-looking email: do not mail) |
| Jacksonville String Quartet |  | Jacksonville | 904-365-1400 |  | |  |
| Jacksonville Strings |  | Jacksonville | 904-235-9154 |  | |  |
| String Theory Music |  | Jacksonville Beach | 904-994-4542 |  | | **directory-only source** |

## 19. Stationery (20)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Lettered with Love |  | South Florida |  | janice@letteredwithlove.com | | calligraphy + signage; email: own site via search; sole calligrapher Janice, Miami/Hialeah; alt domain letteredwithlove.co shows janice@letteredwithlove.co |
| Dainty Hands Co |  | Miami Lakes |  |  | | calligraphy; no published email found 2026-10-23; no email found; WeddingWire phone 786-296-5185 |
| Calligraphy by Elaine |  | Miami Beach |  | CalligraphybyE@aol.com | | calligraphy; email: own site via search, verify; site looks old; Miami Beach addresses inconsistent across listings; cell 305-975-7781 |
| Carla Hagan Calligraphy and Design |  | South Florida |  | info@carlahagandesigns.com | | calligraphy; email: own site via search; West Palm Beach/Jupiter (Palm Beach County); same email on Facebook; not Carla Schall Designs |
| Fort Lauderdale Invitations |  | Fort Lauderdale |  | ftlinvitations@aol.com | | email: own site via search; also on own Facebook; addresses vary (Wilton Manors / NE 45th St) |
| Tuesday Grace Designs |  | Fort Lauderdale |  | chelsea@tuesdaygracedesigns.com | | email: own site via search; owner address published as business contact, also on Facebook; studio in Coconut Creek |
| Paper & Lace |  | Fort Lauderdale |  | hello@paperandlaceboutique.com | | email: own site via search; also on own Facebook |
| Calligraphy by YS |  | Miami |  |  | | **listed in both Miami and Hialeah - verify**; no published email found 2026-10-23; no email found; WeddingWire/Knot list Hialeah, phone 786-239-1431; ignore spam email in WeddingWire listing page |
| DMS Printing and Design |  | Miami |  |  | | no published email found 2026-10-23; Miami WeddingWire/Knot listings show no contact; dmsprintinganddesign.com is a Plano TX company (contact@thedms3.com) - do not use |
| Invites and Events |  | Plantation |  | jasmeet@invitesandevents.com | | email: own site via search; owner address on own contact page; older listing also shows invitesandevents@hotmail.com |
| Lucky Tusk |  | Oakland Park |  | hello@luckytusk.com | | metal invitations; email: own site via search; Etsy shop names alex@luckytusk.com for proofs |
| The Petite Acorn |  | Fort Lauderdale |  |  | | no published email found 2026-10-23; own contact page email masked in results; office 954-962-3141; addresses conflict |
| Miami Writes Co |  | Miami |  | info@miamiwrites.com | | calligraphy; email: own Facebook Page via search, verify; Address is on miamiwrites.com but site is miamiwritesco.com; may be old. Based Coral Gables (147 Alhambra Cir) |
| JN Calligraphy |  | Fort Lauderdale |  |  | | calligraphy; no published email found 2026-10-23; Only WeddingWire listing found (designer Jill), no email. lovelywriting561@gmail.com belongs to Calligraphy Chik, a different business |
| Pretty Little Letters |  | Fort Lauderdale |  |  | | engraving; no published email found 2026-10-23; The Knot listing only (Fort Lauderdale); no email surfaced |
| Kiki's Customized Creations |  | Miami |  | kiki.ccreations@gmail.com | | email: own listing via search, verify; Only source is a Wedding Style Society vendor listing. Instagram 'Kiki's Custom Creations' (help.kikiscustomcreations@gmail.com) may be a different business. LLC address Homestead |
| Tampa Calligraphy | tampacalligraphy.com | Tampa | 813-854-6100 |  | | envelope addressing |
| The Write Stuff |  | Tampa | 813-837-0400 |  | | **directory-only source** |
| Lili V. The Company |  | Tampa | 813-389-3691 |  | | **directory-only source** |
| Calligraphy by Cami | calligraphybycami.com | Jacksonville |  |  | |  |

## 20. Dance lessons (5)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Royal Wedding Dance |  | Miami |  |  | | 22 years choreography; no published email found 2026-10-23; Site royalweddingdance.com found; no email in results |
| Fajardo Elite Dance Academy |  | Miami |  | fajardoelitedance@gmail.com | | serves tri-county; email: own site via search; Based in Davie, not Miami (serves tri-county). Older address eliteinternationaldance@gmail.com seen on Facebook/directories |
| vON Dance | vondance.com | South Florida |  | vondance@msn.com | | email: own site via search, verify; Homepage indexed ~8 years ago; may be stale. Hallandale Beach |
| The Wedding Dance Studio | theweddingdancestudio.com | South Florida |  | info@theweddingdancestudio.com | | email: own site via search, verify; LOCATION MISMATCH: studio is in Jacksonville FL (904), not South Florida |
| Fred Astaire Dance Studios South Florida | fredastaire.com | South Florida |  | delraybeach@fredastaire.com | | **national franchise**; email: own site via search, verify; National franchise; no single South Florida contact. Delray Beach studio has wedding-dance page. Miami Beach (miamibeach@fredastaire.com) and Pinecrest (pinecrest@fredastaire.com) seen in page data only |

## 21. Live painter (1)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Carla Schall Live Event Painting | carlaschall.com | Florida |  |  | |  |

## 22. Dessert cart (9)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Glyk Gelato | glyk.com | Boca Raton | 561-609-4900 | info@glyk.com | | **listed Boca Raton but a Parkland address - verify**; email: own site via search; Own site lists Boca Raton (129 NW 13th St); older listings show Parkland |
| GelatoGo | gelatogo.net | Miami | 786-450-0477 | alessandro@gelatogo.net | | email: own site via search; Named-person address published as the business contact. Also operates in LA |
| The Gelato Bar | urbanicaevents.com | Fort Lauderdale |  | hello@urbanicaevents.com | | email: own site via search; Operated by Urbanica Luxury Events. Not Gelato&Co (Las Olas) |
| I Scream Gelato | iscream-gelato.com | Miami |  | inquiry@iscream-gelato.com | | email: own site via search; Shops on Lincoln Rd and Wynwood; may be a chain. iscreamgelatoinfo@gmail.com seen on a directory, unverified |
| HipPOPs | hippops.com | Miami |  | Info@HipPOPs.com | | dessert truck; email: own site via search |
| Banana Daddy | eatbananadaddy.com | Miami |  | info@eatbananadaddy.com | | electric dessert truck; email: own site via search; Also a storefront at 3415 NE 1st Ave Miami |
| AJ's Coffee Break |  | South Florida |  | info@ajscoffeebreak.com | | mobile coffee cart; email: own site via search; Davie/Southwest Ranches based |
| El Salvaje Food Trailer |  | Fort Lauderdale |  | elsalvajefoodtrailer@gmail.com | | email: own Facebook Page via search, verify; Based in Hialeah, not Fort Lauderdale. Savory (Cuban) food trailer, not dessert |
| JJ's Gelato & Coffee |  | Fort Lauderdale |  |  | | no published email found 2026-10-23; Only listing gives phone (786) 397-0987 and Instagram jjsgelatoandcoffee. JJ Cafe emails are a different business |

## 23. Jeweler (8)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Kirk Jewelers | kirkjewelers.com | Miami | 305-371-1321 | inquiry@kirkjewelers.com | | email: own site via search; kirk@kirkjewelers.com seen on Patek/Facebook/Nextdoor |
| Jae's Jewelers | jaesjewelers.com | Coral Gables | 305-443-7724 | info@jaesjewelers.com | | email: own site via search; jill@jaesjewelers.com (manager) seen on Chamber listing |
| Nemaro Jewelers | nemarojewelers.com | Miami | 305-358-4399 | sales@nemarojewelers.com | | email: own site via search, verify; MapQuest marks CLOSED; other sources look active. Older addresses seen: sales@nemaro.com, a.perez@nemaro.com |
| LC Rings | lcrings.com | Tampa | 813-447-5577 |  | | by appointment |
| Tampa Diamond Center | tampadiamondcenter.com | Tampa | 813-402-2696 |  | | cuts gems on site |
| Awesome Jewelry | awesomejewelrytampa.com | Tampa | 813-831-2419 |  | | family-owned since 1994 |
| Thurber Armstrong Private Jewelers | thurberarmstrongprivatejewelers.com | Tampa | 656-999-1997 |  | | 656 is a valid Tampa overlay |
| Florida Diamond Center | floridadiamondcenter.com | Holiday | 727-491-3344 |  | | GIA gemologist on site |

## 24. Decor (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Balloon World Events | myballoonworld.com | Fort Lauderdale | 954-702-6109 | events@myballoonworld.com | |  |
| DreamARK Events | dreamarkevents.com | Fort Lauderdale |  | info@dreamarkevents.com | | ceiling balloon decor; email: own site via search; also seen: DreamARKevents@gmail.com (Facebook), FL@dreamarkevents.com (Nextdoor) |
| Fashion Balloons | fashion-balloons.com | Miami |  | info@fashion-balloons.com | | email: own site via search, verify; email in site structured data; site uses 561 (West Palm) phone, Facebook tied to West Palm Beach; Miami may be a service-area page |
| Drapeworks | drapeworks.com | Miami |  | sales@drapeworks.com | | pipe + drape, ceiling draping; email: own site via search; based in Davie, not Miami; rentals@drapeworks.com for rentals |

## 25. Alterations (15)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Emma Couture & Alterations |  | Miami |  | emmasalterations@gmail.com | | email: own Facebook Page via search, verify; single source (Facebook); Coconut Grove |
| Marina Mella Tailoring | marinamellatailoring.com | Miami |  | marimellatailoring@gmail.com | | email: own site via search; spelling is 'marimella' (not marinamella) - as published on site and Facebook |
| Clothing Solutions |  | Weston |  | mrscindyduval@gmail.com | | also serves the Keys; email: own Facebook Page via search, verify; personal-name gmail listed on business FB page; BBB shows a different Clothing Solutions LLC (954-248-8996) |
| Needlestitch |  | Fort Lauderdale |  | info@needlestitch.net | | email: own site via search; in Wilton Manors |
| B&P Alterations |  | Fort Lauderdale |  | bpalterations@gmail.com | | email: own Facebook Page via search, verify; single source (Facebook); actually in Sunrise; multiple addresses/phones listed |
| Thread and Needle Alterations |  | Winter Park | 407-622-4411 |  | | also tuxedos |
| Diana's Bridal | bridalsbydiana.com | Tampa | 813-282-7371 |  | | alterations specialist |
| Bridal By Mina | bridalbymina.com | Tampa | 813-732-1762 |  | |  |
| Seamless Alterations Studio |  | Tampa | 813-389-0132 |  | |  |
| Ella's Alterations | ellasalterations.com | Tampa | 813-445-8894 |  | |  |
| Classic Stitch | sewingservicetampa.com | Tampa |  |  | |  |
| SuZann Designs | suzanndesigns.com | Clearwater |  |  | |  |
| AlterationsJax | alterationsjax.com | Jacksonville | 904-370-9178 |  | |  |
| Eva's Alterations |  | Jacksonville | 904-724-0900 |  | | bridal seamstress, 27 years |
| Kobzarina Tailor Shop | kobzarina.com | Jacksonville |  |  | |  |

## 26. Hora loca (7)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| J&G Entertainment | jandgentertainment.com | North Miami Beach | 305-677-2429 | info@jandgentertainment.com | | stilt walkers, Brazilian dancers, LED robots; email: own site via search, verify; found in homepage structured data, not visible contact text; rodrigo@ seen on Manta |
| Led Robot Miami | ledrobotsmiami.com | Miami Lakes | 954-530-6136 | info@ledrobotsmiami.com | | **number from a Facebook listing; 954 area code vs Miami address - verify**; email: own site via search, verify; site is a division of Power Parties, phone (786) 452-0187; FB page shows 954-530-6136 and says Fort Lauderdale |
| Blast Party Entertainment | blastpartyentertainmentllc.com | Miami |  | info@blastpe.com | | email: own site via search, verify; conflict: services page lists blastpartyentertainment@gmail.com; phones 305-776-6390 vs 862-291-1843 (NJ area code) |
| The Hora Loca Guys | thehoralocaguys.com | South Florida |  | thehoralocaguys@gmail.com | | also DJ + photo booth; email: own site via search; WeddingWire lists Fort Lauderdale |
| ArteVivo Dance Studio |  | Miami |  | artevivods@gmail.com | | dancers, drummers, percussionists; email: own site via search; dance studio; confirm they do event performers |
| Miami Superhero | miamisuperhero.com | Miami |  | miamisuperhero@hotmail.com | | email: own site via search; mostly kids party characters |
| The Party Characters | thepartycharacters.com | Miami |  | thepartycharacters@gmail.com | | email: own Facebook Page via search, verify; 800 number, multi-city brand; same gmail on New York Party Characters site; not confirmed on own site; kids-party focused |

## 27. Cigar roller (2)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Miami Cigar Entertainment | miamicigarentertainment.com | Miami | 845-549-8751 | Miamicigarentertainment@gmail.com | | **845 = New York Hudson Valley area code - verify**; email: own site via search; site uses 845 (NY) phone |
| Cigar Bella | cigarbella.com | Miami |  | Katrina@cigarbella.com | | email: own site via search, verify; national company (702 Las Vegas phone), Miami is one market; FB lists cigarbella@gmail.com |

## 28. Restrooms (6)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| A Royal Flush | aroyalflush.com | Miami |  | sales@aroyalflush.com | | **2yr-old listing - verify**; email: own site via search; HQ Bridgeport CT, FL office Boca Raton; not the same as Royal Restrooms |
| Coastal Mobile Restrooms | coastalmobilerestrooms.com | West Palm Beach |  | cmrtrentals@gmail.com | | email: own site via search |
| Royal Restrooms Florida | royalrestroomsfl.com | Fort Lauderdale |  | service@royalrestroomsfl.com | | ADA units; email: own site via search, verify; franchise main office is Micanopy (352) near Gainesville, statewide; Miami franchise (305-439-6061) separate, its email obscured |
| Jones Luxury Restrooms |  | Florida |  |  | |  |
| South Florida Restroom Trailers | southfloridarestroomtrailers.com | South Florida |  |  | | no published email found 2026-10-23; contact page has phone 863-801-9929 (central FL area code) and quote form only; info@southfloridatrailer.com is an unrelated boat-trailer company |
| Island Restrooms | islandrestrooms.com | Florida Keys |  | service@islandrestrooms.com | | also generators; email: own site via search; Tavernier; older islandrestrooms@gmail.com seen in 2024 press release |

## 29. Travel agent (13)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Grisel Velasco |  | Miami | 305-282-0809 | travelagencylove2travel@gmail.com | | destination weddings + honeymoons; email: own listing via search, verify; Love2Travel LLC; Travel Leaders agent profile only |
| Karrah Kazravan |  | Miami | 844-950-2143 | info@exploreeffortlessly.com | | honeymoons; email: own listing via search, verify; business: Explore Effortlessly (Nexion); from Travel Leaders/vacation.com agent listing |
| Mario Lopez |  | Hollywood | 954-330-1210 | Hello@destinationweddingsexpert.com | | destination weddings; email: own listing via search, verify; Destination Weddings Expert LLC; Travel Leaders profile lists mario@destinationweddingsexpert.com; hello@ from a wedding-group page; phone conflicts |
| Carolyn Drummond |  | Miramar | 305-432-5108 | carolyn@dvcweddings.com | | destination weddings; email: own listing via search, verify; Dream Vacations and Cruises; single source (Travel Leaders structured data) |
| Tie the Knot Abroad |  | Miami |  |  | | no published email found 2026-10-23; searched once: only WeddingWire listing (no email); said to be a subdivision of Air Projects; similar-name Tie the Knot Miami (officiant) is a different business |
| Anchored South Travel Services |  | Miami |  | hello@anchoredsouth.com | | email: own site via search, verify; LOCATION MISMATCH: own site gives office in Mexico Beach FL (850), panhandle; WeddingWire lists Miami. Brand name now 'Anchored South Travel Designers' |
| Luxevo Vacations |  | Miami |  | isabel@luxevovacations.com | | email: own listing via search, verify; Miami office email from WeddingWire listing only. Own site gives travel@luxevovacations.com (price-match) with Bradenton HQ; host agency network |
| Fairytale Getaways |  | Miami |  |  | | no published email found 2026-10-23; No email surfaced. Phone (305) 714-0414, site myfairytalegetaway.com, IG @myfairytalegetaway, owner Paola Queipo |
| Travel Adventures by Patrice |  | Miami |  |  | | no published email found 2026-10-23; only WeddingWire/Knot listings found, no contact details |
| Bailey's Luxury Travel |  | Miramar |  | baileysluxurytravel@gmail.com | | email: own Facebook Page via search; Miramar; owner Radika Bailey; site baileysluxurytravel.com |
| Cruise Planners - Christine Erwin |  | Fort Lauderdale |  | christine.erwin@cruiseplanners.com | | email: own site via search; Franchise agent; named-person address published as her business contact |
| Travelmation |  | Fort Lauderdale |  | info@travelmation.net | | email: own site via search; From privacy policy page; also on Facebook |
| The Vacation Group |  | South Florida |  | custserv@vacation.com | | email: own Facebook Page via search, verify; National consortium HQ in New Hampshire; generic customer-service address, no South Florida office contact |

## 30. Event staffing (2)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Ziva Staffing |  | Miami |  | info@zivastaffing.com | | bar staff, servers, banquet managers; email: own site via search |
| SoleMar Events & Waitstaff Services |  | Fort Lauderdale |  |  | | setup, service, cleanup; no published email found 2026-10-23; Punchbowl listing found but no email shown |

## 31. Valet parking (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Farber Parking | farberparking.com | South Florida |  | info@farberparking.com | | NPA-certified; email: own site via search; Boca Raton office |
| AV Valet Parking Miami | avvaletparkingmiami.com | Miami |  | Mfajardo@avvparking.com | | email: own site via search; Named-person address on avvparking.com domain published as contact. avvparking.com/contactus lists contact@avvparking.com with a Homestead address - possibly same/affiliated |
| Soflo Valet | soflovalet.com | Fort Lauderdale |  | joe@sofloparking.com | | email: own site via search, verify; Named-person address on a different domain (sofloparking.com); also on Manta |
| 717 Parking | 717parking.com | South Florida |  | support@717parking.com | | email: own site via search, verify; LOCATION: HQ in Tampa; large parking-management firm, general support inbox |

## 32. Security (2)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| FSO Guard | fsoguard.us | Miami |  | info@fsoguard.us | | licensed event security; email: own site via search; Also security@fsoguard.us on newer pages. Address conflict (Fort Lauderdale vs Hollywood) |
| IGS Security | igssecurityusa.com | Miami |  | Eyal@IGSsecurityUSA.com | | FDACS-certified; email: own site via search, verify; From parent site igssecurity.com page ~4 years old; Boca Raton office. No email on igssecurityusa.com; phone 561-465-5911 |

## 33. AV production (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Mia Sound Production | miasoundproduction.com | Miami |  | info@miasoundproduction.com | | email: own site via search; Not MIA Production (inflatables) |
| Master Sound Productions | mastersoundpro.com | Miami |  | lazaro@mastersoundpro.com | | serves the Keys too; email: own site via search; Named-person address in site structured data. Facebook shows info@mastersoundpro.com |
| Monster Sound Productions |  | Miami |  | info@monstersoundpro.com | | email: own site via search; also on Facebook; Doral office; not Monster Sound and Picture (Las Vegas) |
| SoFlo Studio | soflostudio.com | Miami |  | info@soflostudio.com | | email: own site via search; located in Sunrise, FL |

## 34. Fireworks (7)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Fireworks Over Miami | fireworksovermiami.com | Miami | 305-305-0191 | lutgardomp@gmail.com | | barges for waterfront venues; email: own site via search, verify; Yelp marks Miami location CLOSED (Feb 2026) though site active; personal-style gmail but published on own site |
| Firepower Displays | firepowerdisplays.com | Miami | 305-258-8820 | info@firepowerdisplays.com | | handles permits; email: own site via search; Yellow Pages also shows sales@firepowerdisplays.com |
| My 3 Sons Fireworks | 3sonspyro.com | Jupiter | 561-210-5176 | josh@3sonspyro.com | | PGI certified; email: own site via search; older contact page shows josh@mythreesonsfireworks.com |
| Pyro Pros Fireworks | pyroprosfl.com | Miami |  | pyroprosfl@gmail.com | | email: own site via search, verify; phone 321-947-7371 is Space Coast/Orlando area code; Miami may be a service-area page |
| Add Fire | addfire.com | Miami |  | bill@addfire.com | | shot from own barges; email: own site via search; owner address published on own site; phones differ (305-895-2231 site vs 305-592-7979 Yelp) |
| FX Pro | fireworkspros.com | Florida |  |  | |  |
| Ghost Coast Entertainment | ghostcoastentertainment.com | Florida |  |  | |  |











---

## What to do with this

1. **Call the 430 above, unflagged ones first.** The only step waiting on
   nothing. Confirm the business, ask for the best address, and attach it on
   `/admin/claims` — no email of ours is sent, so this works today.
2. **Resolve the `TERMS.md` mailing address.** Nothing can be *emailed* until
   then. The phone-claim flow is the way around it, not a replacement for it:
   fixing the TODO unblocks the other 501 rows.
3. **Then photographers and florists** — the top two categories, 203 names.
   Open each site, take the published contact email, fill the row. This needs
   the egress block lifted (see the top of this file) or a human with a
   browser.
4. **Create claim listings in small batches** as rows complete, using the
   `create_claimable_listing` call in `VENDOR-OUTREACH.md`. Copy each token
   immediately: only its SHA-256 is stored, so a lost link cannot be recovered —
   delete the row and make a new listing.
5. **Send 20–30 a day, hand-written**, one metro at a time. Claim links expire
   after 60 days, so do not mint more than you will actually send inside that
   window. Minting all 931 at once creates 931 credentials and 931 expiries.

   **This no longer applies: 930 of the 931 are imported.** Every row below
   except `Marry Me Mendez` is in the database as a listing whose claim token
   was generated and discarded, so the email-match path on `/admin/claims` is
   the *only* route for all of them — there is no link to send to anyone.
   710 are published and visible on `/vendors`; the rest are drafts, held
   because they have neither a phone nor a website and so give a couple no way
   to make contact.
6. **One follow-up after 5–7 days, then stop permanently.**
7. **Ask the ones who publish to link back.** Per the flywheel in
   `COUPLES-ACQUISITION.md`, that inbound link is worth more to the couples side
   than the listing is to the vendor.

Throw this file away once there are 50 published listings in one metro — at that
point the pitch changes from "help me start this" to "your competitors are here".
