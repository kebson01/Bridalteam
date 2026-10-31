# Finding vendors: six sources, one pipeline

How new vendors get into the directory, as of 31 October 2026. Before this,
every research pass wrote straight into the database and kept its record in
`VENDOR-PROSPECTS.md`. That file still describes the first 930 listings. Every
listing found since then goes through **`public.vendor_leads`**.

## The pipeline

```
 source  ──►  vendor_leads (status 'new')  ──►  import_vendor_leads()  ──►  vendor_profiles
```

`supabase/migrations/20261031120000_vendor_leads.sql` defines all of it.

- **Every lead records where it came from**: `source`, `source_ref` (place_id,
  licence number, or the venue whose list named the vendor), `source_url` and a
  `note` that carries research flags.
- **Deduplication** (`find_vendor_match`) checks the phone's last 10 digits
  first, then the website's domain (directory and social URLs never count),
  then a normalised name, which must match exactly one listing.
- **Matches** are marked `duplicate` and linked to the existing listing. If that
  listing is still unclaimed, its blank phone, website and category are filled
  from the lead, and a draft that becomes contactable publishes. That is the way
  to rescue the 220 drafts that have no phone and no website.
- **New businesses** go through `create_claimable_listing()` as before. They
  publish if they have a phone or a first-party website.
- **Claimed listings are never modified.**
- **A lead with no city or no category is skipped** and stays `new`. Holding a
  lead back for review means leaving its city blank and writing the reason in
  `note`.
- **Recommendations** (`couple_referral` / `vendor_referral`) are never
  bulk-imported. Their emails never become a `contact_email`, because a typed
  address is not a credential.

Review leads at **`/admin/leads`**. You can see counts by source, edit a lead's
name, category, city, phone or website, then import or reject it, or
bulk-import every new researched lead.

## The six sources

| # | Source | `source` | How to run it | Status |
|---|---|---|---|---|
| 1 | Web search | `web_search` | A research session writes JSON, then `node scripts/vendor-leads.mjs json file.json` | **Running.** 50 leads on 2026-10-31. |
| 2 | Google Places | `google_places` | `GOOGLE_PLACES_API_KEY=… node scripts/vendor-leads.mjs places --query "wedding florist" --city Naples` | **Blocked on an API key.** `places.googleapis.com` is reachable from cloud sessions. |
| 3 | County business tax receipts | `county_btr` | Download the county's export, then `node scripts/vendor-leads.mjs csv btr.csv --source county_btr --map name=…,city=…,phone=…,type=…,ref=… --where STATUS=Active` | **Ready, needs a file.** The county open-data portals are blocked from cloud sessions. Download by hand and commit or upload the CSV. |
| 4 | DBPR licence files | `dbpr` | The same, with `--source dbpr`. Add `--category Caterer` for a file that holds only one licence type. | **Ready, needs a file.** `myfloridalicense.com` is blocked from cloud sessions. |
| 5 | Venue preferred lists and associations | `venue_preferred`, `association` | Research JSON with `source` and `source_ref` per item | **Running.** 50 venue-list leads on 2026-10-31. Association directories found so far are behind member logins. |
| 6 | Recommendations | `couple_referral`, `vendor_referral` | The "Recommend a vendor" form on `/vendors` (signed-in users, capped at 20 a day) | **Live.** Review on `/admin/leads`. |

### Notes per source

- **Google Places.** The script keeps only the `place_id`, the name, the city
  and the category. The Google Maps Platform terms allow storing a `place_id`
  indefinitely but not caching other Places content, and a listing is
  permanent. So a Places lead is a *discovery*. It imports as a draft and
  publishes once a web-search pass finds its phone or website on the
  business's own pages.
- **Tax rolls and licence files** list every trade. `mapCategory()` keeps only
  rows whose business type (or failing that, name) is clearly a wedding
  vendor. "Financial planner", "interior decorator" and "car rentals" are
  dropped on purpose, and `scripts/vendor-leads.test.ts` pins those cases.
  Expect a 10,000-row county file to yield a few hundred leads.
- **SunBiz is not a source.** It has no business type, phone or website.
  Allowing `search.sunbiz.org` would make it a good *check* (is this entity
  still active?), not a way to discover vendors.

## Re-running safely

