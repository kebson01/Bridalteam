# Florida vendor prospects

A research shortlist for the founding-vendor outreach in `VENDOR-OUTREACH.md`.
760 real businesses across 34 categories and three metros -- South
Florida, Orlando and Tampa Bay -- sourced from public web search. South Florida
came first and is still the deepest at 333 published listings; Orlando and Tampa
Bay were added on 2026-10-19 and now stand at 103 published each. Later passes
also filled gaps in earlier rows, so a row's data may be newer than the row.

**This file is a record of what is in the database, not a staging area.** That
is a reversal from how it started, and it matters: 759 of these 760 rows are
live listings created by `create_claimable_listing`, and **539 of them are
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

## Read this before using it

Two things are missing, and the first one is why there is a file here instead of
rows in the database.

**1. Almost no contact emails — 22 of 760.** The sessions that built this could
run web *search* but could not open the vendors' own websites; the network egress
proxy blocked every one, on both passes. So every name, URL, address and phone
below came from a search result rather than from first-party verification.

The thorough search mode quotes contact details out of the pages it reads, and
every one of the 22 addresses came in that way -- a search snippet, not a
verified fact.
**Four of the 22 are flagged `personal-looking email — do not mail`**: a
solo officiant's own `gmail`/`comcast` address is not a business contact point,
and `VENDOR-OUTREACH.md` is explicit — *the business's own published contact
address, never a scraped personal one.* Those four are listed so nobody
re-researches them, not so they can be mailed.

For the remaining 738 rows the email still has to be gathered by hand, from each
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
  section above; 291 of the 760 qualify.
- **Email** — empty on 738 of 760 rows. Fill from the vendor's own site. Where
  one is present it came from a search snippet, so confirm it before use.
- **Outcome** — also carries research flags (`verify`, `do not mail`,
  `corporate`) until there is a real outcome to record.
- **Sent / Outcome** — the tracking `VENDOR-OUTREACH.md` asks for. Record a "no"
  and a "no reply" differently: a "no" is permanent.

Verify before you contact. A search snippet is a lead, not a fact — check the
business still trades, still does weddings, and is in the metro before you spend
a claim link on it.

## Call these 291 first — the widest unblocked path

Every table below has a **Phone** column, and 291 of the 760 rows have a number
because a search result published one. Those 291 can be contacted **today**:

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
| LoveLee Bakeshop | Cake | 954-715-2050 |  |
| We Take The Cake | Cake | 954-764-2253 |  |
| Panchis Bakery | Cake | 754-600-3370 |  |
| La Cake Cafe | Cake | 754-779-2965 |  |
| Stackd Cake Studio | Cake | 941-465-8108 | no storefront; serves Sarasota + Tampa Bay |
| 4R Bakery and Specialty Cakes | Cake | 407-543-8589 |  |
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
| Florida Music Group | Band | 772-924-9302 | **second number 772-781-7415 published - verify** |
| Paul Vesco Band | Band | 407-466-5781 |  |
| CK Entertainment | Band | 954-436-1230 |  |
| Sekond Nature | Band | 954-607-8334 |  |
| DeLeon Entertainment | Band | 813-933-3924 |  |
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
| Three Sixty Photo Booths Orlando | Photo booth | 407-440-0242 | 360 booths + uplighting |
| Glowshot | Photo booth | 305-303-5740 |  |
| DEMM Photo Booths | Photo booth | 813-214-8098 | 360 video booth |
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
| Arc Divine | Rentals | 954-319-6126 | chuppah + arch rental; resolves the unattributed 954-319-6126 seen earlier |
| A Linen Valley | Rentals | 727-541-5329 | **directory did not state the service; name implies linen rental - verify** |
| FH Events | Rentals | 813-390-9371 | Tampa + Orlando; furniture + floral |
| Allure Party Rentals | Rentals | 954-598-9595 |  |
| Rent Anything Orlando | Rentals | 407-502-3741 |  |
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

## 1. Photographers (82)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Deivis Archbold Photography | deivisarchbold.com | Fort Lauderdale (6555 Power Line Rd) | 954-945-8116 |  | |  |
| Little's Photography | littlesphotography.com | Fort Lauderdale (2552 N Federal Hwy) | 954-563-0444 |  | | weddings one of several services |
| Michael Murphy Photographic Imaging |  | Fort Lauderdale (261 NE 32nd Ct) | 877-564-8555 |  | | event photographer; toll-free line |
| Joey G Photography | joeygphoto.com | Hollywood | 954-986-4455 | joeygphoto@yahoo.com | |  |
| Marco Palmieri Photographer |  | Hollywood | 954-471-5870 |  | | **directory listing inconsistent - verify** |
| Two Gems Photography |  | Delray Beach |  |  | |  |
| Alizee Pechmajou Photography |  | Jupiter |  |  | |  |
| Topflash Photography & Studio |  | Boynton Beach |  |  | |  |
| What A Natural Photography |  | Delray Beach |  |  | |  |
| Starfish Studios Photography and Films |  | Palm Beach County |  |  | |  |
| Abigail Vigoa Photography |  | Doral |  |  | |  |
| Victoria Machin Photography |  | Doral |  |  | |  |
| Michelle VanTine Photography |  | Doral |  |  | |  |
| Rey Zamora Photography |  | Doral |  |  | |  |
| Courtney Jones Photography |  | Doral |  |  | |  |
| Celeste Wedding Photography | celesteweddingphotography.com | Miami |  |  | |  |
| Adriana Samanez Weddings |  | Doral |  |  | |  |
| Marcelin Photography |  | Hialeah |  |  | |  |
| Allison Studios |  | Hialeah |  |  | |  |
| Supanik Photography | supanikphotography.com | Doral | 786-385-1100 |  | |  |
| Lopez Falcon | lopezfalcon.com | Coral Gables |  |  | |  |
| Robi Studio | robistudio.com | Miami |  |  | |  |
| Ramoneda Photo |  | Miami |  |  | |  |
| Alfaaz Photography | alfaazphotography.com | South Florida |  |  | | Indian weddings |
| Channa Photography |  | Fort Lauderdale |  |  | | **5+yr old listing - verify** |
| Infinite Loop Photography |  | Fort Lauderdale |  |  | | **5+yr old listing - verify** |
| Maloman Boutique Photography |  | Fort Lauderdale |  |  | | **5+yr old listing - verify** |
| Haring Photography |  | South Florida |  |  | | **5+yr old listing - verify** |
| db Wolin Photography |  | West Palm Beach | 561-762-5349 |  | |  |
| Lukas G Photography |  | West Palm Beach | 561-246-2403 |  | |  |
| Photography South Florida |  | Palm Beach | 561-951-8800 |  | |  |
| Clickety Chicks |  | West Palm Beach | 561-662-0455 |  | |  |
| Appeal Photography |  | West Palm Beach | 561-478-7340 |  | |  |
| Alan Luby Photography |  | West Palm Beach | 561-577-9246 |  | |  |
| Chris Joriann Photography |  | Palm Beach Gardens | 561-246-9271 |  | | **name/number pairing inferred from page layout - verify** |
| Frank Donnino Photography |  | Palm Beach Gardens | 561-776-0099 |  | | **name/number pairing inferred from page layout - verify** |
| Care Studios | careweddings.com | Key Largo | 305-360-2636 |  | |  |
| Jannette De Llanos Photography | jannettedellanosphotography.com | Key Largo |  |  | |  |
| Barbara Knowles Wedding Photography |  | Islamorada |  |  | | also planning |
| Maddness Photography | maddnessphotography.com | Tampa | 727-418-9434 |  | |  |
|---|---|---|---|---|---|---|
| Lenisse Komatsu Photography | lenisse.com | Fort Lauderdale | | | | |
| Couture Bridal Photography | couturebridalphotography.com | Boca Raton (137 E Palmetto Park Rd) | 954-399-0741 | mail@couturebridalphotography.com | | |
| Wanderlust Studios | wanderluststudiosfl.com | Fort Lauderdale | | | | |
| Melanie Anne Photography | melanieannephotography.com | Fort Lauderdale | | | | |
| La Vie Studios | laviestudios.com | Miami | | | | |
| Michelle Elyse Photography | michelleelysephotography.com | Miami | | | | |
| EP Photos | epphotos.studio | Miami | | | | |
| Kolour Haus | kolourhaus.com | Miami | | | | |
| Jessica Vilchez Photo | jessicavilchez.com | Miami / Palm Beach | | | | |
| LeFever Photo | lefeverphoto.net | Palm Beach | | | | |
| Poirier Wedding Photography | poirierweddingphotography.com | Palm Beach / Jupiter | | | | |
| Boogietek Photo+Cinema | boogietek.com | Pembroke Pines | | | | |
| Mark Salner Photography | marksalnerphotography.com | West Palm Beach | | | | |
| Vanessa + Johnny | vanessaandjohnny.com | South Florida | 954-417-2193 | hello@vanessaandjohnny.com | | **was published as 310-819-6544 (Los Angeles); a later source gave this local number** |
| Bruna Bastos Photography | | Boca Raton (3601 N Dixie Hwy) | | | | |
| Kenneth Appelbaum Photography | | Boca Raton (121 NW 43rd St) | | | | |
| Beautiful Memories Studio | | Fort Lauderdale | | | | |
| Andrea Harborne Photography | | Fort Lauderdale | | | | |
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

