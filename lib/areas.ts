/**
 * Grouping vendor listings by metro and area, for the location filter on
 * /vendors.
 *
 * Two levels, because one stopped working. A flat row of Broward, Miami-Dade,
 * Palm Beach and Florida Keys was coherent while the directory was one metro.
 * Adding Orlando and Tampa to that same row mixes counties with metros, and
 * the row becomes unusable by the fourth city. So: metros are the top level,
 * areas sit inside the metro that has them.
 *
 * Why areas and not a distance radius. The listings carry a free-text `city`
 * and no coordinates, and a seventh of them name a region rather than a city.
 * There is no point to measure from for those, so a mile radius would either
 * hide them or pin them to an invented centroid. Distance becomes worth
 * revisiting once a metro has enough listings that "nearby" means something
 * finer than its counties.
 */

export type MetroId =
  | "south-florida"
  | "southwest"
  | "tampa"
  | "orlando"
  | "space-coast"
  | "jacksonville"
  | "panhandle";

/**
 * Chip order, roughly south to north and then west along the coast, so the
 * row reads as a map rather than as a leaderboard that reshuffles whenever
 * one metro overtakes another.
 */
export const METROS: { id: MetroId; label: string }[] = [
  { id: "south-florida", label: "South Florida" },
  { id: "southwest", label: "Southwest Florida" },
  { id: "tampa", label: "Tampa Bay" },
  { id: "orlando", label: "Orlando" },
  { id: "space-coast", label: "Space Coast & Daytona" },
  { id: "jacksonville", label: "Jacksonville" },
  { id: "panhandle", label: "Panhandle" },
];

export type AreaId = "broward" | "miami-dade" | "palm-beach" | "keys";

export const AREAS: { id: AreaId; label: string; metro: MetroId }[] = [
  { id: "broward", label: "Broward", metro: "south-florida" },
  { id: "miami-dade", label: "Miami-Dade", metro: "south-florida" },
  { id: "palm-beach", label: "Palm Beach", metro: "south-florida" },
  { id: "keys", label: "Florida Keys", metro: "south-florida" },
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

  // Monroe County. Not part of the tri-county area, but a large share of the
  // couples this directory serves marry in the Keys, and the vendors there are
  // a distinct market rather than an overflow of Miami-Dade.
  "key west": "keys",
  "key largo": "keys",
  islamorada: "keys",
  marathon: "keys",
  tavernier: "keys",
  "big pine key": "keys",
  "duck key": "keys",
  "florida keys": "keys",
  "the florida keys": "keys",
  "upper keys": "keys",
  "lower keys": "keys",
};

/**
 * City -> metro, for cities outside South Florida. South Florida cities are
 * resolved through their area instead (see metroOf), so they are not repeated
 * here.
 *
 * As with CITY_AREA, this deliberately covers more cities than the data holds,
 * so a later import lands in a metro without a code change.
 */
