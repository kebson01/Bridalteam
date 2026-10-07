/**
 * Grouping vendor listings by metro area, for the location filter on /vendors.
 *
 * Why areas and not a distance radius. The listings carry a free-text `city`
 * and no coordinates, and a fifth of them name a region rather than a city --
 * "South Florida", "Southeast Florida", "Florida". There is no point to
 * measure from for those, so a mile radius would either hide them or pin them
 * to an invented centroid. Areas are also what a couple here actually asks
 * for: Broward, Miami-Dade or Palm Beach, not "within 18 miles".
 *
 * If the directory ever covers a second metro, revisit this -- distance earns
 * its keep once "nearby" stops meaning "the same three counties".
 */

export type AreaId = "broward" | "miami-dade" | "palm-beach";

export const AREAS: { id: AreaId; label: string }[] = [
  { id: "broward", label: "Broward" },
  { id: "miami-dade", label: "Miami-Dade" },
  { id: "palm-beach", label: "Palm Beach" },
];

/**
 * City -> area. Keys are compared lowercased and trimmed, so stored values
 * keep whatever capitalisation they were imported with.
 *
 * This covers more cities than the data currently holds, deliberately: the
 * drafts and anything imported later should land in an area without a code
 * change. A city that is genuinely outside the tri-county area (Hobe Sound,
 * in Martin County) is absent on purpose -- see areaOf().
 */
const CITY_AREA: Record<string, AreaId> = {
  // Broward
  "fort lauderdale": "broward",
  "broward county": "broward",
  hollywood: "broward",
  "pembroke pines": "broward",
  "coral springs": "broward",
  davie: "broward",
  lauderhill: "broward",
  sunrise: "broward",
  tamarac: "broward",
  "coconut creek": "broward",
  plantation: "broward",
  miramar: "broward",
  weston: "broward",
  "pompano beach": "broward",
  "deerfield beach": "broward",
  "dania beach": "broward",
  "hallandale beach": "broward",
  "oakland park": "broward",
  parkland: "broward",

  // Miami-Dade
  miami: "miami-dade",
  "miami beach": "miami-dade",
  "coral gables": "miami-dade",
  "coconut grove": "miami-dade",
  doral: "miami-dade",
  aventura: "miami-dade",
  "north miami": "miami-dade",
  "north miami beach": "miami-dade",
  hialeah: "miami-dade",
  homestead: "miami-dade",
  "key biscayne": "miami-dade",
  "sunny isles beach": "miami-dade",
  "miami-dade": "miami-dade",
  "miami gardens": "miami-dade",
  "pinecrest": "miami-dade",

  // Palm Beach
  "palm beach": "palm-beach",
  "palm beach county": "palm-beach",
  "west palm beach": "palm-beach",
  "boca raton": "palm-beach",
  "delray beach": "palm-beach",
  wellington: "palm-beach",
  jupiter: "palm-beach",
  "boynton beach": "palm-beach",
  "palm beach gardens": "palm-beach",
  "lake worth": "palm-beach",
  "royal palm beach": "palm-beach",
};

/**
 * Values that name the whole region instead of a city. A vendor listed this
 * way serves every area, so they show under all of them -- hiding them would
 * drop real, reachable vendors from a filtered view, which is the opposite of
 * what the filter is for.
 */
const REGION_WIDE = new Set([
  "south florida",
  "southeast florida",
  "south east florida",
  "florida",
  "statewide",
  "tri-county",
  "miami / fort lauderdale",
]);

function key(city: string | null | undefined): string {
  return (city ?? "").trim().toLowerCase();
}

/** True when the listing names a region rather than a city. */
export function isRegionWide(city: string | null | undefined): boolean {
  return REGION_WIDE.has(key(city));
}

/**
 * The area a city belongs to, or null when it is region-wide, empty, or a
 * place outside the tri-county area. Null means "no area chip matches", so
 * such a listing appears only under All -- which is right for somewhere like
 * Hobe Sound, and is also the safe default for a city nobody has mapped yet.
 */
export function areaOf(city: string | null | undefined): AreaId | null {
  return CITY_AREA[key(city)] ?? null;
}

/** Does this listing belong in the given area's results? */
export function matchesArea(city: string | null | undefined, area: AreaId): boolean {
  return isRegionWide(city) || areaOf(city) === area;
}

/** Areas that actually have listings, so empty chips are never rendered. */
export function areasPresent(cities: (string | null | undefined)[]): AreaId[] {
  const seen = new Set<AreaId>();
  for (const c of cities) {
    const a = areaOf(c);
    if (a) seen.add(a);
  }
  return AREAS.filter((a) => seen.has(a.id)).map((a) => a.id);
}