## 2. Videographers (28)

Vanessa + Johnny and Boogietek above shoot both — approach once, not twice.

| Business | Website | City | Phone | Email | Sent | Outcome |
| Marksman Visuals |  | Coconut Creek |  |  | |  |
| PRIMEUS Photography & Video |  | Miami |  |  | |  |
| Videography by Cristina |  | Sunrise |  |  | |  |
| Bells & Whistles Photography + Videography |  | Miami |  |  | |  |
| Candid Studios | candidstudios.net | Miami | 844-522-6343 |  | |  |
| Default Estudios |  | Coral Gables | 786-380-9305 |  | |  |
| Straightawaymovies |  | Coral Gables | 305-793-6036 |  | |  |
| VM Productions |  | Miami | 305-239-9555 |  | |  |
| Shutter & Sound | shutterandsound.com | Miami Beach | 800-841-3990 |  | | **site gives 800-841-3990; directories give 443-449-6812 - verify** |
| Skyview Motions | skyviewmotions.com | Fort Lauderdale |  |  | | drone |
| Florida Drone Operators | floridadroneoperators.com | Fort Lauderdale |  |  | | drone; also serves the Keys |
| Global Filmz | globalfilmz.com | Miami | 888-653-2688 |  | | drone; **page ~3yr old - verify** |
| Steven Jim Films |  | Tampa |  |  | |  |
| 360 Photo Entertainment |  | Tampa |  |  | | also 360 booth + photography |
|---|---|---|---|---|---|---|
| Andreo Studio | andreostudio.com | Miami / West Palm Beach | | | | |
| Megaset Weddings | megasetphotography.com | South Florida | | | | |
| Quality Media FL | qualitymediafl.com | Boca Raton | | | | |
| South Florida Wedding Studio | southfloridaweddingstudio.com | South Florida | 954-778-2267 | | | |
| A Creation Films | acreationfilms.com | Miami | 305-928-8685 | hello@acreationfilms.com | | |
| Until Forever Photography | untilforeverphotography.com | Fort Lauderdale | | | | |
| Rimas Films | rimasfilms.com | Miami | | | | |
| Aktion Productions | aktionproductions.com | Orlando | 407-917-5720 |  | |  |
| Elite Video of Orlando |  | Orlando | 407-504-1941 |  | |  |
| Orlando Video Production Company | orlandovideoproductioncompany.com | Orlando | 321-529-1741 |  | |  |
| Far Reach Studios | farreachstudios.com | Orlando |  |  | | **786 area code vs Orlando, phone withheld** |
| DeMarco Films |  | Orlando | 407-797-6695 |  | | **directory-only source** |
| Imprint Cinema |  | Orlando | 407-504-1290 |  | | **directory-only source** |
| Luxe Filmography |  | Lake Mary | 407-821-7992 |  | | **directory-only source** |

## 3. Florists (63)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Flowers Unveiled | flowersunveiled.com | Fort Lauderdale (14310 SW 17th St) | 954-806-8406 | hello@flowersunveiled.com | |  |
| Cortez Event Agency | cortezeventagency.net | Doral (10817 NW 29th St) | 786-983-7092 | cortezeventagency@gmail.com | | event agency, not florist-only |
| Beautiful Kreations |  | Fort Lauderdale | 954-933-7530 |  | | from a Carats & Cake listing |
| Concept Flowers |  | Miami | 305-300-4758 |  | | wedding focus unconfirmed |
| Jose Graterol Designs |  | Miami | 305-788-0562 |  | | wedding focus unconfirmed |
| Mint Floral Studio |  | North Miami Beach |  |  | |  |
| Petal Productions |  | Miami |  |  | |  |
| La Feterie by Juliana Schiffer |  | Miami |  |  | |  |
| Maison la Fleur |  | Aventura / Boca Raton |  |  | |  |
| Lush Celebrations |  | Fort Lauderdale |  |  | |  |
| J & J Flowers and Gift Shop |  | Hollywood |  |  | |  |
| Petals & Stems |  | Hollywood |  |  | |  |
| Kish Events & Decor |  | Boynton Beach |  |  | |  |
| Two Gardenias by Mary |  | Boynton Beach |  |  | |  |
| Creative Florals |  | Jupiter |  |  | |  |
| Heirloom Rosie |  | Jupiter |  |  | |  |
| Wildflowers of Parkland | wildflowersofparkland.com | Coral Springs | 954-752-6999 |  | |  |
| The Indian Wedding Decor Company | indianweddingdecorator.com | Miami |  |  | | mandap + decor |
| Orange Blossoms Florals and Event Styling | orangeblossomsflorals.com | West Palm Beach | 561-568-0528 |  | |  |
| Wellington Florist | wellingtonflorist.com | Wellington | 561-333-4441 |  | |  |
| Beldens Florist | beldensflorist.com | West Palm Beach | 561-832-2871 |  | |  |
| Twice the Style | twicethestyle.net | West Palm Beach | 561-939-9589 |  | |  |
| Xquisite Events Production | xefla.com | West Palm Beach | 561-988-9798 |  | |  |
| Floral Fantasy of the Keys | floralfantasyweddings.com | Islamorada | 305-664-1063 |  | |  |
| Key Largo Flowers & Gifts | keylargoflorist.com | Key Largo | 305-451-3702 |  | |  |
| Island Blooms | islandblooms.com | Key Largo | 305-304-3504 |  | | upper Keys |
| Flowers by J&J |  | Marathon | 305-743-5459 |  | |  |
| Kutchey's Flowers |  | Key West | 305-292-8181 |  | |  |
| Milan Event Floral & Decor |  | Key West | 305-735-4749 |  | |  |
| Fairbanks Florist |  | Winter Park |  |  | |  |
| Ian Tafoya Designs |  | Winter Park |  |  | |  |
| Atmospheres of Winter Park |  | Winter Park |  |  | |  |
| Apple Blossom Florist & Gifts |  | Winter Park |  |  | |  |
|---|---|---|---|---|---|---|
| Bayfront Floral & Event Design | bayfrontfloral.com | Fort Lauderdale (3414 Griffin Rd) | 954-981-1024 | | | |
| Saucha Floral Design | sauchafloraldesign.com | Fort Lauderdale (2209 NE 54th St) | | | | |
| Coco and Jojo Florals | cocoandjojoflorals.com | Fort Lauderdale | | | | |
| Victoria Park Flower Studio | victoriaparkflowers.com | Fort Lauderdale (1948 E Sunrise Blvd) | | | | |
| La Fleur Florals & Events | lafleurfloralsandevents.com | Fort Lauderdale | | | | |
| A Marc In Design | amarcindesign.com | Fort Lauderdale | | | | |
| Bashful Daisy Florist | bashfuldaisyflorist.com | Fort Lauderdale | | | | |
| La Fleur Bijou | lafleurbijou.com | Fort Lauderdale | | | | |
| Art of Petals | artofpetals.com | Fort Lauderdale | | | | |
| Fort Lauderdale Florist | fortlauderdaleflorist.com | Fort Lauderdale | | | | |
| Aura Design Flowers | auradesignflowers.com | Miami | | | | |
| Taylor Event Design | tayloreventdesigns.com | Miami | | | | |
| Luxury Flowers Miami | luxuryflowersmiami.com | Miami | | | | |
| Neroli Blume | neroliblume.com | Miami | | | | |
| Nerys Flowers | nerysflowers.com | Miami | | | | |
| Fleur de Marsca | fleurdemarsca.com | South Florida | | | | |
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

