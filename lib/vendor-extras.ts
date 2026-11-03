/**
 * The optional parts of a vendor's profile that couples compare vendors on:
 * a price tier ($ to $$$$), highlights ("Bilingual — English & Spanish"),
 * packages with a starting price and what's included, and FAQs.
 *
 * Stored on vendor_profiles as price_tier (smallint) and highlights, packages
 * and faqs (jsonb arrays). The profile form sends each list as JSON;
 * parseVendorExtras() checks and trims it here, and the database enforces
 * the same shape and limits (vendor_extras_ok() in
 * supabase/migrations/20261103170000_vendor_profile_extras.sql), because
 * vendors can also write their row directly through the API. Keep the limits
 * in the two places in step.
 *
 * Every field is optional, and the public page shows a section only when the
 * vendor has filled it in: an empty "Packages" heading on an unclaimed listing
 * would read as "this vendor has nothing to offer".
 */

export const HIGHLIGHT_ICONS = {
  award: "Award",
  star: "Star",
  heart: "Heart",
  leaf: "Leaf",
  language: "Languages",
  truck: "Delivery & setup",
  clock: "Time",
  sparkle: "Sparkle",
} as const;
export type HighlightIcon = keyof typeof HIGHLIGHT_ICONS;

export interface Highlight {
  icon: HighlightIcon;
  title: string;
  detail: string | null;
}

export interface VendorPackage {
  name: string;
  /** Starting price in whole US dollars, or null for "Ask for a quote". */
  price: number | null;
  description: string | null;
  includes: string[];
  /** Shown first, labelled "Most requested". At most one. */
  featured: boolean;
}

export interface Faq {
  q: string;
  a: string;
}

export const LIMITS = {
  highlights: 6,
  highlightTitle: 40,
  highlightDetail: 60,
  packages: 6,
  packageName: 60,
  packageDescription: 400,
  packageIncludes: 10,
  packageInclude: 120,
  maxPrice: 1_000_000,
  faqs: 10,
  faqQuestion: 200,
  faqAnswer: 1000,
} as const;

export const PRICE_TIERS = [
  { value: 1, label: "$", hint: "Budget-friendly" },
  { value: 2, label: "$$", hint: "Moderate" },
  { value: 3, label: "$$$", hint: "Premium" },
  { value: 4, label: "$$$$", hint: "Luxury" },
] as const;

export function priceTierLabel(tier: unknown): string | null {
  return PRICE_TIERS.find((t) => t.value === tier)?.label ?? null;
}

type Result<T> = { value: T; error?: undefined } | { value?: undefined; error: string };

function text(v: unknown): string {
  return typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "";
}

/** Like text(), but keeps line breaks (answers and descriptions). */
function para(v: unknown): string {
  return typeof v === "string" ? v.replace(/[^\S\n]+/g, " ").replace(/\n{3,}/g, "\n\n").trim() : "";
}

function list(raw: unknown): unknown[] | null {
  if (raw == null || raw === "") return [];
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return Array.isArray(raw) ? raw : null;
}

export function parseHighlights(raw: unknown): Result<Highlight[]> {
  const items = list(raw);
  if (!items) return { error: "Couldn't read your highlights. Please try again." };
  const out: Highlight[] = [];
  for (const item of items) {
    const o = (item ?? {}) as Record<string, unknown>;
    const title = text(o.title);
    const detail = text(o.detail);
    if (!title && !detail) continue; // an empty row the vendor added and left
    if (!title) return { error: "Each highlight needs a title." };
    if (title.length > LIMITS.highlightTitle)
      return { error: `Keep highlight titles to ${LIMITS.highlightTitle} characters.` };
    if (detail.length > LIMITS.highlightDetail)
      return { error: `Keep highlight details to ${LIMITS.highlightDetail} characters.` };
    const icon = typeof o.icon === "string" && o.icon in HIGHLIGHT_ICONS ? (o.icon as HighlightIcon) : "star";
    out.push({ icon, title, detail: detail || null });
  }
  if (out.length > LIMITS.highlights) return { error: `Add up to ${LIMITS.highlights} highlights.` };
  return { value: out };
}

