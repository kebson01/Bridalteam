# South Florida vendor prospects

A research shortlist for the founding-vendor outreach in `VENDOR-OUTREACH.md`.
190 real businesses across 11 categories, sourced from public web search in two
passes: 117 on 2026-10-01, a further 73 on 2026-10-07. The second pass also
filled gaps in 11 rows from the first, so a row's data may be newer than the
row.

**This is a prospect list, not data to publish.** Nothing here has been added to
the database. When a row is complete, it becomes a *draft* claimable listing via
`create_claimable_listing` — nothing is public until the vendor claims it and
chooses to publish.

## Read this before using it

Two things are missing, and the first one is why there is a file here instead of
rows in the database.

**1. Almost no contact emails — 15 of 190.** The sessions that built this could
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

For the remaining 175 rows the email still has to be gathered by hand, from each
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
  section above; 60 of the 190 qualify.
- **Email** — empty on 175 of 190 rows. Fill from the vendor's own site. Where
  one is present it came from a search snippet, so confirm it before use.
- **Outcome** — also carries research flags (`verify`, `do not mail`,
  `corporate`) until there is a real outcome to record.
- **Sent / Outcome** — the tracking `VENDOR-OUTREACH.md` asks for. Record a "no"
  and a "no reply" differently: a "no" is permanent.

Verify before you contact. A search snippet is a lead, not a fact — check the
business still trades, still does weddings, and is in the metro before you spend
a claim link on it.

## Call these 60 first — the widest unblocked path

Every table below has a **Phone** column, and 60 of the 190 rows have a number
because a search result published one. Those 60 can be contacted **today**:

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
| Couture Bridal Photography | Photographer | 954-399-0741 |  |
| Deivis Archbold Photography | Photographer | 954-945-8116 |  |
| Little's Photography | Photographer | 954-563-0444 |  |
| Michael Murphy Photographic Imaging | Photographer | 877-564-8555 |  |
| Vanessa + Johnny | Photographer | 310-819-6544 |  |
| A Creation Films | Videographer | 305-928-8685 |  |
| South Florida Wedding Studio | Videographer | 954-778-2267 |  |
| Bayfront Floral & Event Design | Florist | 954-981-1024 |  |
| Beautiful Kreations | Florist | 954-933-7530 |  |
| Concept Flowers | Florist | 305-300-4758 |  |
| Cortez Event Agency | Florist | 786-983-7092 |  |
| Flowers Unveiled | Florist | 954-806-8406 |  |
| Jose Graterol Designs | Florist | 305-788-0562 |  |
| La Cake Cafe | Cake | 754-779-2965 |  |
| LoveLee Bakeshop | Cake | 954-715-2050 |  |
| Panchis Bakery | Cake | 754-600-3370 |  |
| We Take The Cake | Cake | 954-764-2253 |  |
| A1A DJs | DJ | 954-531-8146 |  |
| All Events DJ Services | DJ | 954-290-6032 |  |
| Eddie B & Company | DJ | 954-721-9911 |  |
| Vision DJs | DJ | 954-418-2203 |  |
| CK Entertainment | Band | 954-436-1230 |  |
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
| Marry Me Mendez | Officiant | 305-439-5553 |  |
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
| A. Marie Events & Design | Planner | 321-205-8326 |  |
| AM Event Co. | Planner | 954-588-7869 |  |
| Blue Orchid Events & Design | Planner | 248-840-4204 |  |
| Event Bliss Design | Planner | 954-463-9120 |  |
| Fabuluxe Events | Planner | 561-254-2041 |  |
| Ideal Events | Planner | 305-709-1900 |  |
| Tres CHIC Event Planning & Design | Planner | 954-517-1818 |  |
| Très Chic Event Planning & Design | Planner | 954-517-1818 |  |
| A Paella Party | Caterer | 305-252-6669 |  |
| Bill Hansen Catering | Caterer | 305-858-6660 |  |
| Catering By Lovables | Caterer | 305-640-1921 |  |
| Chef's Delights Catering | Caterer | 786-287-6283 |  |
| Culinary Artz Catering | Caterer | 954-803-8818 |  |
| Eggwhites Catering | Caterer | 305-892-2066 |  |
| Miami Wedding Caterer | Caterer | 305-669-5221 |  |
| Thierry Isambert Culinary & Event Design | Caterer | 305-635-6626 |  |

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

## 1. Photographers (21)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Deivis Archbold Photography | deivisarchbold.com | Fort Lauderdale (6555 Power Line Rd) | 954-945-8116 |  | |  |
| Little's Photography | littlesphotography.com | Fort Lauderdale (2552 N Federal Hwy) | 954-563-0444 |  | | weddings one of several services |
| Michael Murphy Photographic Imaging |  | Fort Lauderdale (261 NE 32nd Ct) | 877-564-8555 |  | | event photographer; toll-free line |
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
| Vanessa + Johnny | vanessaandjohnny.com | South Florida | 310-819-6544 | hello@vanessaandjohnny.com | | |
| Bruna Bastos Photography | | Boca Raton (3601 N Dixie Hwy) | | | | |
| Kenneth Appelbaum Photography | | Boca Raton (121 NW 43rd St) | | | | |
| Beautiful Memories Studio | | Fort Lauderdale | | | | |
| Andrea Harborne Photography | | Fort Lauderdale | | | | |

