/**
 * Vendor categories, most commonly hired first, for the type filter on
 * /vendors.
 *
 * This is how often couples book each kind of vendor, not how many listings we
 * hold: listing counts follow whoever we have signed up so far, while a couple
 * scanning the row wants the venue and the photographer before the cigar
 * roller. The order is editorial -- adjust it here.
 *
 * A category missing from this list still shows, after every listed one,
 * ordered by how many listings use it (then alphabetically).
 */
export const CATEGORY_ORDER = [
  "Venue",
  "Photography",
  "Caterer",
  "Officiant",
  "Florist",
  "Hair & makeup",
  "DJ",
  "Cake & dessert",
  "Wedding planner",
  "Videography",
  "Bridal salon",
  "Transportation",
  "Rentals",
  "Band",
  "Jeweler",
  "Alterations",
  "Stationery",
  "Photo booth",
  "Lighting",
  "Decor",
  "Bar service",
  "Ceremony music",
  "Dance lessons",
  "Dessert cart",
  "Travel agent",
  "Hora loca",
  "Valet parking",
  "Restrooms",
  "Security",
  "AV production",
  "Event staffing",
  "Fireworks",
  "Cigar roller",
  "Live painter",
];

const RANK = new Map(CATEGORY_ORDER.map((c, i) => [c.toLowerCase(), i]));

/** Distinct categories from the given values, most commonly hired first. */
export function sortCategories(values: (string | null | undefined)[]): string[] {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  const rank = (c: string) => RANK.get(c.toLowerCase()) ?? Infinity;
  return [...counts.keys()].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      counts.get(b)! - counts.get(a)! ||
      a.localeCompare(b),
  );
}
