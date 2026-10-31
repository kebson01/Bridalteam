// Turns vendor data from any source into rows for public.vendor_leads.
//
// Every way we find vendors lands in that one staging table, and
// import_vendor_leads() in supabase/migrations/20261031120000_vendor_leads.sql
// dedupes each lead against the directory and publishes it. This script is the
// front half: reading a source's file (or Google Places), mapping it to the
// lead columns, picking a directory category, and writing SQL that inserts the
// leads. Re-running it is safe, because the inserts are `on conflict do nothing`.
//
//   node scripts/vendor-leads.mjs json <file.json> [--source web_search]
//       Research output: an array of {business_name, category, city, website,
//       phone, email, source, source_ref, source_url, note}.
//
//   node scripts/vendor-leads.mjs csv <file.csv> --source county_btr|dbpr|...
//       --map name=COL,city=COL,phone=COL,website=COL,ref=COL,type=COL,email=COL
//       [--where COL=VALUE ...] [--category "Caterer"]
//       A county business-tax-receipt export or a DBPR licence file. `type` is
//       the column describing the business (BTR business type, licence type);
//       it is mapped to a directory category, and rows that map to none are
//       dropped -- a florist directory has no use for the county's plumbers.
//       --where keeps only matching rows (e.g. STATUS=Active, repeatable).
//       --category forces one category for every row (a DBPR caterer file).
//
//   node scripts/vendor-leads.mjs places --query "wedding florist" --city Naples
//       Google Places Text Search (New). Needs GOOGLE_PLACES_API_KEY. See the
//       note on placesToLeads() for what is, and is not, kept from Google.
//
// Output is SQL on stdout (or --out file). Run it in the Supabase SQL editor,
// then `select * from import_vendor_leads();`.
//
// Only Node built-ins, so it runs without `npm ci`.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const SOURCES = [
  "web_search", "google_places", "county_btr", "dbpr",
  "association", "venue_preferred", "couple_referral", "vendor_referral",
];

// ── Matching keys. Mirrors vendor_phone10 / vendor_site_domain /
// vendor_name_key in the migration, so a script can dedupe a file before it
// ever reaches the database. Keep the two in step.

export function phone10(value) {
  const d = String(value ?? "").replace(/\D+/g, "");
  return d.length >= 10 ? d.slice(-10) : null;
}

const NOT_A_WEBSITE =
  /(^|\.)(facebook|instagram|theknot|weddingwire|yelp|linktr|google|tiktok|pinterest|zola|thumbtack|bark|x|twitter|youtube|weddingrule|herecomestheguide)\.(com|ee|co)$/;