## 2. Videographers (10)

Vanessa + Johnny and Boogietek above shoot both — approach once, not twice.

| Business | Website | City | Phone | Email | Sent | Outcome |
| Marksman Visuals |  | Coconut Creek |  |  | |  |
| PRIMEUS Photography & Video |  | Miami |  |  | |  |
| Videography by Cristina |  | Sunrise |  |  | |  |
|---|---|---|---|---|---|---|
| Andreo Studio | andreostudio.com | Miami / West Palm Beach | | | | |
| Megaset Weddings | megasetphotography.com | South Florida | | | | |
| Quality Media FL | qualitymediafl.com | Boca Raton | | | | |
| South Florida Wedding Studio | southfloridaweddingstudio.com | South Florida | 954-778-2267 | | | |
| A Creation Films | acreationfilms.com | Miami | 305-928-8685 | hello@acreationfilms.com | | |
| Until Forever Photography | untilforeverphotography.com | Fort Lauderdale | | | | |
| Rimas Films | rimasfilms.com | Miami | | | | |

## 3. Florists (26)

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

## 4. Cake & dessert (18)

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

## 5. DJs (15)

| Business | Website | City | Phone | Email | Sent | Outcome |
| The Mix DJs | themixdjs.com | Miami / Fort Lauderdale / WPB |  |  | |  |
| Event Factor | theeventfactor.com | Miami |  |  | |  |
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

## 6. Bands & live music (14)

| Business | Website | City | Phone | Email | Sent | Outcome |
| FM Band Miami |  | Miami |  |  | |  |
| Bay Kings Band |  | South Florida |  |  | |  |
| Heatwave Music & Entertainment |  | Boca Raton |  |  | |  |
| Shane Duncan Band |  | Fort Lauderdale |  |  | |  |
| AAMusicians |  | Miami |  |  | |  |
| Inner Music Management |  | Miami |  |  | |  |
| Sunbeat Entertainment |  | Miami |  |  | |  |
| La Nota Band |  | Miami |  |  | |  |
|---|---|---|---|---|---|---|
| CK Entertainment | ckentertainmentinc.com | South Florida | 954-436-1230 | | | |
| Sekond Nature | sekondnature.com | Fort Lauderdale | 954-607-8334 | | | |
| The Swooners | theswooners.com | South Florida | | | | |
| Heatwave Band | heatwavemusic.com | South Florida | | | | |
| Private Property Band | privatepropertyband.com | Miami / Fort Lauderdale | | | | |
| Haviv Entertainment | shlomohaviv.com | Miami / Fort Lauderdale | | | | |

## 7. Officiants (26)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Just Married by Rosy | justmarriedbyrosy.com | Miami | 305-610-0308 | rosyfigueroa7@gmail.com | | **personal-looking email - do not mail** |
| Patti Roman |  | Miami / Cutler Bay | 305-283-7647 | rainbowpatti2020@gmail.com | | **personal-looking email - do not mail** |
| Eddie Rodriguez |  | Miami | 305-596-1810 |  | | Eventective listing |
| Marry Me Mendez |  | Miami | 305-439-5553 |  | | Eventective listing |
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
|---|---|---|---|---|---|---|
| All Faith Ministry | allfaithministry.com | Fort Lauderdale | | | | |
| Wedding Officiant Fort Lauderdale | weddingofficiantfortlauderdale.com | Fort Lauderdale | 954-240-6234 | | | |
| Weddings by Lowell | weddingsbylowell.com | South Florida | | | | |
| From Engaged To Married | fromengagedtomarried.com | South Florida | | | | |
| South Florida Wedding Officiant & Notary | southfloridaweddingofficiantnotary.com | South Florida | | | | |
| Rainbow Notary & Nuptials | rainbownotaryandnuptials.com | Miami / Fort Lauderdale | 954-579-3953 | southfloridarainbows@gmail.com | | |
| Just UnI Weddings | | South Florida | | | | |
| Marry Me, LLC | | South Florida | | | | |