const CITY_METRO: Record<string, MetroId> = {
  // Orlando / Central Florida
  orlando: "orlando",
  "winter park": "orlando",
  "winter garden": "orlando",
  kissimmee: "orlando",
  celebration: "orlando",
  "lake mary": "orlando",
  sanford: "orlando",
  apopka: "orlando",
  "altamonte springs": "orlando",
  ocoee: "orlando",
  clermont: "orlando",
  "mount dora": "orlando",
  "lake nona": "orlando",
  "dr phillips": "orlando",
  "winter springs": "orlando",
  oviedo: "orlando",
  maitland: "orlando",
  "st cloud": "orlando",
  "saint cloud": "orlando",
  "central florida": "orlando",
  "greater orlando": "orlando",
  "winter haven": "orlando",
  lakeland: "orlando",
  davenport: "orlando",
  "haines city": "orlando",
  "lake wales": "orlando",
  // Highlands County. Bok Tower Gardens' vendor list is where its vendors
  // come from, and that list is a Central Florida one.
  sebring: "orlando",

  // Tampa Bay
  tampa: "tampa",
  "st petersburg": "tampa",
  "saint petersburg": "tampa",
  "st pete": "tampa",
  clearwater: "tampa",
  brandon: "tampa",
  "safety harbor": "tampa",
  dunedin: "tampa",
  "palm harbor": "tampa",
  riverview: "tampa",
  "land o lakes": "tampa",
  "wesley chapel": "tampa",
  sarasota: "tampa",
  bradenton: "tampa",
  "temple terrace": "tampa",
  "ybor city": "tampa",
  "tampa bay": "tampa",
  "tarpon springs": "tampa",
  largo: "tampa",
  "tierra verde": "tampa",
  seminole: "tampa",
  "pinellas park": "tampa",
  "treasure island": "tampa",
  "st pete beach": "tampa",
  ellenton: "tampa",
  venice: "tampa",
  "anna maria": "tampa",
  palmetto: "tampa",
  ruskin: "tampa",
  "apollo beach": "tampa",
  "plant city": "tampa",
  odessa: "tampa",
  "new port richey": "tampa",
  holiday: "tampa",
  gulfport: "tampa",
  // Sarasota County stays with Tampa Bay rather than moving to Southwest
  // Florida: Venice and North Port sit between the two, and a couple in
  // Sarasota looks up the bay, not down to Naples.
  "north port": "tampa",

  // Southwest Florida
  naples: "southwest",
  "fort myers": "southwest",
  "ft myers": "southwest",
  "fort myers beach": "southwest",
  "cape coral": "southwest",
  "bonita springs": "southwest",
  estero: "southwest",
  "marco island": "southwest",
  sanibel: "southwest",
  captiva: "southwest",
  "punta gorda": "southwest",
  "port charlotte": "southwest",
  "lehigh acres": "southwest",
  "everglades city": "southwest",

  // Space Coast, plus Volusia and Flagler
  melbourne: "space-coast",
  "melbourne beach": "space-coast",
  "palm bay": "space-coast",
  cocoa: "space-coast",
  "cocoa beach": "space-coast",
  // Indian River County: the Treasure Coast's north end, closer in practice
  // to Melbourne than to Palm Beach.
  "vero beach": "space-coast",
  rockledge: "space-coast",
  "merritt island": "space-coast",
  "satellite beach": "space-coast",
  indialantic: "space-coast",
  titusville: "space-coast",
  viera: "space-coast",
  suntree: "space-coast",
  "cape canaveral": "space-coast",
  "daytona beach": "space-coast",
  "daytona beach shores": "space-coast",
  "south daytona": "space-coast",
  "ormond beach": "space-coast",
  "port orange": "space-coast",
  "new smyrna beach": "space-coast",
  "new smyrna": "space-coast",
  edgewater: "space-coast",
  "ponce inlet": "space-coast",
  "holly hill": "space-coast",
  deland: "space-coast",
  deltona: "space-coast",
  debary: "space-coast",
  "orange city": "space-coast",
  "palm coast": "space-coast",
  "flagler beach": "space-coast",

  // Jacksonville and the First Coast
  jacksonville: "jacksonville",
  "jacksonville beach": "jacksonville",
  "atlantic beach": "jacksonville",
  "neptune beach": "jacksonville",
  "ponte vedra": "jacksonville",
  "ponte vedra beach": "jacksonville",
  "st augustine": "jacksonville",
  "st. augustine": "jacksonville",
  "saint augustine": "jacksonville",
  "st augustine beach": "jacksonville",
  "saint augustine beach": "jacksonville",
  "st johns": "jacksonville",
  "saint johns": "jacksonville",
  nocatee: "jacksonville",
  "orange park": "jacksonville",
  "fleming island": "jacksonville",
  middleburg: "jacksonville",
  "green cove springs": "jacksonville",
  "fernandina beach": "jacksonville",
  "amelia island": "jacksonville",
  yulee: "jacksonville",
  callahan: "jacksonville",
  hilliard: "jacksonville",
  macclenny: "jacksonville",

  // Panhandle, plus Tallahassee -- Big Bend rather than Panhandle proper, but
  // this is the nearest grouping, and leaving it unmapped would hide it under
  // every metro chip instead of one.
  destin: "panhandle",
  "miramar beach": "panhandle",
  sandestin: "panhandle",
  "santa rosa beach": "panhandle",
  "30a": "panhandle",
  seaside: "panhandle",
  "rosemary beach": "panhandle",
  "inlet beach": "panhandle",
  "grayton beach": "panhandle",
  watersound: "panhandle",
  watercolor: "panhandle",
  freeport: "panhandle",
  "fort walton beach": "panhandle",
  niceville: "panhandle",
  crestview: "panhandle",
  navarre: "panhandle",
  pensacola: "panhandle",
  "pensacola beach": "panhandle",
  "gulf breeze": "panhandle",
  "perdido key": "panhandle",
  "panama city": "panhandle",
  "panama city beach": "panhandle",
  tallahassee: "panhandle",
};

/**
 * Values that name a region instead of a city, and the scope each one means.
 *
 * This split is the whole reason the module changed. The old version had one
 * REGION_WIDE set and `matchesArea` returned true for every area in it, which
 * was correct while every area was in South Florida and became wrong the
 * moment it wasn't: 63 listings say "South Florida" or similar, and under a
 * flat rule all 63 would surface under an Orlando filter. A couple in Orlando
 * would be shown Fort Lauderdale vendors, and nothing on the page would look
 * broken.
 *
 * So a region-wide value now carries the metro it covers. "Florida" and
 * "statewide" genuinely mean everywhere and map to null, which is the only
 * case that still matches every metro.
 */
