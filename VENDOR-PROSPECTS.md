# South Florida vendor prospects

A research shortlist for the founding-vendor outreach in `VENDOR-OUTREACH.md`.
444 real businesses across 25 categories, sourced from public web search in three
passes: 117 on 2026-10-01, 73 on 2026-10-07, and a further 254 later the same
day. Later passes also filled gaps in rows from earlier ones, so a row's data
may be newer than the row.

**This file is a record of what is in the database, not a staging area.** That
is a reversal from how it started, and it matters: 443 of these 444 rows are
live listings created by `create_claimable_listing`, and **292 of them are
published and visible to couples on `/vendors`** right now.

Publishing is no longer withheld until a vendor claims their listing. A
directory entry is the business's own public facts — name, category, city,
phone, a link to the site they already run — which is what a directory has
always been, and a listing nobody can act on is a listing that fails the
couple reading it. What the paid tiers sell is their *work* and their *reach*:
gallery, Inspiration posts, an inquiry inbox, placement. See the note at the
top of `lib/tiers.ts`.

A row is held back as a draft only when it has **neither a phone nor a
website**, because then it gives a couple no way to make contact at all. 151
rows are in that state. Fill in either field and it publishes.

## Read this before using it

Two things are missing, and the first one is why there is a file here instead of
rows in the database.

**1. Almost no contact emails — 20 of 444.** The sessions that built this could
run web *search* but could not open the vendors' own websites; the network egress
proxy blocked every one, on both passes. So every name, URL, address and phone
below came from a search result rather than from first-party verification.

The second pass did surface 15 addresses, because the thorough search mode
quotes contact details out of the pages it reads. That is the first email data
this list has ever had, and it is still a search snippet, not a verified fact.
**Four of the 15 are flagged `personal-looking email — do not mail`**: a
solo officiant's own `gmail`/`comcast` address is not a business contact point,
and `VENDOR-OUTREACH.md` is explicit — *the business's own published contact
address, never a scraped personal one.* Those four are listed so nobody
re-researches them, not so they can be mailed.

For the remaining 424 rows the email still has to be gathered by hand, from each
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
  section above; 151 of the 444 qualify.
- **Email** — empty on 424 of 444 rows. Fill from the vendor's own site. Where
  one is present it came from a search snippet, so confirm it before use.
- **Outcome** — also carries research flags (`verify`, `do not mail`,
  `corporate`) until there is a real outcome to record.
- **Sent / Outcome** — the tracking `VENDOR-OUTREACH.md` asks for. Record a "no"
  and a "no reply" differently: a "no" is permanent.

Verify before you contact. A search snippet is a lead, not a fact — check the
business still trades, still does weddings, and is in the metro before you spend
a claim link on it.

## Call these 151 first — the widest unblocked path

