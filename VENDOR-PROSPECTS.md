# South Florida vendor prospects

A research shortlist for the founding-vendor outreach in `VENDOR-OUTREACH.md`.
117 real businesses across 11 categories, sourced from public web search
on 2026-10-01.

**This is a prospect list, not data to publish.** Nothing here has been added to
the database. When a row is complete, it becomes a *draft* claimable listing via
`create_claimable_listing` — nothing is public until the vendor claims it and
chooses to publish.

## Read this before using it

Two things are missing, and the first one is why there is a file here instead of
rows in the database.

**1. No contact emails.** The session that built this could run web *search* but
could not open the vendors' own websites — the network egress proxy blocked every
one of them. So every name, URL, address and phone below came from a search
result, and the email did not. A claim link needs somewhere to go, so **the email
is the one field that still has to be gathered by hand**, from each business's own
published contact page.

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
  section above; 19 of the 117 qualify.
- **Email** — deliberately empty. Fill from the vendor's own site.
- **Sent / Outcome** — the tracking `VENDOR-OUTREACH.md` asks for. Record a "no"
  and a "no reply" differently: a "no" is permanent.

Verify before you contact. A search snippet is a lead, not a fact — check the
business still trades, still does weddings, and is in the metro before you spend
a claim link on it.

## Call these 19 first — the only unblocked path

Every table below has a **Phone** column, and 19 rows have a number because the
search result published one. Those 19 are the only prospects that can be
contacted **today**, and the reason is worth stating plainly:

- **No email is needed.** The rest of this list has no contact address, and the
  vendors' own sites cannot be reached from the environment that built it, so
  the Email column is empty by design rather than by oversight.
- **CAN-SPAM does not apply to a phone call.** The unresolved
  `[TODO: mailing address for legal notices]` in `TERMS.md` blocks commercial
  *email*. It does not block picking up the phone.

So this is the one column of this list that is not waiting on anything.

| Business | Category | Phone |
|---|---|---|
| Eddie B & Company | DJ | 954-721-9911 |
| A1A DJs | DJ | 954-531-8146 |
| All Events DJ Services | DJ | 954-290-6032 |
| CK Entertainment | Band | 954-436-1230 |
| Sekond Nature | Band | 954-607-8334 |
| Asteria Beauty Studio | Hair & makeup | 954-531-8831 |
| Hans on Beauty | Hair & makeup | 954-667-9940 |
| Courtney Christopherson Glamour Group | Hair & makeup | 561-289-2138 |
| Blue Orchid Events & Design | Planner | 248-840-4204 |
| Très Chic Event Planning & Design | Planner | 954-517-1818 |
| A. Marie Events & Design | Planner | 321-205-8326 |
| Event Bliss Design | Planner | 954-463-9120 |
| AM Event Co. | Planner | 954-588-7869 |
| Fabuluxe Events | Planner | 561-254-2041 |
| LoveLee Bakeshop | Cake | 954-715-2050 |
| We Take The Cake | Cake | 954-764-2253 |
| Panchis Bakery | Cake | 754-600-3370 |
| La Cake Cafe | Cake | 754-779-2965 |
| Wedding Officiant Fort Lauderdale | Officiant | 954-240-6234 |

**Read this against the priority order below, not instead of it.** These are
DJs, planners, hair and makeup and bakeries — categories 4 through 8. The
photographers and florists that `VENDOR-OUTREACH.md` says to approach first are
not here, because the numbers landed wherever search happened to publish one,
not where the priority is. Calling a planner today still beats waiting on a
photographer's email address, but it is a detour, not the plan.

**What a call is for: one email address.** Ask for the best address to send
their listing link to, then a claim listing can be created and the link sent.
A listing minted off the back of a conversation is the strongest kind — they
have already said yes, so it is not cold outreach at all.

Record the outcome in the category table, not here, so there is one row per
business.

## Order of attack