export function siteDomain(value) {
  const host = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\.|[/?#:].*$/g, "");
  if (!host || NOT_A_WEBSITE.test(host)) return null;
  return host;
}

export function nameKey(value) {
  const k = String(value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/^\s*the\s+|\s+(llc|inc|corp|corporation|co|company|ltd|pa|pllc)\s*$/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return k || null;
}

/** (954) 721-9911, the way the existing listings store numbers. */
export function formatPhone(value) {
  const d = phone10(value);
  return d ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : null;
}

// ── Categories. Ordered: the first rule that matches wins, so the specific
// rules sit above the general ones ("photo booth" before "photo", "wedding
// cake" before "wedding"). Labels are the ones in lib/categories.ts.

const CATEGORY_RULES = [
  [/photo ?booth/, "Photo booth"],
  [/photograph/, "Photography"],
  [/videograph|video production|cinematograph|wedding film/, "Videography"],
  [/florist|floral|flower/, "Florist"],
  [/cater/, "Caterer"],
  [/\bdj\b|disc ?jockey/, "DJ"],
  [/officiant|wedding minister|marriage ceremon|wedding ceremon/, "Officiant"],
  [/make ?up|bridal hair|hair stylist|beauty artist/, "Hair & makeup"],
  [/wedding cake|cake|bakery|pastry|dessert/, "Cake & dessert"],
  // "financial planner" and "interior decorator" are in every tax roll, so the
  // ambiguous words only count with a wedding or event beside them.
  [/(wedding|event|party) (planner|planning|coordinat)/, "Wedding planner"],
  [/bridal (shop|salon|boutique)|bridal gown|wedding (gown|dress)/, "Bridal salon"],
  [/limo|limousine|chauffeur|trolley|party bus/, "Transportation"],
  [/(party|event|tent|chair|table|linen|wedding) rentals?/, "Rentals"],
  [/\bband\b|orchestra|ensemble/, "Band"],
  [/jewel/, "Jeweler"],
  [/alteration|tailor|seamstress/, "Alterations"],
  [/stationer|invitation|calligraph/, "Stationery"],
  [/(event|wedding|stage) lighting/, "Lighting"],
  [/(event|wedding|party) decor|draping/, "Decor"],
  [/bartend|mobile bar|bar service/, "Bar service"],
  [/valet/, "Valet parking"],
  [/dance (studio|lesson|instruct)/, "Dance lessons"],
  [/travel agen/, "Travel agent"],
  [/venue|banquet|ballroom|event (hall|center|space)|reception hall/, "Venue"],
];

// Google's place types, for Places results. Only types that mean the
// business, not types any shop might carry ("store", "establishment").
const PLACE_TYPES = {
  wedding_venue: "Venue",
  event_venue: "Venue",
  banquet_hall: "Venue",
  florist: "Florist",
  photographer: "Photography",
  catering_service: "Caterer",
  bakery: "Cake & dessert",
  bridal_shop: "Bridal salon",
  jewelry_store: "Jeweler",
  tailor: "Alterations",
  limousine_service: "Transportation",
  makeup_artist: "Hair & makeup",
  wedding_planner: "Wedding planner",
};

/** A directory category for a free-text business description, or null. */
export function mapCategory(text) {
  const t = String(text ?? "").toLowerCase();
  if (!t.trim()) return null;
  for (const [re, label] of CATEGORY_RULES) if (re.test(t)) return label;
  return null;
}

export function categoryFromPlaceTypes(types) {
  for (const t of types ?? []) if (PLACE_TYPES[t]) return PLACE_TYPES[t];
  return null;
}

/** "FORT LAUDERDALE" -> "Fort Lauderdale"; leaves mixed case alone. */
export function tidyCity(value) {
  const s = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!s) return null;
  if (s !== s.toUpperCase() && s !== s.toLowerCase()) return s;
  return s.toLowerCase().replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

// ── CSV. RFC 4180: quoted fields, doubled quotes, newlines inside quotes.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((f) => f !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((f) => f !== "")) rows.push(row);
  const [header = [], ...body] = rows;
  const keys = header.map((h) => h.trim());
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}

/**
 * "name=BUSINESS NAME,city=CITY" -> { name: "BUSINESS NAME", city: "CITY" }
 * @returns {Record<string, string>}
 */
export function parseMap(spec) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const part of String(spec ?? "").split(",")) {
    const eq = part.indexOf("=");
    if (eq > 0) out[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }
  return out;
}

/**
 * Rows of a source file -> leads. Drops rows with no name, rows that fail a
 * --where filter, and rows whose type maps to no wedding category.
 *
 * @param {Record<string, string>[]} rows
 * @param {{ source: string, map: Record<string, string>, where?: [string, string][], category?: string | null }} opts
 */
export function rowsToLeads(rows, { source, map, where = [], category = null }) {
  const get = (row, key) => (map[key] ? row[map[key]] ?? "" : "");
  const leads = [];
  for (const row of rows) {
    if (!where.every(([col, val]) => String(row[col] ?? "").trim().toLowerCase() === val.toLowerCase())) continue;
    const name = get(row, "name").trim();
    if (!name) continue;
    const typeText = get(row, "type");
    const cat = category ?? mapCategory(typeText) ?? mapCategory(name);
    if (!cat) continue;
    leads.push({
      source,
      source_ref: get(row, "ref") || null,
      source_url: null,
      business_name: name,
      category: cat,
      city: tidyCity(get(row, "city")),
      website: get(row, "website") || null,
      phone: formatPhone(get(row, "phone")) ?? (get(row, "phone") || null),
      email: get(row, "email") || null,
      note: typeText ? `type: ${typeText}` : null,
    });
  }
  return dedupeLeads(leads);
}

/** Research JSON -> leads, keeping only the lead columns. */
export function jsonToLeads(items, { source = "web_search" } = {}) {
  return dedupeLeads(
    items
      .filter((x) => x && String(x.business_name ?? "").trim())
      .map((x) => ({
        source: x.source && SOURCES.includes(x.source) ? x.source : source,
        source_ref: x.source_ref ?? null,
        source_url: x.source_url ?? null,
        business_name: String(x.business_name).trim(),
        category: x.category ?? null,
        city: tidyCity(x.city),
        website: x.website ?? null,
        phone: formatPhone(x.phone) ?? x.phone ?? null,
        email: x.email ?? null,
        note: x.note ?? null,
      })),
  );
}

/** One lead per business within a file: same phone, domain or name. */
export function dedupeLeads(leads) {
  const seen = new Set();
  const out = [];
  for (const l of leads) {
    const keys = [
      phone10(l.phone) && `p:${phone10(l.phone)}`,
      siteDomain(l.website) && `d:${siteDomain(l.website)}`,
      nameKey(l.business_name) && `n:${nameKey(l.business_name)}`,
    ].filter(Boolean);
    if (keys.some((k) => seen.has(k))) continue;
    keys.forEach((k) => seen.add(k));
    out.push(l);
  }
  return out;
}