Every table below has a **Phone** column, and 151 of the 444 rows have a number
because a search result published one. Those 151 can be contacted **today**:

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
| Alan Luby Photography | Photographer | 561-577-9246 |  |
| Appeal Photography | Photographer | 561-478-7340 |  |
| Care Studios | Photographer | 305-360-2636 |  |
| Chris Joriann Photography | Photographer | 561-246-9271 | **name/number pairing inferred from page layout - verify** |
| Clickety Chicks | Photographer | 561-662-0455 |  |
| Couture Bridal Photography | Photographer | 954-399-0741 |  |
| Deivis Archbold Photography | Photographer | 954-945-8116 |  |
| Frank Donnino Photography | Photographer | 561-776-0099 | **name/number pairing inferred from page layout - verify** |
| Joey G Photography | Photographer | 954-986-4455 |  |
| Little's Photography | Photographer | 954-563-0444 |  |
| Lukas G Photography | Photographer | 561-246-2403 |  |
| Marco Palmieri Photographer | Photographer | 954-471-5870 | **directory listing inconsistent - verify** |
| Michael Murphy Photographic Imaging | Photographer | 877-564-8555 |  |
| Photography South Florida | Photographer | 561-951-8800 |  |
| Supanik Photography | Photographer | 786-385-1100 |  |
| Vanessa + Johnny | Photographer | 954-417-2193 | **was published as 310-819-6544 (Los Angeles); a later source gave this local number** |
| db Wolin Photography | Photographer | 561-762-5349 |  |
| A Creation Films | Videographer | 305-928-8685 |  |
| Candid Studios | Videographer | 844-522-6343 |  |
| Default Estudios | Videographer | 786-380-9305 |  |
| Global Filmz | Videographer | 888-653-2688 | drone; **page ~3yr old - verify** |
| Shutter & Sound | Videographer | 800-841-3990 | **site gives 800-841-3990; directories give 443-449-6812 - verify** |
| South Florida Wedding Studio | Videographer | 954-778-2267 |  |
| Straightawaymovies | Videographer | 305-793-6036 |  |
| VM Productions | Videographer | 305-239-9555 |  |
| Bayfront Floral & Event Design | Florist | 954-981-1024 |  |
| Beautiful Kreations | Florist | 954-933-7530 |  |
| Beldens Florist | Florist | 561-832-2871 |  |
| Concept Flowers | Florist | 305-300-4758 |  |
| Cortez Event Agency | Florist | 786-983-7092 |  |
| Floral Fantasy of the Keys | Florist | 305-664-1063 |  |
| Flowers Unveiled | Florist | 954-806-8406 |  |
| Flowers by J&J | Florist | 305-743-5459 |  |
| Island Blooms | Florist | 305-304-3504 |  |
| Jose Graterol Designs | Florist | 305-788-0562 |  |
| Key Largo Flowers & Gifts | Florist | 305-451-3702 |  |
| Kutchey's Flowers | Florist | 305-292-8181 |  |
| Milan Event Floral & Decor | Florist | 305-735-4749 |  |
| Orange Blossoms Florals and Event Styling | Florist | 561-568-0528 |  |
| Twice the Style | Florist | 561-939-9589 |  |
| Wellington Florist | Florist | 561-333-4441 |  |
| Wildflowers of Parkland | Florist | 954-752-6999 |  |
| Xquisite Events Production | Florist | 561-988-9798 |  |
| La Cake Cafe | Cake | 754-779-2965 |  |
| LoveLee Bakeshop | Cake | 954-715-2050 |  |
| Panchis Bakery | Cake | 754-600-3370 |  |
| We Take The Cake | Cake | 954-764-2253 |  |
| A1A DJs | DJ | 954-531-8146 |  |
| All Events DJ Services | DJ | 954-290-6032 |  |
| Eddie B & Company | DJ | 954-721-9911 |  |
| Palm Beach Party DJ | DJ | 561-285-2640 | **1600-day-old source - verify** |
| Vision DJs | DJ | 954-418-2203 |  |
| CK Entertainment | Band | 954-436-1230 |  |
| Florida Music Group | Band | 772-924-9302 | **second number 772-781-7415 published - verify** |
| Sekond Nature | Band | 954-607-8334 |  |
| Cantor Ann Turnoff | Officiant | 561-445-8914 | stale directory - verify |
| Cantor Ellen Stettner | Officiant | 561-213-1277 | stale directory - verify |
| Ceremonies by Cindy | Officiant | 954-781-8822 | stale directory - verify |
| Eddie Rodriguez | Officiant | 305-596-1810 |  |
| Florida Weddings by Cecilia | Officiant | 561-231-0043 | stale directory - verify |
| Gracefully Wed Events | Officiant | 561-532-7919 | stale directory - verify |
| Hey Reverend | Officiant | 604-574-7731 | **604 = British Columbia, not FL - verify** |
| Just Married by Rosy | Officiant | 305-610-0308 | **personal-looking email - do not mail** |
| Love Unions | Officiant | 561-504-5107 | stale directory - verify |
| Marry Me Mendez | Officiant | 305-439-5553 | **may be the same business as Marry Me, LLC below - check before importing** |
| Mitchell Cohen | Officiant | 954-757-0083 |  |
| Modern Love South Florida | Officiant | 561-401-3072 | stale directory - verify |
| Patti Roman | Officiant | 305-283-7647 | **personal-looking email - do not mail** |
| Rainbow Notary & Nuptials | Officiant | 954-579-3953 |  |
| SosFloWeddings | Officiant | 305-807-3898 |  |
| Terri Golden | Officiant | 561-685-9038 | **personal-looking email - do not mail** |
| The Officiants | Officiant | 800-354-4990 |  |
| Wedding Officiant Fort Lauderdale | Officiant | 954-240-6234 |  |
| Asteria Beauty Studio | Hair & makeup | 954-531-8831 |  |
| Courtney Christopherson Glamour Group | Hair & makeup | 561-289-2138 |  |
| Hans on Beauty | Hair & makeup | 954-667-9940 |  |
| Wondrous Look | Hair & makeup | 305-890-4778 |  |
| A. Marie Events & Design | Planner | 321-205-8326 |  |
| AM Event Co. | Planner | 954-588-7869 |  |
| As You Wish Wedding Planning | Planner | 305-849-1268 |  |
| BOLD Impact Events & Wedding Planners | Planner | 561-320-1517 |  |
| Big Day in Key West | Planner | 305-647-9262 |  |
| Blue Orchid Events & Design | Planner | 248-840-4204 |  |
| Event Bliss Design | Planner | 954-463-9120 |  |
| Fabuluxe Events | Planner | 561-254-2041 |  |
| Family Affair Key West | Planner | 305-433-0700 |  |
| Ideal Events | Planner | 305-709-1900 |  |
| Key West Casual Weddings | Planner | 305-849-1179 |  |
| Little Miss Planner | Planner | 786-334-0124 |  |
| My Italian Favors | Planner | 866-236-1695 |  |
| Ocean Breeze Weddingz | Planner | 305-902-7688 |  |
| Olive & Ivory Events | Planner | 561-613-3456 |  |
| Say Yes In Key West | Planner | 305-396-7602 | **second number 305-747-5700 published elsewhere - verify** |
| Très Chic Event Planning & Design | Planner | 954-517-1818 |  |
| Vidal Wedding & Event Planner | Planner | 305-942-1604 |  |
| Weddings To Go Key West | Planner | 305-879-2795 |  |
| A Paella Party | Caterer | 305-252-6669 |  |
| Bill Hansen Catering | Caterer | 305-858-6660 |  |
| Catering By Lovables | Caterer | 305-640-1921 |  |
| Chef's Delights Catering | Caterer | 786-287-6283 |  |
| Culinary Artz Catering | Caterer | 954-803-8818 | **may be the same business as Florida Cater - same site, check before publishing** |
| Eggwhites Catering | Caterer | 305-892-2066 |  |
| Miami Wedding Caterer | Caterer | 305-669-5221 |  |
| Thierry Isambert Culinary & Event Design | Caterer | 305-635-6626 |  |
| Atlantic Wedding Chapel | Venue | 954-461-5520 |  |
| Beth David Congregation | Venue | 305-854-3911 | **two addresses and two numbers published - verify** |
| Boat Miami | Venue | 305-758-2500 | yacht; **two numbers published - verify** |
| Charter One Yachts | Venue | 954-833-4731 |  |
| Curtiss Mansion | Venue | 305-869-5180 |  |
| Deering Estate | Venue | 305-235-1668 |  |
| Island Queen Cruises | Venue | 305-379-5119 | yacht; **7yr old page - verify** |
| Miami Yacht Connect | Venue | 305-813-0537 | yacht; **two numbers published - verify** |
| Prestige Estate | Venue | 786-612-1542 |  |
| Royal Mansion & Garden | Venue | 786-386-1116 |  |
| SeaFair Miami | Venue | 786-353-4738 |  |
| The Addison | Venue | 561-372-0568 |  |
| The Venue Fort Lauderdale | Venue | 954-765-6968 |  |
| Villa Casa Casuarina | Venue | 786-485-2200 |  |
| Villa Toscana Miami | Venue | 305-908-8586 |  |
| Vista Yachts | Venue | 305-407-2324 |  |
| Vizcaya Museum & Gardens | Venue | 305-615-8735 | **number from a caterer page, not the museum - verify** |
| Apex International Transportation | Transportation | 305-707-5837 |  |
| Atlantic Charters | Transportation | 954-448-2032 |  |
| Black Car Miami | Transportation | 786-685-3076 |  |
| Fort Lauderdale Airport Shuttle Limo | Transportation | 954-688-7738 |  |
| Lauderdale Limos | Transportation | 954-951-2348 |  |
| Majestic Limousines | Transportation | 305-774-0117 |  |
| Miami Limo Service | Transportation | 305-414-1111 |  |
| Miami Shuttle & Limo Service | Transportation | 888-657-6842 |  |
| Sal Limo Service | Transportation | 786-816-3259 |  |
| Worldwide Limo | Transportation | 305-440-1111 |  |
| Glowshot | Photo booth | 305-303-5740 |  |
| DJ Peoples | Lighting | 305-328-9492 | **three numbers published - verify** |
| Kings Rentals | Lighting | 786-541-4892 |  |
| Miami Party DJ | Lighting | 305-609-6707 |  |
| Miami Uplighting Rentals | Lighting | 786-755-3431 |  |
| Rent For Event | Lighting | 877-409-6999 | **two conflicting numbers published - verify** |
| Amazing Brides Couture | Bridal salon | 561-372-9377 | **959-day-old source - verify** |
| Boca Raton Bridal | Bridal salon | 561-447-6541 | **959-day-old source - verify** |
| Brittany Burns Bridal of Boca | Bridal salon | 561-717-8745 | **959-day-old source - verify** |
| Gloria Couture | Bridal salon | 305-864-1090 |  |
| Nuova Vita | Bridal salon | 561-558-5733 | **959-day-old source - verify** |
| Wonderland Bridal | Bridal salon | 954-973-8695 | **959-day-old source - verify** |
| Allure Party Rentals | Rentals | 954-598-9595 |  |
| Arc Divine | Rentals | 954-319-6126 |  |
| GelatoGo | Dessert cart | 786-450-0477 |  |
| Glyk Gelato | Dessert cart | 561-609-4900 | **listed Boca Raton but a Parkland address - verify** |
| Jae's Jewelers | Jeweler | 305-443-7724 |  |
| Kirk Jewelers | Jeweler | 305-371-1321 |  |
| Nemaro Jewelers | Jeweler | 305-358-4399 |  |
| Balloon World Events | Decor | 954-702-6109 |  |



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