`VENDOR-OUTREACH.md` ranks these, and the ranking matters more than the count:
photographers and florists first (visual portfolio, actively chase SEO, usually
one decision-maker), venues and caterers last (multiple decision-makers, existing
marketing contracts, no urgency). The categories below are in that order. The
four hotel venues are marked **corporate** — they have a marketing department and
will be the slowest yes on this entire list.

---

## 1. Photographers (18)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Lenisse Komatsu Photography | lenisse.com | Fort Lauderdale | | | | |
| Couture Bridal Photography | couturebridalphotography.com | Boca Raton (137 E Palmetto Park Rd) | | | | |
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
| Vanessa + Johnny | vanessaandjohnny.com | South Florida | | | | |
| Bruna Bastos Photography | | Boca Raton (3601 N Dixie Hwy) | | | | |
| Kenneth Appelbaum Photography | | Boca Raton (121 NW 43rd St) | | | | |
| Beautiful Memories Studio | | Fort Lauderdale | | | | |
| Andrea Harborne Photography | | Fort Lauderdale | | | | |

## 2. Videographers (7)

Vanessa + Johnny and Boogietek above shoot both — approach once, not twice.

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Andreo Studio | andreostudio.com | Miami / West Palm Beach | | | | |
| Megaset Weddings | megasetphotography.com | South Florida | | | | |
| Quality Media FL | qualitymediafl.com | Boca Raton | | | | |
| South Florida Wedding Studio | southfloridaweddingstudio.com | South Florida | | | | |
| A Creation Films | acreationfilms.com | Miami | | | | |
| Until Forever Photography | untilforeverphotography.com | Fort Lauderdale | | | | |
| Rimas Films | rimasfilms.com | Miami | | | | |

## 3. Florists (16)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Bayfront Floral & Event Design | bayfrontfloral.com | Fort Lauderdale (3414 Griffin Rd) | | | | |
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

## 4. Cake & dessert (9)

| Business | Website | City | Phone | Email | Sent | Outcome |
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

## 5. DJs (13)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Eddie B & Company | eddieb.com | Fort Lauderdale | 954-721-9911 | | | |
| A1A DJs | a1adjs.com | South Florida | 954-531-8146 | | | |
| All Events DJ Services | alleventsdjservices.com | South Florida | 954-290-6032 | | | |
| Xpress Entertainment | xpressdjs.com | Miami / Fort Lauderdale | | | | |
| Edifying Beats | edifyingbeats.com | South Florida | | | | |
| Vision DJs | visiondjs.com | South Florida | | | | |
| Deco DJs | decodjs.com | South Florida | | | | |
| DJ AJ Falcon | djajfalcon.com | Miami | | | | |
| Power Parties | powerparties.com | Miami / Fort Lauderdale | | | | |
| NYX Events | nyxevents.com | Boca Raton | | | | |
| Masso Entertainment | massoentertainment.com | West Palm Beach | | | | |
| Vivid Source Events | vividsourceevents.com | Palm Beach County | | | | |
| Traxx Entertainment | traxxentertainment.com | Florida | | | | |

## 6. Bands & live music (6)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| CK Entertainment | ckentertainmentinc.com | South Florida | 954-436-1230 | | | |
| Sekond Nature | sekondnature.com | Fort Lauderdale | 954-607-8334 | | | |
| The Swooners | theswooners.com | South Florida | | | | |
| Heatwave Band | heatwavemusic.com | South Florida | | | | |
| Private Property Band | privatepropertyband.com | Miami / Fort Lauderdale | | | | |
| Haviv Entertainment | shlomohaviv.com | Miami / Fort Lauderdale | | | | |