const REGION_SCOPE: Record<string, MetroId | null> = {
  // Scoped to South Florida -- NOT statewide.
  "south florida": "south-florida",
  "southeast florida": "south-florida",
  "south east florida": "south-florida",
  "tri-county": "south-florida",
  "miami / fort lauderdale": "south-florida",

  // Scoped to their own metro.
  //
  // Only a phrase naming a *region* belongs here. Winter Haven, Lakeland,
  // Davenport and Haines City were listed here as well as in CITY_METRO, which
  // made isRegionWide() true for them -- so a listing in Davenport rendered
  // "Serves all of Orlando" instead of its own city, claiming a reach the
  // vendor never stated. They are cities; CITY_METRO is where they belong.
  "central florida": "orlando",
  "greater orlando": "orlando",
  "tampa bay": "tampa",
  "southwest florida": "southwest",
  "south west florida": "southwest",
  "naples / fort myers": "southwest",
  "space coast": "space-coast",
  "east central florida": "space-coast",
  "northeast florida": "jacksonville",
  "north east florida": "jacksonville",
  "first coast": "jacksonville",
  // Colloquially the Jacksonville side, not Tallahassee's.
  "north florida": "jacksonville",
  panhandle: "panhandle",
  "florida panhandle": "panhandle",
  "emerald coast": "panhandle",

  // Genuinely everywhere.
  florida: null,
  statewide: null,
};

function key(city: string | null | undefined): string {
  return (city ?? "").trim().toLowerCase();
}

/** True when the listing names a region rather than a single city. */
export function isRegionWide(city: string | null | undefined): boolean {
  return key(city) in REGION_SCOPE;
}

/**
 * For a region-wide listing, the metro it covers, or null for statewide.
 * Throws nothing for a city: callers should check isRegionWide first.
 */
export function regionScope(city: string | null | undefined): MetroId | null {
  return REGION_SCOPE[key(city)] ?? null;
}

/**
 * The area a city belongs to, or null when it is region-wide, empty, outside
 * every mapped area, or in a metro that has no areas yet. Null means "no area
 * chip matches", which is right for Hobe Sound (Martin County) and is the safe
 * default for a city nobody has mapped.
 */
export function areaOf(city: string | null | undefined): AreaId | null {
  return CITY_AREA[key(city)] ?? null;
}

/**
 * The metro a listing belongs to. A South Florida city resolves through its
 * area so the two maps cannot disagree; everything else comes from CITY_METRO
 * or, for a region-wide value, from its scope.
 */
export function metroOf(city: string | null | undefined): MetroId | null {
  const area = areaOf(city);
  if (area) return AREAS.find((a) => a.id === area)!.metro;
  const direct = CITY_METRO[key(city)];
  if (direct) return direct;
  return isRegionWide(city) ? regionScope(city) : null;
}

/**
 * Does this listing belong in the given metro's results?
 *
 * A statewide listing matches every metro. A metro-scoped one matches only its
 * own. Everything else matches the metro its city is in.
 */
export function matchesMetro(city: string | null | undefined, metro: MetroId): boolean {
  if (isRegionWide(city)) {
    const scope = regionScope(city);
    return scope === null || scope === metro;
  }
  return metroOf(city) === metro;
}

/**
 * Does this listing belong in the given area's results?
 *
 * A region-wide listing counts only if its scope reaches this area's metro --
 * which is what stops a "South Florida" vendor appearing under Orlando.
 */
export function matchesArea(city: string | null | undefined, area: AreaId): boolean {
  if (isRegionWide(city)) {
    const scope = regionScope(city);
    const areaMetro = AREAS.find((a) => a.id === area)!.metro;
    return scope === null || scope === areaMetro;
  }
  return areaOf(city) === area;
}

/** Metros that actually have listings, so empty chips are never rendered. */
export function metrosPresent(cities: (string | null | undefined)[]): MetroId[] {
  const seen = new Set<MetroId>();
  for (const c of cities) {
    const m = metroOf(c);
    if (m) seen.add(m);
  }
  return METROS.filter((m) => seen.has(m.id)).map((m) => m.id);
}

/**
 * Areas with listings inside one metro. Returns an empty list when the metro
 * has no areas defined -- every metro except South Florida today -- which is
 * how the second chip row stays hidden rather than rendering a row of one.
 */
export function areasPresent(
  cities: (string | null | undefined)[],
  metro?: MetroId,
): AreaId[] {
  const seen = new Set<AreaId>();
  for (const c of cities) {
    const a = areaOf(c);
    if (a) seen.add(a);
  }
  return AREAS.filter((a) => seen.has(a.id) && (!metro || a.metro === metro)).map((a) => a.id);
}
