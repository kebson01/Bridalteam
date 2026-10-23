# Researching and adding new vendors

For metros or categories that are thin. Quality beats count: a wrong listing
costs more trust than a missing one.

## Research

- Sources: public web search (Google Maps results by category and city, the
  business's own site, wedding-show exhibitor lists, Instagram location
  search). Use thorough search when contact details matter.
- Record **only what a source actually states**: business name, category,
  city, website, phone. Mark anything uncertain `verify`.
- Emails: only the business's own published address. Leave the field empty
  rather than guess. Flag consumer-domain addresses with a person's name in
  them `personal-looking email: do not mail`.
- Check the business still trades and still does weddings.
- Categories must match `lib/categories.ts`. Cities must fall in a metro in
  `lib/areas.ts`. If neither fits, ask the user before inventing a new one.
- Large businesses with a marketing department (hotel venues, chains) get the
  `corporate` flag.

## Avoid duplicates

Search `VENDOR-PROSPECTS.md` for the business name, the phone number (digits
only) and the website domain before adding. Similar names in the same city
need a closer look. `VENDOR-PROSPECTS.md` records one such case
(`Marry Me Mendez` vs `Marry Me, LLC`), held back because the two couldn't be
told apart.

## Draft the SQL (the user runs it)

`create_claimable_listing` runs only with the service role, in the Supabase
SQL editor. Draft one call per vendor, using the signature in
`supabase/migrations/20260920040000_claimable_vendor_listings.sql`:

```sql
select * from create_claimable_listing(
  p_business_name := '<name>',
  p_category      := '<category from lib/categories.ts>',
  p_city          := '<city>',
  p_region        := 'FL',
  p_website       := '<url or null>',
  p_phone         := '<phone or null>',
  p_email         := null,
  p_description   := '<one factual line from their own site, or null>',
  p_contact_email := null,
  p_note          := 'Founding vendor research, <month year>',
  p_comp_plan     := 'pro',      -- only if the user has decided on a comp
  p_comp_months   := 12
);
```

Escape single quotes in names (`O''Brien`). The function returns `org_id` and
a one-time `token`. Remind the user the token is shown once. If they plan to
send a claim link, they must copy it immediately.

Check the latest migrations before relying on how a new listing gets
published. `VENDOR-PROSPECTS.md` says a listing with a phone or a website
publishes and one with neither stays a draft.

## Add to the file

Append each vendor to its category table in `VENDOR-PROSPECTS.md` in the same
column format, then update the metro counts at the top. Regenerate the "Call
these first" table only by deriving it from the category tables, never by
hand.