// ── Google Places.

/**
 * Places results -> leads.
 *
 * What is kept: the place_id (as source_ref), the name, the city and a
 * category. What is NOT kept: Google's phone number and website. The Google
 * Maps Platform terms allow storing a place_id indefinitely but not caching
 * other Places content, and a directory listing is permanent storage. So a
 * Places lead is a *discovery* -- "there is a florist called X in Naples" --
 * and it imports as a draft that needs its phone or website found on the
 * business's own pages (web search) before it publishes. If it matches a
 * listing we already hold, it only links to it.
 */
export function placesToLeads(places, { city = null, category = null } = {}) {
  return dedupeLeads(
    (places ?? [])
      .map((p) => {
        const cat = category ?? categoryFromPlaceTypes(p.types) ?? mapCategory(p.displayName?.text);
        const locality = (p.addressComponents ?? []).find((c) => (c.types ?? []).includes("locality"));
        return {
          source: "google_places",
          source_ref: p.id ?? null,
          source_url: p.id ? `https://www.google.com/maps/place/?q=place_id:${p.id}` : null,
          business_name: String(p.displayName?.text ?? "").trim(),
          category: cat,
          city: tidyCity(locality?.longText ?? city),
          website: null,
          phone: null,
          email: null,
          note: p.businessStatus && p.businessStatus !== "OPERATIONAL" ? `status: ${p.businessStatus}` : null,
        };
      })
      .filter((l) => l.business_name && l.category && !/^status: CLOSED/.test(l.note ?? "")),
  );
}

async function searchPlaces({ query, city, key, pages = 3 }) {
  const out = [];
  let pageToken;
  for (let i = 0; i < pages; i++) {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        // Only the fields kept -- Places bills by the field mask.
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.types,places.addressComponents,places.businessStatus,nextPageToken",
      },
      body: JSON.stringify({ textQuery: `${query} in ${city}, Florida`, pageToken }),
    });
    if (!res.ok) throw new Error(`Places ${res.status}: ${await res.text()}`);
    const body = await res.json();
    out.push(...(body.places ?? []));
    pageToken = body.nextPageToken;
    if (!pageToken) break;
  }
  return out;
}

// ── SQL.

function lit(v) {
  return v === null || v === undefined || v === "" ? "null" : `'${String(v).replace(/'/g, "''")}'`;
}

const COLS = ["source", "source_ref", "source_url", "business_name", "category", "city", "website", "phone", "email", "note"];

export function leadsToSql(leads) {
  if (!leads.length) return "-- no leads\n";
  const values = leads.map((l) => `  (${COLS.map((c) => lit(l[c])).join(", ")})`).join(",\n");
  return (
    `-- ${leads.length} vendor leads, generated by scripts/vendor-leads.mjs\n` +
    `insert into public.vendor_leads (${COLS.join(", ")}) values\n${values}\n` +
    `on conflict do nothing;\n\n` +
    `-- then: select * from public.import_vendor_leads();\n`
  );
}

// ── CLI.

function flags(argv) {
  const out = { _: [], where: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) { out._.push(a); continue; }
    const k = a.slice(2);
    const v = argv[++i];
    if (k === "where") {
      const eq = v.indexOf("=");
      out.where.push([v.slice(0, eq), v.slice(eq + 1)]);
    } else out[k] = v;
  }
  return out;
}

async function main(argv) {
  const f = flags(argv);
  const [cmd, file] = f._;
  if (f.source && !SOURCES.includes(f.source)) throw new Error(`--source must be one of ${SOURCES.join(", ")}`);

  let leads;
  if (cmd === "json") {
    leads = jsonToLeads(JSON.parse(await readFile(file, "utf8")), { source: f.source ?? "web_search" });
  } else if (cmd === "csv") {
    if (!f.source) throw new Error("csv needs --source");
    const map = parseMap(f.map);
    if (!map.name) throw new Error("--map needs at least name=COLUMN");
    leads = rowsToLeads(parseCsv(await readFile(file, "utf8")), {
      source: f.source, map, where: f.where, category: f.category ?? null,
    });
  } else if (cmd === "places") {
    const key = process.env.GOOGLE_PLACES_API_KEY;
    if (!key) throw new Error("Set GOOGLE_PLACES_API_KEY");
    if (!f.query || !f.city) throw new Error("places needs --query and --city");
    const places = await searchPlaces({ query: f.query, city: f.city, key });
    leads = placesToLeads(places, { city: f.city, category: f.category ?? null });
  } else {
    console.error("usage: vendor-leads.mjs json <file> | csv <file> --source S --map ... | places --query Q --city C");
    process.exit(2);
  }

  const sql = leadsToSql(leads);
  if (f.out) await writeFile(f.out, sql);
  else process.stdout.write(sql);
  console.error(`${leads.length} leads`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