## 7. Officiants (8)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| All Faith Ministry | allfaithministry.com | Fort Lauderdale | | | | |
| Wedding Officiant Fort Lauderdale | weddingofficiantfortlauderdale.com | Fort Lauderdale | 954-240-6234 | | | |
| Weddings by Lowell | weddingsbylowell.com | South Florida | | | | |
| From Engaged To Married | fromengagedtomarried.com | South Florida | | | | |
| South Florida Wedding Officiant & Notary | southfloridaweddingofficiantnotary.com | South Florida | | | | |
| Rainbow Notary & Nuptials | rainbownotaryandnuptials.com | Miami / Fort Lauderdale | | | | |
| Just UnI Weddings | | South Florida | | | | |
| Marry Me, LLC | | South Florida | | | | |

## 8. Hair & makeup (8)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Asteria Beauty Studio | asteriamakeup.net | Fort Lauderdale | 954-531-8831 | | | |
| Robbin Junnola Beauty | robbinjunnolabeauty.com | Fort Lauderdale (6278 N Federal Hwy #144) | | | | |
| Hans on Beauty | hansonbeauty.com | South Florida | 954-667-9940 | | | |
| Faces by April | facesbyapril.com | Coral Springs / Fort Lauderdale | | | | |
| Jules Fleming Artistry | julesflemingartistry.com | Fort Lauderdale | | | | |
| Courtney Christopherson Glamour Group | courtneychristopherson.com | Boca Raton / Palm Beach | 561-289-2138 | | | |
| PriscillaM Beauty | priscillambeauty.com | South Florida | | | | |
| Glam By Carmen | glambycarmen.info | South Florida | | | | |

## 9. Planners (9)

| Business | Website | City | Phone | Email | Sent | Outcome |
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

## 10. Caterers (12)

| Business | Website | City | Phone | Email | Sent | Outcome |
|---|---|---|---|---|---|---|
| Another Perfect Party | anotherperfectparty.com | Palm Beach / Broward / Dade | | | | |
| 954 Catering | catering954.com | Fort Lauderdale | | | | |
| Boca Joe's Catering | bocajoescatering.com | South Florida | | | | |
| Hugh's Catering | hughscatering.com | South Florida | | | | |
| Catering by Kerrisha | cateringbykerrisha.com | South Florida | | | | |
| Florida Cater | floridacater.com | Fort Lauderdale | | | | |
| Eggwhites Catering | eggwhitescatering.com | Miami | | | | |
| Elegant Kosher Catering & Events | elegantkoshercatering.com | Miami / Fort Lauderdale | | | | |
| Eden Catering | kosherweddingsmiami.com | Hollywood | | | | |
| Shaike's Kosher Catering | shaikes.com | Southeast Florida | | | | |
| Kosher From Z Heart | kosherfromzheart.com | South Florida | | | | |
| Culinary Artz Catering | | South Florida | | | | |

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

1. **Call the 19 above.** The only step waiting on nothing. Ask each for the
   best address to send their listing link to, and fill in their Email cell.
2. **Resolve the `TERMS.md` mailing address.** Nothing can be *emailed* until
   then — including a claim link to someone who asked for one on the phone.
3. **Then photographers and florists** — the top two categories, ~34 names.
   Open each site, take the published contact email, fill the row.
4. **Create claim listings in small batches** as rows complete, using the
   `create_claimable_listing` call in `VENDOR-OUTREACH.md`. Copy each token
   immediately: only its SHA-256 is stored, so a lost link cannot be recovered —
   delete the row and make a new listing.
5. **Send 20–30 a day, hand-written**, one metro at a time. Claim links expire
   after 60 days, so do not mint more than you will actually send inside that
   window. Minting all 117 at once creates 117 credentials and 117 expiries.
6. **One follow-up after 5–7 days, then stop permanently.**
7. **Ask the ones who publish to link back.** Per the flywheel in
   `COUPLES-ACQUISITION.md`, that inbound link is worth more to the couples side
   than the listing is to the vendor.

Throw this file away once there are 50 published listings in one metro — at that
point the pitch changes from "help me start this" to "your competitors are here".