## 4. Cake & dessert (33)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Edda's Cake Designs |  | Miami |  |  | | trading since 1978 |
| Lamod Bakery |  | Miami |  |  | |  |
| Chef Marian |  | Miami |  |  | |  |
| The Sweet House Bakery |  | Fort Lauderdale |  |  | |  |
| Sweet Guilt by Angelica |  | Fort Lauderdale |  |  | |  |
| Paty's Bakery |  | Boca Raton |  |  | |  |
| SugarChef |  | Delray Beach |  |  | |  |
| Florida Sugar Treats |  | Tamarac |  |  | |  |
| Forget Me Not Cake Shop |  | Hobe Sound |  |  | | outside the metro - verify |
| Gallery of Cakes |  | Aventura |  |  | |  |
| Two to Cake |  | Aventura |  |  | |  |
| Ossi's Bake Shop |  | Aventura |  |  | |  |
| Chefness Bakery |  | Aventura |  |  | |  |
| Paula's Bake Shop |  | Aventura |  |  | |  |
| Monicakes Sweets & Dreams |  | Tampa |  |  | |  |
|---|---|---|---|---|---|---|
| LoveLee Bakeshop | instagram.com/loveleebakeshop | Fort Lauderdale (603 NE 13th St) | 954-715-2050 | | | |
| We Take The Cake | | Fort Lauderdale (1211 NE 9th Ave) | 954-764-2253 | | | |
| Panchis Bakery | | Fort Lauderdale (2726 Davie Blvd) | 754-600-3370 | | | |
| La Cake Cafe | | Fort Lauderdale (2809 E Commercial Blvd) | 754-779-2965 | | | |
| New River Cafe and Bakery | newrivercafeandbakery.com | Fort Lauderdale | | | | |
| Dominiques Couture Cakes | | Fort Lauderdale | | | | |
| Mood 4 Cakes | mood4cakes.com | Davie | | | | |
| Elegant Temptations | eleganttemptations.com | Miami | | | | |
| Johnson's Custom Cakes | | South Florida | | | | |
| Stackd Cake Studio | stackdcakes.com | Ellenton | 941-465-8108 |  | | no storefront; serves Sarasota + Tampa Bay |
| Chantilly Cakes | chantillycakes.com | Clearwater |  |  | |  |
| Alessi Bakery | alessibakery.com | Tampa |  |  | | est. 1912 |
| The Cake Girl | thecakegirl.com | Tampa |  |  | |  |
| The Artistic Whisk | theartisticwhisk.com | St Petersburg |  |  | |  |
| Caketastic | caketasticonline.net | Tampa |  |  | |  |
| 4R Bakery and Specialty Cakes |  | Winter Park | 407-543-8589 |  | |  |
| The Glass Knife | theglassknife.com | Winter Park |  |  | | tastings by appointment |
| Scotchie's Custom Cakes | scotchiescakes.com | Winter Park |  |  | |  |

## 5. DJs (46)

| Business | Website | City | Phone | Email | Sent | Outcome |
| The Mix DJs | themixdjs.com | Miami / Fort Lauderdale / WPB |  |  | |  |
| Event Factor | theeventfactor.com | Miami |  |  | |  |
| Pizzle Productions |  | Pembroke Pines |  |  | |  |
| Legendary Sounds |  | Pembroke Pines |  |  | |  |
| DJ Juice Holdings |  | Pembroke Pines |  |  | |  |
| Marvelous Entertainment |  | Miramar |  |  | |  |
| A&A Musik |  | Miramar |  |  | |  |
| LIVE305 Entertainment |  | Hollywood |  |  | |  |
| Palm Beach Party DJ | palmbeachpartydj.com | Wellington | 561-285-2640 |  | | **1600-day-old source - verify** |
| DJ Javier Cabal & Event Services |  | Miami | 786-708-0848 |  | |  |
| Zeta Event Productions |  | Miami | 954-732-1350 |  | | **second number 786-452-8742 published - verify** |
| Fiesta Time Entertainment |  | South Florida |  |  | | serves the Keys too; number was masked in the listing |
| Rhythm City Productions |  | Hollywood |  |  | | 30+ years; number was masked in the listing |
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
| A1A DJs | a1adjs.com | South Florida | 954-531-8146 | | | |
| All Events DJ Services | alleventsdjservices.com | South Florida | 954-290-6032 | | | |
| Xpress Entertainment | xpressdjs.com | Miami / Fort Lauderdale | | | | |
| Edifying Beats | edifyingbeats.com | South Florida | | | | |
| Vision DJs | visiondjs.com | South Florida | 954-418-2203 | info@visiondjs.com | | |
| Deco DJs | decodjs.com | South Florida | | | | |
| DJ AJ Falcon | djajfalcon.com | Miami | | | | |
| Power Parties | powerparties.com | Miami / Fort Lauderdale | | | | |
| NYX Events | nyxevents.com | Boca Raton | | | | |
| Masso Entertainment | massoentertainment.com | West Palm Beach | | | | |
| Vivid Source Events | vividsourceevents.com | Palm Beach County | | | | |
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

## 6. Bands & live music (30)

| Business | Website | City | Phone | Email | Sent | Outcome |
| FM Band Miami |  | Miami |  |  | |  |
| Bay Kings Band |  | South Florida |  |  | |  |
| Shane Duncan Band |  | Fort Lauderdale |  |  | |  |
| AAMusicians |  | Miami |  |  | |  |
| Inner Music Management |  | Miami |  |  | |  |
| Sunbeat Entertainment |  | Miami |  |  | |  |
| La Nota Band |  | Miami |  |  | |  |
| Florida Music Group | floridamusicgroup.com | Miami | 772-924-9302 |  | | **second number 772-781-7415 published - verify** |
| The Sparkle Band | thesparkleband.com | Miami |  |  | | **646 = New York area code - verify local presence** |
| Louis Pettinelli Entertainment |  | Miami |  |  | |  |
| Mercier's Music |  | Miami |  |  | |  |
| Mariachi los Mensajeros |  | Miami |  |  | |  |
| Mariachi Fiesta Grande |  | Miami |  |  | |  |
| Mariachi Mexico 88 |  | Miami |  |  | |  |
| Mariachi Aventureros |  | Miami |  |  | |  |
| Hermanos Mora Arriaga | hermanosmoraarriaga.com | Fort Lauderdale |  |  | | mariachi |
| Fondo Blanco Band |  | Miami |  |  | | **15-month-old listing - verify** |
| Caesar Vera y El Sexteto Nuevoson |  | Miami |  |  | | salsa |
| Kenny Quintero Y Su Orquesta Brava |  | Miami |  |  | |  |
| Paul Vesco Band | paulvesco.com | Orlando | 407-466-5781 |  | |  |
| Matt Winter Band | mattwinterband.com | Orlando |  |  | |  |
|---|---|---|---|---|---|---|
| CK Entertainment | ckentertainmentinc.com | South Florida | 954-436-1230 | | | |
| Sekond Nature | sekondnature.com | Fort Lauderdale | 954-607-8334 | | | |
| The Swooners | theswooners.com | South Florida | | | | |
| Heatwave Band | heatwavemusic.com | South Florida | | | | |
| Private Property Band | privatepropertyband.com | Miami / Fort Lauderdale | | | | |
| Haviv Entertainment | shlomohaviv.com | Miami / Fort Lauderdale | | | | |
| Joe Farren Live Music & DJ Services |  | St Petersburg |  |  | |  |
| DeLeon Entertainment | deleonentertainment.com | Tampa | 813-933-3924 |  | |  |
| Strings Attached | stringsattachedfl.com | Tampa |  |  | | **941 area code vs Tampa, phone withheld** |