/** "$5,200", "5200", "5,200.00" -> 5200. Blank -> null. */
export function parsePrice(raw: unknown): number | null | "invalid" {
  if (raw == null || raw === "") return null;
  if (typeof raw === "number") return Number.isFinite(raw) && raw >= 0 ? Math.round(raw) : "invalid";
  const s = String(raw).replace(/[$,\s]/g, "");
  if (!s) return null;
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return "invalid";
  return Math.round(Number(s));
}

export function parsePackages(raw: unknown): Result<VendorPackage[]> {
  const items = list(raw);
  if (!items) return { error: "Couldn't read your packages. Please try again." };
  const out: VendorPackage[] = [];
  for (const item of items) {
    const o = (item ?? {}) as Record<string, unknown>;
    const name = text(o.name);
    const description = para(o.description);
    const includesRaw = Array.isArray(o.includes)
      ? o.includes
      : typeof o.includes === "string"
        ? o.includes.split("\n")
        : [];
    const includes = includesRaw.map(text).filter(Boolean);
    const price = parsePrice(o.price);
    if (!name && !description && includes.length === 0 && price === null) continue;
    if (!name) return { error: "Each package needs a name." };
    if (name.length > LIMITS.packageName)
      return { error: `Keep package names to ${LIMITS.packageName} characters.` };
    if (price === "invalid") return { error: `"${name}": enter the starting price as a number, like 2500.` };
    if (price !== null && price > LIMITS.maxPrice) return { error: `"${name}": that price looks too high.` };
    if (description.length > LIMITS.packageDescription)
      return { error: `"${name}": keep the description to ${LIMITS.packageDescription} characters.` };
    if (includes.length > LIMITS.packageIncludes)
      return { error: `"${name}": list up to ${LIMITS.packageIncludes} included items.` };
    if (includes.some((i) => i.length > LIMITS.packageInclude))
      return { error: `"${name}": keep each included item to ${LIMITS.packageInclude} characters.` };
    out.push({ name, price, description: description || null, includes, featured: o.featured === true });
  }
  if (out.length > LIMITS.packages) return { error: `Add up to ${LIMITS.packages} packages.` };
  // At most one "Most requested": keep the first one ticked.
  let seen = false;
  for (const p of out) {
    if (p.featured && seen) p.featured = false;
    if (p.featured) seen = true;
  }
  return { value: out };
}

export function parseFaqs(raw: unknown): Result<Faq[]> {
  const items = list(raw);
  if (!items) return { error: "Couldn't read your FAQs. Please try again." };
  const out: Faq[] = [];
  for (const item of items) {
    const o = (item ?? {}) as Record<string, unknown>;
    const q = text(o.q);
    const a = para(o.a);
    if (!q && !a) continue;
    if (!q || !a) return { error: "Each FAQ needs both a question and an answer." };
    if (q.length > LIMITS.faqQuestion) return { error: `Keep questions to ${LIMITS.faqQuestion} characters.` };
    if (a.length > LIMITS.faqAnswer) return { error: `Keep answers to ${LIMITS.faqAnswer} characters.` };
    out.push({ q, a });
  }
  if (out.length > LIMITS.faqs) return { error: `Add up to ${LIMITS.faqs} FAQs.` };
  return { value: out };
}

export function parsePriceTier(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 4 ? n : null;
}

/**
 * Tolerant readers for the page: whatever is stored, render only what is
 * well-formed. Never throws.
 */
export function readHighlights(v: unknown): Highlight[] {
  return parseHighlights(Array.isArray(v) ? v : []).value?.slice(0, LIMITS.highlights) ?? [];
}
export function readPackages(v: unknown): VendorPackage[] {
  const pkgs = parsePackages(Array.isArray(v) ? v : []).value?.slice(0, LIMITS.packages) ?? [];
  // The featured package leads, as on the mockup.
  return [...pkgs].sort((a, b) => Number(b.featured) - Number(a.featured));
}
export function readFaqs(v: unknown): Faq[] {
  return parseFaqs(Array.isArray(v) ? v : []).value?.slice(0, LIMITS.faqs) ?? [];
}

/** The lowest stated starting price, for "Packages from $X". */
export function lowestPrice(pkgs: VendorPackage[]): number | null {
  const prices = pkgs.map((p) => p.price).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

export function formatPrice(n: number): string {
  return `$${n.toLocaleString("en-US")}`;
}