## 8. Hair & makeup (14)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Tashy Marie Beauty | tashymariebeauty.com | South Florida |  |  | | page ~2yr old - verify |
| Divine Beauty Artists | divinebeautyartists.com | Miami / Fort Lauderdale |  |  | |  |
| Kiss This Makeup | kissthismakeup.com | South Florida |  |  | | team of 85, mobile |
| Aimee Beauty Co |  | Miami |  |  | |  |
| Not Just Blonde Studio (Alissa Westcott) |  | South Florida |  |  | |  |
| Coastal Pearl Beauty |  | South Florida |  |  | |  |
|---|---|---|---|---|---|---|
| Asteria Beauty Studio | asteriamakeup.net | Fort Lauderdale | 954-531-8831 | bookings@asteriabeautystudio.com | | |
| Robbin Junnola Beauty | robbinjunnolabeauty.com | Fort Lauderdale (6278 N Federal Hwy #144) | | | | |
| Hans on Beauty | hansonbeauty.com | South Florida | 954-667-9940 | | | |
| Faces by April | facesbyapril.com | Coral Springs / Fort Lauderdale | | | | |
| Jules Fleming Artistry | julesflemingartistry.com | Fort Lauderdale | | | | |
| Courtney Christopherson Glamour Group | courtneychristopherson.com | Boca Raton / Palm Beach | 561-289-2138 | | | |
| PriscillaM Beauty | priscillambeauty.com | South Florida | | | | |
| Glam By Carmen | glambycarmen.info | South Florida | | | | |

## 9. Planners (17)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Tres CHIC Event Planning & Design | treschiceventplanning.com | Miramar (18741 SW 39th Ct) | 954-517-1818 | info@treschiceventplanning.com | |  |
| Ideal Events | idealeventsweddings.com | Miami | 305-709-1900 | idealevents.miami@gmail.com | |  |
| Luxy Events | luxy-events.com | Lauderhill |  |  | | also in-house catering |
| Stephanie Verrmar | stephanieverrmar.com | Miami |  |  | | planner + florist |
| Gina Marie Weddings & Events | ginamarieevents.com | Miami / Fort Lauderdale / WPB |  |  | |  |
| Memories for You, Weddings and Events | memoriesforyouevents.com | Wellington |  |  | |  |
| Oh My Occasions | ohmyoccasions.com | South Florida |  |  | |  |
| Events by Tahimy |  | Miami |  |  | | Zola listing |
|---|---|---|---|---|---|---|
| Blue Orchid Events & Design | blue-orchid-events.com | Fort Lauderdale | 248-840-4204 | | | |
| Très Chic Event Planning & Design | treschiceventplanning.com | South Florida | 954-517-1818 | | | |
| A. Marie Events & Design | amarieevents.us | Fort Lauderdale | 321-205-8326 | | | |
| Event Bliss Design | eventblissdesign.com | Fort Lauderdale | 954-463-9120 | | | |
| AM Event Co. | ameventco.com | South Florida | 954-588-7869 | | | |
| Fabuluxe Events | fabuluxeevents.com | South Florida | 561-254-2041 | | | |
| Ramos Events | ramosevents.com | Fort Lauderdale | | | | |
| Urbanica Luxury Events | urbanicaevents.com | Fort Lauderdale | | | | |
| Rodriguez Event Design | | South Florida | | | | |

## 10. Caterers (18)

| Business | Website | City | Phone | Email | Sent | Outcome |
| Bill Hansen Catering | billhansencatering.com | Coconut Grove | 305-858-6660 |  | | serves Miami + Ft Lauderdale |
| Thierry Isambert Culinary & Event Design | thierryisambert.com | Miami (915 NW 72nd St) | 305-635-6626 |  | |  |
| Miami Wedding Caterer | miamiweddingcaterer.net | Miami (7049 SW 47th St) | 305-669-5221 |  | |  |
| Chef's Delights Catering |  | Miami (3520 NW 50th St) | 786-287-6283 |  | |  |
| Catering By Lovables |  | Miami (860 NE 79th St) | 305-640-1921 |  | |  |
| A Paella Party |  | Miami | 305-252-6669 |  | |  |
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
| Culinary Artz Catering | | South Florida | 954-803-8818 | | | |

## 11. Venues (11) — approach last

| Business | Website | City | Phone | Email | Sent | Outcome |
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

---

## What to do with this

1. **Call the 60 above, unflagged ones first.** The only step waiting on
   nothing. Confirm the business, ask for the best address, and attach it on
   `/admin/claims` — no email of ours is sent, so this works today.
2. **Resolve the `TERMS.md` mailing address.** Nothing can be *emailed* until
   then. The phone-claim flow is the way around it, not a replacement for it:
   fixing the TODO unblocks the other 130 rows.
3. **Then photographers and florists** — the top two categories, 47 names.
   Open each site, take the published contact email, fill the row. This needs
   the egress block lifted (see the top of this file) or a human with a
   browser.
4. **Create claim listings in small batches** as rows complete, using the
   `create_claimable_listing` call in `VENDOR-OUTREACH.md`. Copy each token
   immediately: only its SHA-256 is stored, so a lost link cannot be recovered —
   delete the row and make a new listing.
5. **Send 20–30 a day, hand-written**, one metro at a time. Claim links expire
   after 60 days, so do not mint more than you will actually send inside that
   window. Minting all 190 at once creates 190 credentials and 190 expiries.

   **This no longer applies to the 117 already imported.** They are in the
   database as unclaimed drafts whose tokens were generated and discarded, so
   for those the email-match path on `/admin/claims` is the *only* route — there
   is no link to send. It applies to the 73 added in the second pass, which are
   not in the database yet.
6. **One follow-up after 5–7 days, then stop permanently.**
7. **Ask the ones who publish to link back.** Per the flywheel in
   `COUPLES-ACQUISITION.md`, that inbound link is worth more to the couples side
   than the listing is to the vendor.

Throw this file away once there are 50 published listings in one metro — at that
point the pitch changes from "help me start this" to "your competitors are here".