The generated SQL ends in `on conflict do nothing`. Licence, BTR and Places
leads are unique on `(source, source_ref)`. List leads are unique on
`(source, list, name)`. Paste the SQL into the Supabase SQL editor, then run:

```sql
select * from public.import_vendor_leads();          -- every researched source
select * from public.import_vendor_leads('dbpr');    -- one source
```

## Import of 2026-10-31

There were 101 researched leads, and 100 remained after an in-file duplicate
(Michael's On East appeared in both files) was removed. **84 were imported and
published.** None matched an existing listing, because the research had
already deduped against the directory. **16 are held as `new`** on
`/admin/leads` with the reasons below. Phones and URLs came from search
results, not first-party pages, and many carry a "dated source" note.

City values like *Central Florida*, *South Florida* and *Tampa Bay* are used
for venue-list vendors whose own city was not stated. The vendor serves the
venue's region, and `lib/areas.ts` renders those values as "Serves all of …".

### Held for review (16)

| Business | Category | Phone | Why held |
|---|---|---|---|
| McKee Botanical Garden | Venue | 772-794-0601 | 2026 policy may bar weddings (city: Vero Beach) |
| Cocoa Beach Pier | Venue | 321-783-7549 | owned by Westgate (chain rule?) (city: Cocoa Beach) |
| Feast Your Eyes | Caterer | 772-584-3447 | stale source, weddings unconfirmed (city: Vero Beach) |
| Pensacola Yacht Club | Venue | 850-433-6773 | private club, weddings unconfirmed (city: Pensacola) |
| Vue on 30A | Venue | 850-267-1240 | two sources give different phones (city: Santa Rosa Beach) |
| Brides by Kelly Anne + Co | Hair & makeup | 941-465-9449 | phone matched by list position (city: Sarasota) |
| Celine Michelle Photography | Photography | 239-440-3343 | wedding focus unconfirmed (city: Naples) |
| Isles Yacht Club | Venue | 941-639-7551 | private club, weddings unconfirmed (city: Punta Gorda) |
| Barefoot Weddings | Officiant | 941-952-1440 | may already be listed in Tampa Bay (city: Sarasota) |
| KND On The Rocks | Bar service | 678-938-4259 | messy page, phone pairing unverified |
| The Happy Hour Chefs | Caterer | 954-840-8135 | messy page, phone pairing unverified |
| The Asado Authority | Caterer | 305-305-2620 | messy page, phone pairing unverified |
| DJ AK Vibes | DJ | 754-256-8739 | messy page, phone pairing unverified |
| Ceremonies by Kat | Officiant | 305-942-0067 | messy page, phone pairing unverified |
| Alexander Event Catering | Caterer | 786-577-4627 | shares a phone with Bill's Catering (listed) |
| Sarasota Catering Co. | Caterer | 941-927-7675 | venue list not seen directly |
### Imported (84)

| Business | Category | City | Phone | Source |
|---|---|---|---|---|
| 2 Sisters Events & Design | Wedding planner | Central Florida | 863-698-6978 | Venue list: Bok Tower Gardens |
| Arthur's Catering | Caterer | Central Florida | 407-331-1993 | Venue list: Bok Tower Gardens (required caterers) |
| Cocktails Catering | Caterer | Central Florida | 407-446-2878 | Venue list: Ever After Farms (West Central FL list) |
| Emily Plank Photography | Photography | Central Florida | 863-640-3584 | Venue list: Bok Tower Gardens |
| Garden Party Florals | Florist | Central Florida |  | Venue list: Bok Tower Gardens |
| John Campbell Weddings | Wedding planner | Central Florida | 407-339-4050 | Venue list: Bok Tower Gardens |
| KT Crabb Photography | Photography | Central Florida | 407-476-5822 | Venue list: Bok Tower Gardens |
| L'amour | DJ | Central Florida | 386-290-4290 | Venue list: Ever After Farms (Central & North FL lists) |
| Millenia Event Catering | Caterer | Central Florida | 407-648-2296 | Venue list: Bok Tower Gardens (required caterers) |
| Sandy Stringfellow | Officiant | Central Florida | 863-670-5110 | Venue list: Bok Tower Gardens (wedding officials) |
| Sunshine Soirées | Bar service | Central Florida | 407-758-2068 | Venue list: Ever After Farms (West Central FL list) |
| Swanky I Do's | Wedding planner | Central Florida | 407-415-9477 | Venue list: Bok Tower Gardens |
| Terrie Lobb Catering | Caterer | Central Florida | 863-533-6483 | Venue list: Bok Tower Gardens (premier caterer) |
| Tipsy Tini | Bar service | Central Florida | 813-244-5490 | Venue list: Ever After Farms (Central FL / Citrus list) |
| Weddings Only DJ Entertainment | DJ | Central Florida |  | Venue list: Bok Tower Gardens |
| Chef Papa's Cafe & Catering | Caterer | Daytona Beach | 386-253-5080 | Venue list: Museum of Arts & Sciences (suggested caterers) |
| Museum of Arts and Sciences (MOAS) | Venue | Daytona Beach | 386-255-0285 | Web search |
| Ravish Catering | Caterer | Daytona Beach | 386-320-6335 | Venue list: Museum of Arts & Sciences (suggested caterers) |
| Destin Florida Beach Weddings | Wedding planner | Destin | 850-974-2990 | Web search |
| Burroughs Home & Gardens | Venue | Fort Myers | 239-337-0706 | Web search |
| Edison & Ford Winter Estates | Venue | Fort Myers | 239-335-3689 | Web search |
| Hard Rain Entertainment | DJ | Fort Myers | 239-826-4858 | Web search |
| Coastal Reflections LLC | Photo booth | Fort Walton Beach | 850-582-5711 | Web search |
| Chef's Garden Catering & Events | Caterer | Jacksonville |  | Venue list: Cummer Museum (exclusive caterer); Treasury on the Plaza |
| Brevard Zoo | Venue | Melbourne | 321-254-9453 | Web search |
| Chairs for Affairs Party Rentals | Rentals | Melbourne | 321-259-8252 | Web search |
| Edible Art Catering | Caterer | Melbourne | 321-507-3359 | Web search |
| Hoover AV | Rentals | Melbourne | 321-749-4455 | Web search |
| Naples Historical Society (Historic Palm Cottage) | Venue | Naples | 239-261-8164 | Web search |
| Naples Princess | Venue | Naples | 239-649-2275 | Web search |
| Pink Flamingo at Petals | Florist | New Smyrna Beach | 386-423-5927 | Web search |
| The Riverview Hotel | Venue | New Smyrna Beach | 386-428-5858 | Web search |
| Bartini Orlando | Bar service | Orlando | 407-680-8546 | Venue list: Ever After Farms (West Central & Central FL lists) |
| Big City Catering | Caterer | Orlando | 407-438-3488 | Venue list: Harry P. Leu Gardens (required caterers) |
| CB Catering | Caterer | Orlando | 321-229-5786 | Venue list: Harry P. Leu Gardens (required caterers) |
| Char-Don Catering | Caterer | Orlando | 407-841-3519 | Venue list: Harry P. Leu Gardens (required caterers) |
| Cuisiniers | Caterer | Orlando | 407-975-8763 | Venue list: Harry P. Leu Gardens (required caterers) |
| Dubsdread Catering | Caterer | Orlando | 407-650-9558 | Venue list: Harry P. Leu Gardens (required caterers) |
| Monica's Comfort Foods | Caterer | Orlando | 407-283-4970 | Venue list: Harry P. Leu Gardens (required caterers) |
| Ormond Memorial Art Museum & Gardens | Venue | Ormond Beach | 386-676-3347 | Web search |
| Barkley House | Venue | Pensacola | 850-595-5985 | Web search |
| Emerald Coast Event Rentals | Rentals | Pensacola | 850-281-8311 | Web search |
| Five Flags Trolley | Transportation | Pensacola |  | Web search |
| J's Bakery and Cafe | Cake & dessert | Pensacola | 850-439-6546 | Web search |
| KDH Weddings | Photography | Pensacola | 850-898-2234 | Web search |
| Kristen Coberly Photography | Photography | Pensacola | 850-619-2347 | Web search |
| Portofino Island Resort | Venue | Pensacola Beach | 850-916-3406 | Web search |
| Rockledge Country Club | Venue | Rockledge | 321-636-3160 | Web search |
| Florals by the Sea | Florist | Rosemary Beach | 850-238-8958 | Venue list: Rosemary Beach (exclusive & preferred vendors) |
| Kelsey Barnard Catering | Caterer | Rosemary Beach | 334-446-0885 | Venue list: Rosemary Beach (exclusive & preferred vendors) |
| Myrtie Blue | Florist | Rosemary Beach | 850-243-2500 | Venue list: Rosemary Beach (exclusive & preferred vendors) |
| Peach & Pearl Events | Wedding planner | Santa Rosa Beach | 850-231-0007 | Web search |
| The Chapel of 30A | Venue | Santa Rosa Beach | 850-842-1188 | Web search |
| Beneva Weddings & Events | Florist | Sarasota | 941-308-5161 | Web search |
| Cakes by Ron | Cake & dessert | Sarasota | 941-365-2991 | Web search |
| Flowers by Fudgie | Florist | Sarasota | 941-349-9212 | Web search |
| Marie Selby Botanical Gardens | Venue | Sarasota | 941-366-5731 | Web search |
| Michael's On East | Caterer | Sarasota | 941-366-0007 | Web search |
| Powel Crosley Estate | Venue | Sarasota | 941-722-3244 | Web search |
| Spa Hollywood | Hair & makeup | Sarasota | 941-927-2635 | Web search |
| The Perfect Dress of Sarasota | Bridal salon | Sarasota | 941-366-7780 | Web search |
| Weddings by Rev. Sophie | Officiant | Sarasota | 941-922-5908 | Web search |
| Wonder Cake Creations | Cake & dessert | Sarasota | 941-315-8166 | Web search |
| Rev. Alice B. Monroe | Officiant | Sebring | 863-655-0606 | Venue list: Bok Tower Gardens (wedding officials) |
| Beauty By Nature Weddings | Hair & makeup | South Florida | 772-318-9188 | Venue list: Ever After Farms (South FL list) |
| Better Party Rentals | Rentals | South Florida | 561-893-9900 | Venue list: Morikami Museum and Japanese Gardens |
| Creative Edge Parties | Caterer | South Florida | 305-697-5200 | Venue list: Vizcaya Museum & Gardens (approved caterers FY24-25) |
| Dalsimer Atlas Floral & Event Decorators | Florist | South Florida | 954-418-0608 | Venue list: Morikami Museum; Bonnet House |
| Daniel Events | Decor | South Florida | 561-393-4312 | Venue list: Morikami Museum and Japanese Gardens |
| Deluxe Party Rentals | Rentals | South Florida | 305-609-9477 | Venue list: Bonnet House Museum & Gardens |
| Floral Designs by Yamir | Florist | South Florida | 305-818-2939 | Venue list: Morikami Museum and Japanese Gardens |
| JM Event Productions | Decor | South Florida | 954-755-8688 | Venue list: Morikami Museum and Japanese Gardens |
| Nuage Designs | Rentals | South Florida | 305-573-7840 | Venue list: Bonnet House Museum & Gardens |
| Regency Party Rental & Productions | Rentals | South Florida | 561-966-9322 | Venue list: Morikami Museum and Japanese Gardens |
| Special Event Decorators | Decor | South Florida | 954-326-8902 | Venue list: Morikami Museum and Japanese Gardens |
| Unearthed Vintage | Rentals | South Florida | 305-987-6946 | Venue list: Bonnet House Museum & Gardens |
| St. Augustine Weddings & Special Events | Wedding planner | St. Augustine | 904-814-3011 | Venue list: Treasury on the Plaza |
| Coosh's Bayou Rouge | Caterer | Tallahassee | 850-894-4110 | Web search |
| Goodwood Museum & Gardens | Venue | Tallahassee | 850-877-4202 | Web search |
| Tallahassee Automobile Museum | Venue | Tallahassee | 850-942-0137 | Web search |
| Ostara Florals & Events | Florist | Tampa Bay | 813-492-8610 | Venue list: Ever After Farms (West Central FL / Tampa list) |
| Valiant Air Command Warbird Museum | Venue | Titusville | 321-268-1941 | Web search |
| Always In Bloom Florist | Florist | Vero Beach | 772-770-9204 | Web search |
| Costa d'Este Beach Resort & Spa | Venue | Vero Beach | 772-562-9919 | Web search |