## 7. Officiants (47)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Just Married by Rosy | justmarriedbyrosy.com | Miami | 305-610-0308 | rosyfigueroa7@gmail.com | | **personal-looking email - do not mail** |
| Patti Roman |  | Miami / Cutler Bay | 305-283-7647 | rainbowpatti2020@gmail.com | | **personal-looking email - do not mail** |
| Eddie Rodriguez |  | Miami | 305-596-1810 |  | | Eventective listing |
| Marry Me Mendez |  | Miami | 305-439-5553 |  | | **may be the same business as Marry Me, LLC below - check before importing** |
| SosFloWeddings |  | Miami Beach | 305-807-3898 |  | | Eventective listing |
| The Officiants |  | Fort Lauderdale | 800-354-4990 |  | | team led by Dominic Church |
| Mitchell Cohen |  | Fort Lauderdale | 954-757-0083 |  | | Eventective listing |
| Hey Reverend |  | Fort Lauderdale | 604-574-7731 |  | | **604 = British Columbia, not FL - verify** |
| Terri Golden |  | Palm Beach / Broward | 561-685-9038 | goldt3@comcast.net | | **personal-looking email - do not mail** |
| Cantor Ann Turnoff | cantorannturnoff.com | Palm Beach County | 561-445-8914 |  | | stale directory - verify |
| Cantor Ellen Stettner | yourpersonalclergy.com | Palm Beach County | 561-213-1277 |  | | stale directory - verify |
| Ceremonies by Cindy | ceremoniesbycindy.com | Palm Beach County | 954-781-8822 |  | | stale directory - verify |
| Florida Weddings by Cecilia | floridaweddingsbycecilia.com | Palm Beach County | 561-231-0043 |  | | stale directory - verify |
| Gracefully Wed Events | gracefullywedevents.com | Palm Beach County | 561-532-7919 |  | | stale directory - verify |
| Modern Love South Florida |  | Palm Beach County | 561-401-3072 |  | | stale directory - verify |
| Love Unions |  | Palm Beach County | 561-504-5107 |  | | stale directory - verify |
| Liz Oliver, Ordained Minister |  | Palm Beach County |  | lizoliver914@gmail.com | | **personal-looking email - do not mail** |
| Eltard "Elta" Alexis |  | Fort Lauderdale |  |  | |  |
| The Officiant FLA (Judge Rob) |  | Davie |  |  | |  |
| HeartsFlow |  | Sunrise |  |  | |  |
| The Vow Experience |  | Davie |  |  | |  |
| Rabbi-Cantor Gaston Bogomolni |  | Davie |  |  | |  |
| Wedding Ceremonies by Ketty Urbay | weddingceremoniesbyketty.com | Miami |  |  | |  |
| Souls United Orlando |  | Orlando |  |  | |  |
| Steven Bechtel |  | Winter Park |  |  | |  |
| Joanne Zito |  | Winter Park |  |  | |  |
| Sensational Ceremonies | sensationalceremonies.com | Orlando |  |  | | Lon Tosi |
|---|---|---|---|---|---|---|
| All Faith Ministry | allfaithministry.com | Fort Lauderdale | | | | |
| Wedding Officiant Fort Lauderdale | weddingofficiantfortlauderdale.com | Fort Lauderdale | 954-240-6234 | | | |
| Weddings by Lowell | weddingsbylowell.com | South Florida | | | | |
| From Engaged To Married | fromengagedtomarried.com | South Florida | | | | |
| South Florida Wedding Officiant & Notary | southfloridaweddingofficiantnotary.com | South Florida | | | | |
| Rainbow Notary & Nuptials | rainbownotaryandnuptials.com | Miami / Fort Lauderdale | 954-579-3953 | southfloridarainbows@gmail.com | | |
| Just UnI Weddings | | South Florida | | | | |
| Marry Me, LLC | | South Florida | | | | |
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

