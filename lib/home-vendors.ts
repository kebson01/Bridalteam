import { sortCategories } from "@/lib/categories";
import { MIN_DESCRIPTION_CHARS } from "@/lib/vendor-content";

/**
 * What the homepage says about the vendor directory: how many listings there
 * are, the most common types with their counts, and up to three vendors to
 * show as cards.
 *
 * Only real numbers. The count is the number of published listings, nothing
 * rounded up, and no rating or "vetted" claim: most listings are unclaimed,
 * imported from public business data, and almost none have reviews yet.
 */

export interface HomeVendorRow {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  description: string | null;
  logo_url: string | null;
  cover_url: string | null;
  featured: boolean;
  packages_from: number | null;
}

export interface HomeVendorSummary {
  count: number;
  types: { name: string; count: number }[];
  picks: HomeVendorRow[];
}

export const HOME_TYPES = 6;
export const HOME_PICKS = 3;

/**
 * Featured vendors first (that placement is what the plan sells), then
 * vendors with a cover photo and a description of their own. A bare listing
 * never becomes a homepage card: an empty card with initials would advertise
 * how thin the listing is. At most one per category, so three cards show
 * three kinds of vendor.
 */
export function summarizeVendors(rows: HomeVendorRow[]): HomeVendorSummary {
  const counts = new Map<string, number>();
  for (const r of rows) if (r.category) counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
  const types = sortCategories(rows.map((r) => r.category))
    .slice(0, HOME_TYPES)
    .map((name) => ({ name, count: counts.get(name) ?? 0 }));

  // A photo alone isn't enough: the card shows two lines of description.
  const showable = (r: HomeVendorRow) =>
    Boolean(r.cover_url) && (r.description?.trim().length ?? 0) >= MIN_DESCRIPTION_CHARS;
  const ranked = [
    ...rows.filter((r) => r.featured && r.cover_url),
    ...rows.filter((r) => !r.featured && showable(r)),
  ];
  const picks: HomeVendorRow[] = [];
  const seen = new Set<string>();
  for (const r of ranked) {
    const key = r.category ?? r.org_id;
    if (seen.has(key)) continue;
    seen.add(key);
    picks.push(r);
    if (picks.length === HOME_PICKS) break;
  }
  return { count: rows.length, types, picks };
}