## 1. Photographers (57)

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

## 2. Videographers (19)

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
|---|---|---|---|---|---|---|
| Andreo Studio | andreostudio.com | Miami / West Palm Beach | | | | |
| Megaset Weddings | megasetphotography.com | South Florida | | | | |
| Quality Media FL | qualitymediafl.com | Boca Raton | | | | |
| South Florida Wedding Studio | southfloridaweddingstudio.com | South Florida | 954-778-2267 | | | |
| A Creation Films | acreationfilms.com | Miami | 305-928-8685 | hello@acreationfilms.com | | |
| Until Forever Photography | untilforeverphotography.com | Fort Lauderdale | | | | |
| Rimas Films | rimasfilms.com | Miami | | | | |

## 3. Florists (45)

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

## 4. Cake & dessert (23)

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

## 5. DJs (22)

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

## 6. Bands & live music (17)

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
|---|---|---|---|---|---|---|
| CK Entertainment | ckentertainmentinc.com | South Florida | 954-436-1230 | | | |
| Sekond Nature | sekondnature.com | Fort Lauderdale | 954-607-8334 | | | |
| The Swooners | theswooners.com | South Florida | | | | |
| Heatwave Band | heatwavemusic.com | South Florida | | | | |
| Private Property Band | privatepropertyband.com | Miami / Fort Lauderdale | | | | |
| Haviv Entertainment | shlomohaviv.com | Miami / Fort Lauderdale | | | | |