## 8. Hair & makeup (40)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Tashy Marie Beauty | tashymariebeauty.com | South Florida |  |  | | page ~2yr old - verify |
| Divine Beauty Artists | divinebeautyartists.com | Miami / Fort Lauderdale |  |  | |  |
| Kiss This Makeup | kissthismakeup.com | South Florida |  |  | | team of 85, mobile |
| Aimee Beauty Co |  | Miami |  |  | |  |
| Not Just Blonde Studio (Alissa Westcott) |  | South Florida |  |  | |  |
| Coastal Pearl Beauty |  | South Florida |  |  | |  |
| FeNom Salon |  | Aventura |  |  | |  |
| Beauty Arquitek |  | Aventura |  |  | |  |
| The Changing Room |  | North Miami Beach |  |  | |  |
| Wondrous Look | wondrouslook.com | Miami | 305-890-4778 |  | |  |
| Beauty Studio | beautystudioinc.com | Miami |  |  | | mobile |
| Mari D. MUA | maridmua.com | Miami |  |  | | Brickell studio |
| Miami Beach Glam | miamibeachglam.com | Miami Beach |  |  | |  |
| Art of Hair by Claudia |  | Miami |  |  | |  |
| Nova MakeUp and Hair |  | Miami |  |  | |  |
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
| Robbin Junnola Beauty | robbinjunnolabeauty.com | Fort Lauderdale (6278 N Federal Hwy #144) | | | | |
| Hans on Beauty | hansonbeauty.com | South Florida | 954-667-9940 | | | |
| Faces by April | facesbyapril.com | Coral Springs / Fort Lauderdale | | | | |
| Jules Fleming Artistry | julesflemingartistry.com | Fort Lauderdale | | | | |
| Courtney Christopherson Glamour Group | courtneychristopherson.com | Boca Raton / Palm Beach | 561-289-2138 | | | |
| PriscillaM Beauty | priscillambeauty.com | South Florida | | | | |
| Glam By Carmen | glambycarmen.info | South Florida | | | | |
| The Makeup Team | themakeupteam.us | Tampa | 813-694-3646 |  | | on-location Tampa/Clearwater/St Pete |
| Beautiful You Hair & Makeup | beautifulyoumakeup.net | Tampa | 813-503-9936 |  | | text preferred |
| Glam To Be | glamtobe.com | Tampa |  |  | |  |
| Savannah Olivia Beauty | savannaholiviabeauty.com | Tampa |  |  | |  |
| Gulf Beach Bride | gulfbeachbride.com | Tampa |  |  | | beach weddings |
| About Face Design Team | aboutfacedesignteam.com | Orlando | 407-647-2700 |  | | **source 449 days old** |
| Laura Reynolds Artistry | laurareynoldsartistry.com | Orlando |  |  | |  |
| The Glam Room Orlando | theglamroomorlando.com | Orlando |  |  | |  |
| Karmel Design Team | karmeldesignteam.com | Orlando |  |  | |  |

## 9. Planners (45)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Ideal Events | idealeventsweddings.com | Miami | 305-709-1900 | idealevents.miami@gmail.com | |  |
| Luxy Events | luxy-events.com | Lauderhill |  |  | | also in-house catering |
| Stephanie Verrmar | stephanieverrmar.com | Miami |  |  | | planner + florist |
| Gina Marie Weddings & Events | ginamarieevents.com | Miami / Fort Lauderdale / WPB |  |  | |  |
| Memories for You, Weddings and Events | memoriesforyouevents.com | Wellington |  |  | |  |
| Oh My Occasions | ohmyoccasions.com | South Florida |  |  | |  |
| Events by Tahimy |  | Miami |  |  | | Zola listing |
| My Italian Favors |  | Boynton Beach | 866-236-1695 |  | |  |
| BOLD Impact Events & Wedding Planners |  | Boynton Beach | 561-320-1517 |  | |  |
| Olive & Ivory Events |  | Boynton Beach | 561-613-3456 |  | |  |
| Events by Mala | eventsbymala.com | Fort Lauderdale |  |  | | Indian weddings |
| Suhaag Garden |  | South Florida |  |  | | Indian weddings |
| Eventsource |  | Miami |  |  | | **5+yr old listing - verify** |
| JRN Events |  | Boca Raton |  |  | | **5+yr old listing - verify** |
| Weddings To Go Key West |  | Key West | 305-879-2795 |  | |  |
| Vidal Wedding & Event Planner |  | Key West | 305-942-1604 |  | | also event photography |
| Say Yes In Key West |  | Key West | 305-396-7602 |  | | **second number 305-747-5700 published elsewhere - verify** |
| Little Miss Planner | littlemissplannerkw.com | Key West | 786-334-0124 |  | |  |
| Family Affair Key West | familyaffairkeywest.com | Key West | 305-433-0700 |  | |  |
| Ocean Breeze Weddingz |  | Key West | 305-902-7688 |  | |  |
| Big Day in Key West | bigdayinkeywest.com | Key West | 305-647-9262 |  | |  |
| Key West Casual Weddings | keywestcasualweddings.com | Key West | 305-849-1179 |  | | no longer offers full planning |
| As You Wish Wedding Planning |  | Key West | 305-849-1268 |  | |  |
| Florida Weddings | floridaweddings.com | Fort Lauderdale |  |  | | beach packages; **553-day-old listing - verify** |
| Coastal Coordinating |  | Tampa |  |  | |  |
| Prodigy Event Planning |  | Tampa |  |  | |  |
| Bustle and Bloom |  | Tampa |  |  | | also florals |
| Truly Yours Event Planning |  | St Petersburg |  |  | |  |
| Winter Park Wedding Company | winterparkweddingcompany.com | Winter Park | 407-539-1538 |  | | in-house photo, video, florals, officiants |
|---|---|---|---|---|---|---|
| Blue Orchid Events & Design | blue-orchid-events.com | Fort Lauderdale | 248-840-4204 | | | |
| Très Chic Event Planning & Design | treschiceventplanning.com | Miramar (18741 SW 39th Ct) | 954-517-1818 | info@treschiceventplanning.com | | |
| A. Marie Events & Design | amarieevents.us | Fort Lauderdale | 321-205-8326 | | | |
| Event Bliss Design | eventblissdesign.com | Fort Lauderdale | 954-463-9120 | | | |
| AM Event Co. | ameventco.com | South Florida | 954-588-7869 | | | |
| Fabuluxe Events | fabuluxeevents.com | South Florida | 561-254-2041 | | | |
| Ramos Events | ramosevents.com | Fort Lauderdale | | | | |
| Urbanica Luxury Events | urbanicaevents.com | Fort Lauderdale | | | | |
| Rodriguez Event Design | | South Florida | | | | |
| Simple Weddings | simpleweddingsflorida.com | Gulfport | 727-537-9331 |  | | planning + photography |
| Wondrous Event Planners | wondrouseventplanners.com | Orlando | 321-200-3746 |  | | email info@ published on own site |
| Amore Events II | amoreeventsii.com | Orlando |  |  | | bilingual |
| Signature Weddings and Events | signatureweddingsorlando.com | Orlando |  |  | |  |
| Golden Hour Events | goldenhoureventsfla.com | Orlando |  |  | | day-of coordination |
| LT Events | weddingsbyltevents.com | Orlando |  |  | |  |
| The Chaos Coordinator | theechaoscoordinator.com | Orlando |  |  | |  |

## 10. Caterers (41)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Bill Hansen Catering | billhansencatering.com | Coconut Grove | 305-858-6660 |  | | serves Miami + Ft Lauderdale |
| Thierry Isambert Culinary & Event Design | thierryisambert.com | Miami (915 NW 72nd St) | 305-635-6626 |  | |  |
| Miami Wedding Caterer | miamiweddingcaterer.net | Miami (7049 SW 47th St) | 305-669-5221 |  | |  |
| Chef's Delights Catering |  | Miami (3520 NW 50th St) | 786-287-6283 |  | |  |
| Catering By Lovables |  | Miami (860 NE 79th St) | 305-640-1921 |  | |  |
| A Paella Party |  | Miami | 305-252-6669 |  | |  |
| VNV Events | vnvevents.com | Sunrise |  |  | |  |
| Premier Event Catering | eatwithpremier.com | Aventura |  |  | | kosher |
| Sensory Delights | sensorydelights.net | Pembroke Pines | 954-394-8465 |  | | Caribbean + Haitian cuisine |
| Broward Catering | browardcatering.com | Fort Lauderdale | 954-983-6937 |  | | Jamaican + Haitian; **listing marked current only through 2024 - verify** |
| Dade County Food Group |  | Miami | 305-965-7764 |  | | Caribbean + Latin American |
| Park Ave VIP Catering | parkavevipcatering.com | Orlando | 252-772-4972 |  | | **252 = North Carolina area code against an Orlando address - verify** |
| Exclusive Affairs Catering | exclusiveaffairscatering.com | Winter Park |  |  | |  |
| John Michael Weddings & Special Events |  | Orlando |  |  | |  |
|---|---|---|---|---|---|---|
| Another Perfect Party | anotherperfectparty.com | Palm Beach / Broward / Dade | | | | |
| 954 Catering | catering954.com | Fort Lauderdale | | | | |
| Boca Joe's Catering | bocajoescatering.com | South Florida | | | | |
| Hugh's Catering | hughscatering.com | South Florida | 954-563-4844 | | | |
| Catering by Kerrisha | cateringbykerrisha.com | South Florida | | | | |
| Florida Cater | floridacater.com | Fort Lauderdale | | | | |
| Eggwhites Catering | eggwhitescatering.com | Miami | 305-892-2066 | | | |
| Elegant Kosher Catering & Events | elegantkoshercatering.com | Miami / Fort Lauderdale | | | | |
| Eden Catering | kosherweddingsmiami.com | Hollywood | | | | |
| Shaike's Kosher Catering | shaikes.com | Southeast Florida | | | | |
| Kosher From Z Heart | kosherfromzheart.com | South Florida | | | | |
| Culinary Artz Catering | | South Florida | 954-803-8818 | | | **may be the same business as Florida Cater - same site, check before publishing** |
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

## 11. Venues (69) — approach last

| Business | Website | City | Phone | Email | Sent | Outcome |
| Sundy House |  | Delray Beach |  |  | |  |
| The Soundpost Venue |  | Pompano Beach |  |  | |  |
| Barn 305 | thebarn305.com | Homestead |  |  | |  |
| The Club at Weston Hills |  | Weston |  |  | |  |
| Grand Ballroom at Sunrise Civic Center |  | Sunrise |  |  | |  |
| Aqua Reception Hall | aquareception.com | Miami |  |  | |  |
| Prestige Estate | prestige-estate.com | Miami | 786-612-1542 |  | |  |
| The Addison | theaddisonofbocaraton.com | Boca Raton | 561-372-0568 |  | | glatt kosher venue + caterer |
| The Venue Fort Lauderdale |  | Fort Lauderdale | 954-765-6968 |  | |  |
| Crystal Ballroom BeachPlace | crystalballroomfortlauderdale.com | Fort Lauderdale |  |  | |  |
| The Westin Fort Lauderdale Beach Resort |  | Fort Lauderdale |  |  | | **corporate** |
| Broward Center for the Performing Arts |  | Fort Lauderdale |  |  | |  |
| Deering Estate | deeringestate.org | Miami | 305-235-1668 |  | |  |
| Villa Toscana Miami |  | Homestead | 305-908-8586 |  | |  |
| Curtiss Mansion | curtissmansion.com | Miami Springs | 305-869-5180 | events@curtissmansion.org | |  |
| Royal Mansion & Garden | royalmansiongardens.com | Homestead | 786-386-1116 |  | |  |
| Villa Casa Casuarina | vmmiamibeach.com | Miami Beach | 786-485-2200 |  | |  |
| Vizcaya Museum & Gardens |  | Miami | 305-615-8735 |  | | **number from a caterer page, not the museum - verify** |
| SeaFair Miami |  | Miami | 786-353-4738 |  | | yacht |
| Boat Miami | boatmiami.com | Miami | 305-758-2500 |  | | yacht; **two numbers published - verify** |
| Vista Yachts | vistayachts.com | Miami | 305-407-2324 |  | | yacht |
| Miami Yacht Connect | miamiyachtconnect.com | Miami | 305-813-0537 |  | | yacht; **two numbers published - verify** |
| Charter One Yachts |  | Fort Lauderdale | 954-833-4731 |  | | yacht |
| Island Queen Cruises | islandqueencruises.com | Miami | 305-379-5119 |  | | yacht; **7yr old page - verify** |
| Beth David Congregation |  | Miami | 305-854-3911 |  | | **two addresses and two numbers published - verify** |
| Trinity Episcopal Cathedral |  | Miami |  |  | |  |
| Miami Beach Community Church |  | Miami Beach |  |  | |  |
| Coral Gables Congregational UCC |  | Coral Gables |  |  | |  |
| Atlantic Wedding Chapel | atlanticweddingchapel.com | Pompano Beach | 954-461-5520 |  | |  |
| The Ancient Spanish Monastery |  | North Miami Beach |  |  | |  |
| Miami Beach Botanical Garden |  | Miami Beach |  |  | |  |
| Historic Virginia Key Beach Park |  | Miami |  |  | |  |
| Fort Lauderdale Historical Society |  | Fort Lauderdale |  |  | |  |
| Wine + Garden |  | Fort Lauderdale |  |  | |  |
| Stonebridge Country Club |  | Boca Raton |  |  | | country club |
| Boca Lago Golf & Country Club |  | Boca Raton |  |  | | 35-350 guests |
| Boca Dunes Golf & Country Club |  | Boca Raton |  |  | |  |
| The Club at Boca Pointe |  | Boca Raton |  |  | |  |
| Jacaranda Country Club | jacarandacountryclub.com | Plantation |  |  | |  |
| Plantation Preserve Golf Course & Club |  | Plantation |  |  | |  |
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
| Bonnet House Museum & Gardens | bonnethouse.org | Fort Lauderdale | | | | |
| Boatyard | boatyard.restaurant | Fort Lauderdale | | | | |
| The House on the River | thehouseontheriver.com | Fort Lauderdale | | | | |
| The Grateful Palate Catering & Events | thegratefulpalate.com | Fort Lauderdale | | | | |
| LAVAN Luxury Venue | lavancateringandevents.com | Broward County | | | | |
| Club of Knights | clubofknights.com | Coral Gables | | | | |
| Comber Hall | | Coral Gables | | | | |
| Conrad Fort Lauderdale Beach | hilton.com | Fort Lauderdale | | | | **corporate** |
| The Biltmore Hotel | biltmorehotel.com | Coral Gables | | | | **corporate** |
| Loews Coral Gables | loewshotels.com | Coral Gables | | | | **corporate** |
| Faena Hotel | | Miami Beach | | | | **corporate** |
| The Barn at Crescent Lake | barnatcrescentlake.com | Odessa | 813-486-2731 |  | | 20 lakefront acres |

## 12. Transportation (29)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Rumbatours Miami | rumbatoursmiami.com | Miami |  |  | | classic cars + coaches |
| A Family Limo | afamilylimo.com | Miami |  |  | | Rolls-Royce + charter |
| American Limo & Transportation Service | americanlimofl.com | Miami |  |  | |  |
| American Dream Tour Miami | americandreamtourmiami.com | Miami |  |  | | classic convertibles |
| Miami White Trolley | miamiwhitetrolley.com | Miami |  |  | | trolley, 30 passengers |
| Molly's Trolleys of West Palm Beach |  | West Palm Beach |  |  | | 1920s-style trolleys |
| Atlantic Charters | atlanticchartersinc.com | Fort Lauderdale | 954-448-2032 |  | | charter buses |
| Premier Bus Charters |  | Sunny Isles Beach |  |  | |  |
| Phoenix Bus |  | Orlando |  |  | | minibus to 57-passenger |
| VIP Wedding Transportation |  | Orlando |  |  | | sedans, limos, classic cars |
| Orlando Luxury Transportation | orlandoluxurytransportation.com | Orlando |  |  | |  |
| Black Car Everywhere | blackcareverywhere.com | Orlando |  |  | |  |
| Tampa Minibus Company |  | Tampa |  |  | |  |
| Champa Bay Limo |  | Tampa |  |  | |  |
|---|---|---|---|---|---|---|
| Sal Limo Service | sallimoservice.com | Fort Lauderdale | 786-816-3259 |  | |  |
| Fort Lauderdale Airport Shuttle Limo | fortlauderdaleairportshuttle.com | Fort Lauderdale | 954-688-7738 |  | |  |
| Black Car Miami | blackcarmia.com | Miami | 786-685-3076 | reservations@blackcarmia.com | |  |
| Lauderdale Limos | lauderdalelimos.com | Fort Lauderdale | 954-951-2348 |  | |  |
| Miami Shuttle & Limo Service | miamifllimousines.com | Miami | 888-657-6842 |  | |  |
| Majestic Limousines | majesticlimos.com | Coral Gables | 305-774-0117 |  | |  |
| Miami Limo Service | miami-limo.com | Miami Beach | 305-414-1111 |  | |  |
| Apex International Transportation | apexlimofl.com | Miami | 305-707-5837 |  | |  |
| Worldwide Limo | worldwidelimo.com | Miami | 305-440-1111 |  | |  |
| Ambassador Limousine and Sedan |  | Tampa | 727-442-9050 |  | | **727 number, Tampa address** |
| Showtime Transportation of Tampa | showtimetampa.com | Tampa | 813-749-4900 |  | |  |
| WDT Limo | wedrivetampa.com | Tampa |  |  | | **toll-free + 941 dispatch only, withheld** |
| Alora Transportation | aloraride.com | Tampa | 813-314-0000 |  | |  |
| Skyline Limousine | skyline-limo.com | Tampa |  |  | |  |
| Affari Transportation | affaritampa.com | Tampa |  |  | |  |

## 13. Photo booth (18)

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
| Glowshot | glowshotevents.com | Miami | 305-303-5740 |  | |  |
| Ace Photobooth Rentals | acephotoboothrentals.com | Fort Lauderdale |  |  | |  |
| Esteem 360 Studios | esteem360studios.com | South Florida |  |  | |  |
| The Gala Photobooth | thegalaphotobooth.com | Fort Lauderdale |  |  | |  |
| MIA Mirror Booth | miamirrorbooth.com | Miami |  |  | |  |
| Photo Booth by LNH | photoboothlnh.com | South Florida |  |  | |  |
| JuJu Booth | jujubooth.com | South Florida |  |  | |  |
| DEMM Photo Booths | demmphotobooths.com | Tampa | 813-214-8098 |  | | 360 video booth |
| Snapshot Media | snapshotmediatampa.com | Tampa |  |  | | 360 booth, from $800 |
| Be Glam Photo Booth | beglamphotobooth.com | Sarasota |  |  | |  |

## 14. Lighting (6)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Rent For Event | rentforevent.com | Miami | 877-409-6999 |  | | **two conflicting numbers published - verify** |
| Miami Party DJ | miamipartydj.com | Miami | 305-609-6707 |  | |  |
| DJ Peoples |  | Miami | 305-328-9492 |  | | **three numbers published - verify** |
| Kings Rentals | kings-rental.com | Miami | 786-541-4892 | kingsrental@hotmail.com | |  |
| Miami Uplighting Rentals | miamiuplightingrentals.com | Miami | 786-755-3431 |  | |  |
| Gabro Event Services | gabroeventservices.com | Tampa |  |  | | draping + uplighting |

## 15. Bridal salon (35)

| Business | Website | City | Phone | Email | Sent | Outcome |
| ANV Bridal Valet | anvbridalvalet.com | Fort Lauderdale |  |  | | **attire care on the day, NOT vehicle parking** |
|---|---|---|---|---|---|---|
| Boca Raton Bridal | bocaratonbridal.net | Boca Raton | 561-447-6541 |  | | **959-day-old source - verify** |
| Amazing Brides Couture |  | Boca Raton | 561-372-9377 |  | | **959-day-old source - verify** |
| Brittany Burns Bridal of Boca |  | Boca Raton | 561-717-8745 |  | | **959-day-old source - verify** |
| Nuova Vita |  | Boca Raton | 561-558-5733 |  | | **959-day-old source - verify** |
| Wonderland Bridal |  | Margate | 954-973-8695 |  | | **959-day-old source - verify** |
| Patricia South's Bridal & Formal |  | Fort Lauderdale |  |  | |  |
| Southern Formals |  | Fort Lauderdale |  |  | | tuxedo |
| Luv Bridal Fort Lauderdale |  | Fort Lauderdale |  |  | |  |
| Savvy Bridal FTL |  | Fort Lauderdale |  |  | |  |
| Lauderdale Bride |  | Fort Lauderdale |  |  | |  |
| Talega Atelier |  | Fort Lauderdale |  |  | |  |
| AJs Custom Suits & Tuxedos Rentals |  | Boca Raton |  |  | | tuxedo |
| House of Seide |  | Boynton Beach |  |  | |  |
| Gloria Couture |  | Miami | 305-864-1090 |  | |  |
| MDO Miami |  | Miami |  |  | | menswear |
| LinDi Bridal |  | Sunrise |  |  | |  |
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

## 16. Rentals (27)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Mi Vintage |  | Miami |  |  | | decor + rentals |
| Eventluxe Rentals |  | Miami |  |  | | decor + rentals |
| Elements and Access Event Rentals |  | Doral |  |  | | **5+yr old listing - verify** |
| Arc Divine | arcdivine.com | Miami | 954-319-6126 |  | | chuppah + arch rental; resolves the unattributed 954-319-6126 seen earlier |
| Arches By Design | archesbydesign.com | South Florida |  |  | | builds in-house, incl. the Keys |
| Eventgi Party Rental | eventgipartyrental.com | Miami |  |  | |  |
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
| Allure Party Rentals | allurepartyrentals.com | Fort Lauderdale | 954-598-9595 |  | |  |
| Christina's Party Rentals | christinaspartyrentals.net | Miami |  |  | |  |
| Over the Top Rental Linens |  | Fort Lauderdale |  |  | | linens |
| Weston Events Party Rentals |  | Weston |  |  | |  |
| Imperial Event Rentals | imperialeventrentals.com | Miami |  |  | |  |
| Rent Anything Orlando | rentanythingorlando.com | Orlando | 407-502-3741 |  | |  |
| Signature Event Rentals | signatureeventrentalsllc.com | Orlando |  |  | |  |
| Party Rentals of Orlando | partyrentalsoforlando.com | Orlando |  |  | | tents |
| All Occasions Rentals | alloccasionsorlando.com | Orlando |  |  | |  |
| Alpine Events | alpineevents.com | Orlando |  |  | |  |
| Panache Events | panacheevents.com | Orlando |  |  | |  |

## 17. Bar service (12)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Fire Water Bars | firewaterbars.com | South Florida |  |  | |  |
| With A Twist Bartending Service | twistbartendingservice.com | South Florida |  |  | |  |
| Bar2Hire USA |  | South Florida |  |  | |  |
| Craft Bar Co. |  | Deerfield Beach |  |  | |  |
| Cocktail Couture Mobile |  | Fort Lauderdale |  |  | |  |
| Mr Barrtenderr | mrbarrtenderr.com | South Florida |  |  | |  |
| Boozy Bear Mobile Bartending | myboozybear.com | Tampa |  |  | |  |
| Encore Bartending Service | encorebartendingservice.com | Tampa |  |  | | licensed + insured |
| Deluxe Bartending Service | deluxebartendingservice.com | Tampa |  |  | |  |
| Tampa Bay Bartenders | tampabaybartenders.com | Tampa |  |  | |  |
| The Tap Nomad | thetapnomad.com | Tampa |  |  | | mobile bar |
| Hook Line & Drinker | hldrinker.com | Tampa |  |  | |  |

## 18. Ceremony music (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| The Elegant Harp | elegantharp.net | West Palm Beach |  |  | | harp + string quartet |
| Serenade Events | serenadeevents.com | South Florida |  |  | | strings |
| Jade Strings | jadestrings.com | South Florida |  |  | | strings |
| Manhattan Music | manhattanmusic.com | South Florida |  |  | |  |

## 19. Stationery (19)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Lettered with Love |  | South Florida |  |  | | calligraphy + signage |
| Dainty Hands Co |  | Miami Lakes |  |  | | calligraphy |
| Calligraphy by Elaine |  | Miami Beach |  |  | | calligraphy |
| Carla Hagan Calligraphy and Design |  | South Florida |  |  | | calligraphy |
| Fort Lauderdale Invitations |  | Fort Lauderdale |  |  | |  |
| Tuesday Grace Designs |  | Fort Lauderdale |  |  | |  |
| Paper & Lace |  | Fort Lauderdale |  |  | |  |
| Calligraphy by YS |  | Miami |  |  | | **listed in both Miami and Hialeah - verify** |
| DMS Printing and Design |  | Miami |  |  | |  |
| Invites and Events |  | Plantation |  |  | |  |
| Lucky Tusk |  | Oakland Park |  |  | | metal invitations |
| The Petite Acorn |  | Fort Lauderdale |  |  | |  |
| Miami Writes Co |  | Miami |  |  | | calligraphy |
| JN Calligraphy |  | Fort Lauderdale |  |  | | calligraphy |
| Pretty Little Letters |  | Fort Lauderdale |  |  | | engraving |
| Kiki's Customized Creations |  | Miami |  |  | |  |
| Tampa Calligraphy | tampacalligraphy.com | Tampa | 813-854-6100 |  | | envelope addressing |
| The Write Stuff |  | Tampa | 813-837-0400 |  | | **directory-only source** |
| Lili V. The Company |  | Tampa | 813-389-3691 |  | | **directory-only source** |

## 20. Dance lessons (5)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Royal Wedding Dance |  | Miami |  |  | | 22 years choreography |
| Fajardo Elite Dance Academy |  | Miami |  |  | | serves tri-county |
| vON Dance | vondance.com | South Florida |  |  | |  |
| The Wedding Dance Studio | theweddingdancestudio.com | South Florida |  |  | |  |
| Fred Astaire Dance Studios South Florida | fredastaire.com | South Florida |  |  | | **national franchise** |

## 21. Live painter (1)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Carla Schall Live Event Painting | carlaschall.com | Florida |  |  | |  |

## 22. Dessert cart (9)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Glyk Gelato | glyk.com | Boca Raton | 561-609-4900 |  | | **listed Boca Raton but a Parkland address - verify** |
| GelatoGo | gelatogo.net | Miami | 786-450-0477 |  | |  |
| The Gelato Bar | urbanicaevents.com | Fort Lauderdale |  |  | |  |
| I Scream Gelato | iscream-gelato.com | Miami |  |  | |  |
| HipPOPs | hippops.com | Miami |  |  | | dessert truck |
| Banana Daddy | eatbananadaddy.com | Miami |  |  | | electric dessert truck |
| AJ's Coffee Break |  | South Florida |  |  | | mobile coffee cart |
| El Salvaje Food Trailer |  | Fort Lauderdale |  |  | |  |
| JJ's Gelato & Coffee |  | Fort Lauderdale |  |  | |  |

## 23. Jeweler (8)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Kirk Jewelers | kirkjewelers.com | Miami | 305-371-1321 |  | |  |
| Jae's Jewelers | jaesjewelers.com | Coral Gables | 305-443-7724 |  | |  |
| Nemaro Jewelers | nemarojewelers.com | Miami | 305-358-4399 |  | |  |
| LC Rings | lcrings.com | Tampa | 813-447-5577 |  | | by appointment |
| Tampa Diamond Center | tampadiamondcenter.com | Tampa | 813-402-2696 |  | | cuts gems on site |
| Awesome Jewelry | awesomejewelrytampa.com | Tampa | 813-831-2419 |  | | family-owned since 1994 |
| Thurber Armstrong Private Jewelers | thurberarmstrongprivatejewelers.com | Tampa | 656-999-1997 |  | | 656 is a valid Tampa overlay |
| Florida Diamond Center | floridadiamondcenter.com | Holiday | 727-491-3344 |  | | GIA gemologist on site |

## 24. Decor (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Balloon World Events | myballoonworld.com | Fort Lauderdale | 954-702-6109 | events@myballoonworld.com | |  |
| DreamARK Events | dreamarkevents.com | Fort Lauderdale |  |  | | ceiling balloon decor |
| Fashion Balloons | fashion-balloons.com | Miami |  |  | |  |
| Drapeworks | drapeworks.com | Miami |  |  | | pipe + drape, ceiling draping |

## 25. Alterations (12)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Emma Couture & Alterations |  | Miami |  |  | |  |
| Marina Mella Tailoring | marinamellatailoring.com | Miami |  |  | |  |
| Clothing Solutions |  | Weston |  |  | | also serves the Keys |
| Needlestitch |  | Fort Lauderdale |  |  | |  |
| B&P Alterations |  | Fort Lauderdale |  |  | |  |
| Thread and Needle Alterations |  | Winter Park | 407-622-4411 |  | | also tuxedos |
| Diana's Bridal | bridalsbydiana.com | Tampa | 813-282-7371 |  | | alterations specialist |
| Bridal By Mina | bridalbymina.com | Tampa | 813-732-1762 |  | |  |
| Seamless Alterations Studio |  | Tampa | 813-389-0132 |  | |  |
| Ella's Alterations | ellasalterations.com | Tampa | 813-445-8894 |  | |  |
| Classic Stitch | sewingservicetampa.com | Tampa |  |  | |  |
| SuZann Designs | suzanndesigns.com | Clearwater |  |  | |  |

## 26. Hora loca (7)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| J&G Entertainment | jandgentertainment.com | North Miami Beach | 305-677-2429 |  | | stilt walkers, Brazilian dancers, LED robots |
| Led Robot Miami | ledrobotsmiami.com | Miami Lakes | 954-530-6136 |  | | **number from a Facebook listing; 954 area code vs Miami address - verify** |
| Blast Party Entertainment | blastpartyentertainmentllc.com | Miami |  |  | |  |
| The Hora Loca Guys | thehoralocaguys.com | South Florida |  |  | | also DJ + photo booth |
| ArteVivo Dance Studio |  | Miami |  |  | | dancers, drummers, percussionists |
| Miami Superhero | miamisuperhero.com | Miami |  |  | |  |
| The Party Characters | thepartycharacters.com | Miami |  |  | |  |

## 27. Cigar roller (2)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Miami Cigar Entertainment | miamicigarentertainment.com | Miami | 845-549-8751 |  | | **845 = New York Hudson Valley area code - verify** |
| Cigar Bella | cigarbella.com | Miami |  |  | |  |

## 28. Restrooms (6)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| A Royal Flush | aroyalflush.com | Miami |  |  | | **2yr-old listing - verify** |
| Coastal Mobile Restrooms | coastalmobilerestrooms.com | West Palm Beach |  |  | |  |
| Royal Restrooms Florida | royalrestroomsfl.com | Fort Lauderdale |  |  | | ADA units |
| Jones Luxury Restrooms |  | Florida |  |  | |  |
| South Florida Restroom Trailers | southfloridarestroomtrailers.com | South Florida |  |  | |  |
| Island Restrooms | islandrestrooms.com | Florida Keys |  |  | | also generators |

## 29. Travel agent (13)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Grisel Velasco |  | Miami | 305-282-0809 |  | | destination weddings + honeymoons |
| Karrah Kazravan |  | Miami | 844-950-2143 |  | | honeymoons |
| Mario Lopez |  | Hollywood | 954-330-1210 |  | | destination weddings |
| Carolyn Drummond |  | Miramar | 305-432-5108 |  | | destination weddings |
| Tie the Knot Abroad |  | Miami |  |  | |  |
| Anchored South Travel Services |  | Miami |  |  | |  |
| Luxevo Vacations |  | Miami |  |  | |  |
| Fairytale Getaways |  | Miami |  |  | |  |
| Travel Adventures by Patrice |  | Miami |  |  | |  |
| Bailey's Luxury Travel |  | Miramar |  |  | |  |
| Cruise Planners - Christine Erwin |  | Fort Lauderdale |  |  | |  |
| Travelmation |  | Fort Lauderdale |  |  | |  |
| The Vacation Group |  | South Florida |  |  | |  |

## 30. Event staffing (2)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Ziva Staffing |  | Miami |  |  | | bar staff, servers, banquet managers |
| SoleMar Events & Waitstaff Services |  | Fort Lauderdale |  |  | | setup, service, cleanup |

## 31. Valet parking (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Farber Parking | farberparking.com | South Florida |  |  | | NPA-certified |
| AV Valet Parking Miami | avvaletparkingmiami.com | Miami |  |  | |  |
| Soflo Valet | soflovalet.com | Fort Lauderdale |  |  | |  |
| 717 Parking | 717parking.com | South Florida |  |  | |  |

## 32. Security (2)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| FSO Guard | fsoguard.us | Miami |  |  | | licensed event security |
| IGS Security | igssecurityusa.com | Miami |  |  | | FDACS-certified |

## 33. AV production (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Mia Sound Production | miasoundproduction.com | Miami |  |  | |  |
| Master Sound Productions | mastersoundpro.com | Miami |  |  | | serves the Keys too |
| Monster Sound Productions |  | Miami |  |  | |  |
| SoFlo Studio | soflostudio.com | Miami |  |  | |  |

## 34. Fireworks (7)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Fireworks Over Miami | fireworksovermiami.com | Miami | 305-305-0191 |  | | barges for waterfront venues |
| Firepower Displays | firepowerdisplays.com | Miami | 305-258-8820 |  | | handles permits |
| My 3 Sons Fireworks | 3sonspyro.com | Jupiter | 561-210-5176 |  | | PGI certified |
| Pyro Pros Fireworks | pyroprosfl.com | Miami |  |  | |  |
| Add Fire | addfire.com | Miami |  |  | | shot from own barges |
| FX Pro | fireworkspros.com | Florida |  |  | |  |
| Ghost Coast Entertainment | ghostcoastentertainment.com | Florida |  |  | |  |











---

## What to do with this

1. **Call the 291 above, unflagged ones first.** The only step waiting on
   nothing. Confirm the business, ask for the best address, and attach it on
   `/admin/claims` — no email of ours is sent, so this works today.
2. **Resolve the `TERMS.md` mailing address.** Nothing can be *emailed* until
   then. The phone-claim flow is the way around it, not a replacement for it:
   fixing the TODO unblocks the other 469 rows.
3. **Then photographers and florists** — the top two categories, 145 names.
   Open each site, take the published contact email, fill the row. This needs
   the egress block lifted (see the top of this file) or a human with a
   browser.
4. **Create claim listings in small batches** as rows complete, using the
   `create_claimable_listing` call in `VENDOR-OUTREACH.md`. Copy each token
   immediately: only its SHA-256 is stored, so a lost link cannot be recovered —
   delete the row and make a new listing.
5. **Send 20–30 a day, hand-written**, one metro at a time. Claim links expire
   after 60 days, so do not mint more than you will actually send inside that
   window. Minting all 760 at once creates 760 credentials and 760 expiries.

   **This no longer applies: 759 of the 760 are imported.** Every row below
   except `Marry Me Mendez` is in the database as a listing whose claim token
   was generated and discarded, so the email-match path on `/admin/claims` is
   the *only* route for all of them — there is no link to send to anyone.
   539 are published and visible on `/vendors`; the rest are drafts, held
   because they have neither a phone nor a website and so give a couple no way
   to make contact.
6. **One follow-up after 5–7 days, then stop permanently.**
7. **Ask the ones who publish to link back.** Per the flywheel in
   `COUPLES-ACQUISITION.md`, that inbound link is worth more to the couples side
   than the listing is to the vendor.

Throw this file away once there are 50 published listings in one metro — at that
point the pitch changes from "help me start this" to "your competitors are here".