## 7. Officiants (31)

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
|---|---|---|---|---|---|---|
| All Faith Ministry | allfaithministry.com | Fort Lauderdale | | | | |
| Wedding Officiant Fort Lauderdale | weddingofficiantfortlauderdale.com | Fort Lauderdale | 954-240-6234 | | | |
| Weddings by Lowell | weddingsbylowell.com | South Florida | | | | |
| From Engaged To Married | fromengagedtomarried.com | South Florida | | | | |
| South Florida Wedding Officiant & Notary | southfloridaweddingofficiantnotary.com | South Florida | | | | |
| Rainbow Notary & Nuptials | rainbownotaryandnuptials.com | Miami / Fort Lauderdale | 954-579-3953 | southfloridarainbows@gmail.com | | |
| Just UnI Weddings | | South Florida | | | | |
| Marry Me, LLC | | South Florida | | | | |

## 8. Hair & makeup (23)

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
|---|---|---|---|---|---|---|
| Asteria Beauty Studio | asteriamakeup.net | Fort Lauderdale | 954-531-8831 | bookings@asteriabeautystudio.com | | |
| Robbin Junnola Beauty | robbinjunnolabeauty.com | Fort Lauderdale (6278 N Federal Hwy #144) | | | | |
| Hans on Beauty | hansonbeauty.com | South Florida | 954-667-9940 | | | |
| Faces by April | facesbyapril.com | Coral Springs / Fort Lauderdale | | | | |
| Jules Fleming Artistry | julesflemingartistry.com | Fort Lauderdale | | | | |
| Courtney Christopherson Glamour Group | courtneychristopherson.com | Boca Raton / Palm Beach | 561-289-2138 | | | |
| PriscillaM Beauty | priscillambeauty.com | South Florida | | | | |
| Glam By Carmen | glambycarmen.info | South Florida | | | | |

## 9. Planners (33)

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

## 10. Caterers (20)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Bill Hansen Catering | billhansencatering.com | Coconut Grove | 305-858-6660 |  | | serves Miami + Ft Lauderdale |
| Thierry Isambert Culinary & Event Design | thierryisambert.com | Miami (915 NW 72nd St) | 305-635-6626 |  | |  |
| Miami Wedding Caterer | miamiweddingcaterer.net | Miami (7049 SW 47th St) | 305-669-5221 |  | |  |
| Chef's Delights Catering |  | Miami (3520 NW 50th St) | 786-287-6283 |  | |  |
| Catering By Lovables |  | Miami (860 NE 79th St) | 305-640-1921 |  | |  |
| A Paella Party |  | Miami | 305-252-6669 |  | |  |
| VNV Events | vnvevents.com | Sunrise |  |  | |  |
| Premier Event Catering | eatwithpremier.com | Aventura |  |  | | kosher |
|---|---|---|---|---|---|---|
| Another Perfect Party | anotherperfectparty.com | Palm Beach / Broward / Dade | | | | |
| 954 Catering | catering954.com | Fort Lauderdale | | | | |
| Boca Joe's Catering | bocajoescatering.com | South Florida | | | | |
| Hugh's Catering | hughscatering.com | South Florida | | | | |
| Catering by Kerrisha | cateringbykerrisha.com | South Florida | | | | |
| Florida Cater | floridacater.com | Fort Lauderdale | | | | |
| Eggwhites Catering | eggwhitescatering.com | Miami | 305-892-2066 | | | |
| Elegant Kosher Catering & Events | elegantkoshercatering.com | Miami / Fort Lauderdale | | | | |
| Eden Catering | kosherweddingsmiami.com | Hollywood | | | | |
| Shaike's Kosher Catering | shaikes.com | Southeast Florida | | | | |
| Kosher From Z Heart | kosherfromzheart.com | South Florida | | | | |
| Culinary Artz Catering | | South Florida | 954-803-8818 | | | **may be the same business as Florida Cater - same site, check before publishing** |

## 11. Venues (45) — approach last

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

## 12. Transportation (17)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Rumbatours Miami | rumbatoursmiami.com | Miami |  |  | | classic cars + coaches |
| A Family Limo | afamilylimo.com | Miami |  |  | | Rolls-Royce + charter |
| American Limo & Transportation Service | americanlimofl.com | Miami |  |  | |  |
| American Dream Tour Miami | americandreamtourmiami.com | Miami |  |  | | classic convertibles |
| Miami White Trolley | miamiwhitetrolley.com | Miami |  |  | | trolley, 30 passengers |
| Molly's Trolleys of West Palm Beach |  | West Palm Beach |  |  | | 1920s-style trolleys |
| Atlantic Charters | atlanticchartersinc.com | Fort Lauderdale | 954-448-2032 |  | | charter buses |
| Premier Bus Charters |  | Sunny Isles Beach |  |  | |  |
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

## 13. Photo booth (7)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Glowshot | glowshotevents.com | Miami | 305-303-5740 |  | |  |
| Ace Photobooth Rentals | acephotoboothrentals.com | Fort Lauderdale |  |  | |  |
| Esteem 360 Studios | esteem360studios.com | South Florida |  |  | |  |
| The Gala Photobooth | thegalaphotobooth.com | Fort Lauderdale |  |  | |  |
| MIA Mirror Booth | miamirrorbooth.com | Miami |  |  | |  |
| Photo Booth by LNH | photoboothlnh.com | South Florida |  |  | |  |
| JuJu Booth | jujubooth.com | South Florida |  |  | |  |

## 14. Lighting (5)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Rent For Event | rentforevent.com | Miami | 877-409-6999 |  | | **two conflicting numbers published - verify** |
| Miami Party DJ | miamipartydj.com | Miami | 305-609-6707 |  | |  |
| DJ Peoples |  | Miami | 305-328-9492 |  | | **three numbers published - verify** |
| Kings Rentals | kings-rental.com | Miami | 786-541-4892 | kingsrental@hotmail.com | |  |
| Miami Uplighting Rentals | miamiuplightingrentals.com | Miami | 786-755-3431 |  | |  |

## 15. Bridal salon (16)

| Business | Website | City | Phone | Email | Sent | Outcome |
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

## 16. Rentals (11)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Mi Vintage |  | Miami |  |  | | decor + rentals |
| Eventluxe Rentals |  | Miami |  |  | | decor + rentals |
| Elements and Access Event Rentals |  | Doral |  |  | | **5+yr old listing - verify** |
| Arc Divine | arcdivine.com | Miami | 954-319-6126 |  | | chuppah + arch rental; resolves the unattributed 954-319-6126 seen earlier |
| Arches By Design | archesbydesign.com | South Florida |  |  | | builds in-house, incl. the Keys |
| Eventgi Party Rental | eventgipartyrental.com | Miami |  |  | |  |
|---|---|---|---|---|---|---|
| Allure Party Rentals | allurepartyrentals.com | Fort Lauderdale | 954-598-9595 |  | |  |
| Christina's Party Rentals | christinaspartyrentals.net | Miami |  |  | |  |
| Over the Top Rental Linens |  | Fort Lauderdale |  |  | | linens |
| Weston Events Party Rentals |  | Weston |  |  | |  |
| Imperial Event Rentals | imperialeventrentals.com | Miami |  |  | |  |

## 17. Bar service (6)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Fire Water Bars | firewaterbars.com | South Florida |  |  | |  |
| With A Twist Bartending Service | twistbartendingservice.com | South Florida |  |  | |  |
| Bar2Hire USA |  | South Florida |  |  | |  |
| Craft Bar Co. |  | Deerfield Beach |  |  | |  |
| Cocktail Couture Mobile |  | Fort Lauderdale |  |  | |  |
| Mr Barrtenderr | mrbarrtenderr.com | South Florida |  |  | |  |

## 18. Ceremony music (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| The Elegant Harp | elegantharp.net | West Palm Beach |  |  | | harp + string quartet |
| Serenade Events | serenadeevents.com | South Florida |  |  | | strings |
| Jade Strings | jadestrings.com | South Florida |  |  | | strings |
| Manhattan Music | manhattanmusic.com | South Florida |  |  | |  |

## 19. Stationery (16)

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

## 23. Jeweler (3)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Kirk Jewelers | kirkjewelers.com | Miami | 305-371-1321 |  | |  |
| Jae's Jewelers | jaesjewelers.com | Coral Gables | 305-443-7724 |  | |  |
| Nemaro Jewelers | nemarojewelers.com | Miami | 305-358-4399 |  | |  |

## 24. Decor (4)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Balloon World Events | myballoonworld.com | Fort Lauderdale | 954-702-6109 | events@myballoonworld.com | |  |
| DreamARK Events | dreamarkevents.com | Fort Lauderdale |  |  | | ceiling balloon decor |
| Fashion Balloons | fashion-balloons.com | Miami |  |  | |  |
| Drapeworks | drapeworks.com | Miami |  |  | | pipe + drape, ceiling draping |

## 25. Alterations (5)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Emma Couture & Alterations |  | Miami |  |  | |  |
| Marina Mella Tailoring | marinamellatailoring.com | Miami |  |  | |  |
| Clothing Solutions |  | Weston |  |  | | also serves the Keys |
| Needlestitch |  | Fort Lauderdale |  |  | |  |
| B&P Alterations |  | Fort Lauderdale |  |  | |  |







---

## What to do with this

1. **Call the 151 above, unflagged ones first.** The only step waiting on
   nothing. Confirm the business, ask for the best address, and attach it on
   `/admin/claims` — no email of ours is sent, so this works today.
2. **Resolve the `TERMS.md` mailing address.** Nothing can be *emailed* until
   then. The phone-claim flow is the way around it, not a replacement for it:
   fixing the TODO unblocks the other 293 rows.
3. **Then photographers and florists** — the top two categories, 102 names.
   Open each site, take the published contact email, fill the row. This needs
   the egress block lifted (see the top of this file) or a human with a
   browser.
4. **Create claim listings in small batches** as rows complete, using the
   `create_claimable_listing` call in `VENDOR-OUTREACH.md`. Copy each token
   immediately: only its SHA-256 is stored, so a lost link cannot be recovered —
   delete the row and make a new listing.
5. **Send 20–30 a day, hand-written**, one metro at a time. Claim links expire
   after 60 days, so do not mint more than you will actually send inside that
   window. Minting all 444 at once creates 444 credentials and 444 expiries.

   **This no longer applies: 443 of the 444 are imported.** Every row below
   except `Marry Me Mendez` is in the database as a listing whose claim token
   was generated and discarded, so the email-match path on `/admin/claims` is
   the *only* route for all of them — there is no link to send to anyone.
   292 are published and visible on `/vendors`; the rest are drafts, held
   because they have neither a phone nor a website and so give a couple no way
   to make contact.
6. **One follow-up after 5–7 days, then stop permanently.**
7. **Ask the ones who publish to link back.** Per the flywheel in
   `COUPLES-ACQUISITION.md`, that inbound link is worth more to the couples side
   than the listing is to the vendor.

Throw this file away once there are 50 published listings in one metro — at that
point the pitch changes from "help me start this" to "your competitors are here".
