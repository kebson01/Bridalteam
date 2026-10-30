/**
 * The overhead venue layout: what can be placed on a floor plan, how big each
 * piece really is, where its chairs go, and how a saved layout is checked.
 *
 * Pure data and math — no React, no Supabase — so the editor, the server
 * action that saves it and the tests all share one definition. Every length is
 * in feet. A layout is a width_ft × length_ft rectangle with the origin at the
 * top-left corner; an item's x/y is its CENTRE, and rotation turns it about
 * that centre, clockwise in degrees (the SVG convention).
 */

export type PieceShape = "round" | "rect";

/**
 * "Room" is the venue itself — pillars, doors, places nothing can go, the
 * aisle — as opposed to things the couple rents and brings in.
 */
export type PieceGroup = "Tables" | "Floor" | "Service" | "Room";

/** Palette order. */
export const PIECE_GROUPS: readonly PieceGroup[] = ["Tables", "Floor", "Service", "Room"];

/**
 * Drawing order, bottom to top: the room's own features sit under the dance
 * floor, which sits under the bar and the tables, so a table pushed onto a
 * no-go area is still visible (and outlined) rather than hidden beneath it.
 */
export const DRAW_ORDER: Record<PieceGroup, number> = { Room: 0, Floor: 1, Service: 2, Tables: 3 };

/**
 * How the floor was set up. Only a floor plan (or a blank room typed in by
 * size) is measured; a photo straightened from floor level is only as good as
 * the four corners tapped on it and the size typed in, so it's labelled as
 * approximate wherever the layout is shown or printed.
 */
export type FloorSource = "plan" | "photo" | "blank";

export const FLOOR_SOURCES: readonly FloorSource[] = ["plan", "photo", "blank"];

export function isApproximate(source: FloorSource | null | undefined): boolean {
  return source === "photo";
}

/**
 * Where a rectangular table seats people. "both" is a banquet table with
 * chairs down each long side; "front" is a head or sweetheart table, everyone
 * on one side facing the room.
 */
export type SeatSides = "none" | "both" | "front";

export interface PieceDef {
  label: string;
  shape: PieceShape;
  /** Feet. For a round piece w = h = the diameter. */
  w: number;
  h: number;
  /** Default seats. 0 = not somewhere people sit (a bar, the dance floor). */
  seats: number;
  sides: SeatSides;
  /** Can the couple change its length and width (a dance floor can; a 60" round can't). */
  resizable: boolean;
  /** Numbered automatically when added and counted towards seating. */
  isTable: boolean;
  group: PieceGroup;
}

/**
 * Sizes are the standard rental ones: a 60" round seats 8, a 72" round 10, a
 * banquet table is 30" deep. Couples ask their rental company for exactly
 * these names, so the labels say them the same way.
 */
export const PIECES = {
  round60: { label: "60″ round", shape: "round", w: 5, h: 5, seats: 8, sides: "none", resizable: false, isTable: true, group: "Tables" },
  round72: { label: "72″ round", shape: "round", w: 6, h: 6, seats: 10, sides: "none", resizable: false, isTable: true, group: "Tables" },
  banquet6: { label: "6 ft banquet", shape: "rect", w: 6, h: 2.5, seats: 6, sides: "both", resizable: false, isTable: true, group: "Tables" },
  banquet8: { label: "8 ft banquet", shape: "rect", w: 8, h: 2.5, seats: 8, sides: "both", resizable: false, isTable: true, group: "Tables" },
  head: { label: "Head table", shape: "rect", w: 16, h: 2.5, seats: 8, sides: "front", resizable: true, isTable: true, group: "Tables" },
  sweetheart: { label: "Sweetheart", shape: "rect", w: 4, h: 2.5, seats: 2, sides: "front", resizable: false, isTable: true, group: "Tables" },
  cocktail: { label: "Cocktail", shape: "round", w: 2.5, h: 2.5, seats: 0, sides: "none", resizable: false, isTable: false, group: "Tables" },
  dance: { label: "Dance floor", shape: "rect", w: 16, h: 16, seats: 0, sides: "none", resizable: true, isTable: false, group: "Floor" },
  stage: { label: "Stage", shape: "rect", w: 16, h: 8, seats: 0, sides: "none", resizable: true, isTable: false, group: "Floor" },
  photo: { label: "Photo booth", shape: "rect", w: 8, h: 8, seats: 0, sides: "none", resizable: true, isTable: false, group: "Floor" },
  bar: { label: "Bar", shape: "rect", w: 8, h: 2.5, seats: 0, sides: "none", resizable: true, isTable: false, group: "Service" },
  buffet: { label: "Buffet", shape: "rect", w: 8, h: 2.5, seats: 0, sides: "none", resizable: true, isTable: false, group: "Service" },
  dj: { label: "DJ", shape: "rect", w: 6, h: 2.5, seats: 0, sides: "none", resizable: true, isTable: false, group: "Service" },
  cake: { label: "Cake", shape: "round", w: 3, h: 3, seats: 0, sides: "none", resizable: false, isTable: false, group: "Service" },
  gifts: { label: "Gifts", shape: "rect", w: 6, h: 2.5, seats: 0, sides: "none", resizable: true, isTable: false, group: "Service" },
  pillar: { label: "Pillar", shape: "rect", w: 2, h: 2, seats: 0, sides: "none", resizable: true, isTable: false, group: "Room" },
  // A door's footprint is the area its leaf swings through, so a table parked
  // in front of it shows as a clash.
  door: { label: "Door", shape: "rect", w: 3, h: 3, seats: 0, sides: "none", resizable: false, isTable: false, group: "Room" },
  doubledoor: { label: "Double door", shape: "rect", w: 6, h: 3, seats: 0, sides: "none", resizable: false, isTable: false, group: "Room" },
  nogo: { label: "No-go area", shape: "rect", w: 8, h: 6, seats: 0, sides: "none", resizable: true, isTable: false, group: "Room" },
  aisle: { label: "Aisle", shape: "rect", w: 4, h: 30, seats: 0, sides: "none", resizable: true, isTable: false, group: "Room" },
} as const satisfies Record<string, PieceDef>;

export type PieceKind = keyof typeof PIECES;

export const PIECE_KINDS = Object.keys(PIECES) as PieceKind[];

export interface LayoutItem {
  id: string;
  kind: PieceKind;
  /** Centre, in feet from the top-left corner. */
  x: number;
  y: number;
  /** Feet. Fixed for most kinds; editable where the kind is resizable. */
  w: number;
  h: number;
  /** Degrees clockwise, 0–359. */
  rotation: number;
  seats: number;
  /** "1", "Head table", "Oak" — matched against guests' table names. */
  label: string;
}

export const MAX_ITEMS = 400;
export const MAX_SEATS = 24;
/** Ceiling on a resizable piece, so a typo can't make a 900 ft dance floor. */
export const MAX_PIECE_FT = 200;

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const finite = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

/** Normalises any angle to 0–359. */
export function normalizeRotation(deg: number): number {
  const r = Math.round(finite(deg, 0)) % 360;
  return r < 0 ? r + 360 : r;
}

/**
 * The next free table number. Counts only labels that are plain numbers, so
 * "Head table" and "Oak" don't push the numbering along.
 */
export function nextTableNumber(items: LayoutItem[]): number {
  let max = 0;
  for (const it of items) {
    if (!PIECES[it.kind].isTable) continue;
    const n = Number(it.label);
    if (Number.isInteger(n) && n > max) max = n;
  }
  return max + 1;
}

/** A new piece of `kind`, centred at (x, y), with the next table number. */
export function newItem(kind: PieceKind, x: number, y: number, existing: LayoutItem[], id: string): LayoutItem {
  const def = PIECES[kind];
  return {
    id,
    kind,
    x: round2(x),
    y: round2(y),
    w: def.w,
    h: def.h,
    rotation: 0,
    seats: def.seats,
    label: def.isTable && kind !== "head" && kind !== "sweetheart" ? String(nextTableNumber(existing)) : def.label,
  };
}

/**
 * Chair centres for an item, in the item's own frame (origin at its centre,
 * before rotation). Round tables space chairs evenly around the edge; a
 * banquet table splits them across both long sides; a head table puts them
 * all along the back edge so everyone faces the room.
 */
export function chairPositions(item: Pick<LayoutItem, "kind" | "w" | "h" | "seats">): { x: number; y: number }[] {
  const def = PIECES[item.kind];
  const n = clamp(Math.floor(finite(item.seats, 0)), 0, MAX_SEATS);
  if (n === 0) return [];
  // A chair sits about 10" off the table edge.
  const gap = 0.85;

  if (def.shape === "round") {
    const r = item.w / 2 + gap;
    return Array.from({ length: n }, (_, i) => {
      // Start at the top and go clockwise, so chair 1 is always 12 o'clock.
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      return { x: round2(r * Math.cos(a)), y: round2(r * Math.sin(a)) };
    });
  }

  const along = (count: number, y: number) =>
    Array.from({ length: count }, (_, i) => ({
      x: round2(-item.w / 2 + (item.w * (i + 0.5)) / count),
      y,
    }));

  if (def.sides === "front") return along(n, round2(-item.h / 2 - gap));
  // Odd counts put the extra chair on the top side.
  const top = Math.ceil(n / 2);
  return [...along(top, round2(-item.h / 2 - gap)), ...along(n - top, round2(item.h / 2 + gap))];
}

/**
 * The four corners of an item's footprint in layout space, after rotation.
 * Used to keep pieces on the floor and for the overlap warning.
 */
export function corners(item: Pick<LayoutItem, "x" | "y" | "w" | "h" | "rotation">): { x: number; y: number }[] {
  const a = (item.rotation * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const lx = (sx * item.w) / 2;
    const ly = (sy * item.h) / 2;
    return { x: item.x + lx * cos - ly * sin, y: item.y + lx * sin + ly * cos };
  });
}

/** Total chairs at tables — what the couple compares against their guest count. */
export function seatTotal(items: LayoutItem[]): number {
  return items.reduce((sum, it) => sum + (PIECES[it.kind].isTable ? it.seats : 0), 0);
}

export function tableCount(items: LayoutItem[]): number {
  return items.filter((it) => PIECES[it.kind].isTable).length;
}

/**
 * How a table label is compared with a guest's table name, so a table
 * labelled "4" picks up guests seated at "Table 4" or "table 4 ".
 */
export function tableKey(label: string): string {
  return label.trim().toLowerCase().replace(/^table\s+/, "").replace(/\s+/g, " ");
}

/**
 * Re-measuring the floor (a new scale, or a picture of a different size)
 * changes how many feet the picture covers. Pieces keep their real size but
 * move with the picture, so a table drawn by the window stays by the window.
 */
export function rescaleItems(items: LayoutItem[], sx: number, sy: number): LayoutItem[] {
  return items.map((it) => ({ ...it, x: round2(it.x * sx), y: round2(it.y * sy) }));
}

/**
 * Validates a layout's items before they are written. Everything arriving at
 * the server action came from the browser, so this treats it as hostile: an
 * unknown kind is dropped, numbers are clamped onto the floor, strings are
 * trimmed and capped, and a fixed-size piece gets its catalogue size back no
 * matter what was sent.
 */
export function sanitizeItems(raw: unknown, widthFt: number, lengthFt: number): LayoutItem[] {
  if (!Array.isArray(raw)) return [];
  const out: LayoutItem[] = [];
  const seen = new Set<string>();
  for (const r of raw.slice(0, MAX_ITEMS)) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    const kind = o.kind as PieceKind;
    if (typeof kind !== "string" || !Object.hasOwn(PIECES, kind)) continue;
    const def: PieceDef = PIECES[kind];

    const id = typeof o.id === "string" ? o.id.slice(0, 64) : "";
    if (!id || seen.has(id)) continue;
    seen.add(id);

    const w = def.resizable ? round2(clamp(finite(o.w, def.w), 1, MAX_PIECE_FT)) : def.w;
    const h = def.resizable ? round2(clamp(finite(o.h, def.h), 1, MAX_PIECE_FT)) : def.h;
    const label = typeof o.label === "string" ? o.label.trim().slice(0, 40) : "";

    out.push({
      id,
      kind,
      x: round2(clamp(finite(o.x, widthFt / 2), 0, widthFt)),
      y: round2(clamp(finite(o.y, lengthFt / 2), 0, lengthFt)),
      w,
      h,
      rotation: normalizeRotation(finite(o.rotation, 0)),
      seats: def.isTable ? clamp(Math.floor(finite(o.seats, def.seats)), 0, MAX_SEATS) : 0,
      label: label || def.label,
    });
  }
  return out;
}

/** Clamps a room dimension to what the database accepts. */
export function cleanDimension(v: unknown, fallback: number): number {
  return round2(clamp(finite(v, fallback), 5, 1000));
}

type Pt = { x: number; y: number };

/** Point in an item's own unrotated frame. */
function toLocal(item: Pick<LayoutItem, "x" | "y" | "rotation">, p: Pt): Pt {
  const a = (-item.rotation * Math.PI) / 180;
  const dx = p.x - item.x;
  const dy = p.y - item.y;
  return { x: dx * Math.cos(a) - dy * Math.sin(a), y: dx * Math.sin(a) + dy * Math.cos(a) };
}

function rectsOverlap(a: LayoutItem, b: LayoutItem): boolean {
  // Separating axis test: two rectangles are apart iff one of their four edge
  // normals separates the projections of both.
  const ca = corners(a);
  const cb = corners(b);
  for (const poly of [ca, cb]) {
    for (let i = 0; i < 2; i++) {
      const ex = poly[i + 1].x - poly[i].x;
      const ey = poly[i + 1].y - poly[i].y;
      const nx = -ey;
      const ny = ex;
      const proj = (ps: Pt[]) => ps.map((p) => p.x * nx + p.y * ny);
      const pa = proj(ca);
      const pb = proj(cb);
      if (Math.max(...pa) <= Math.min(...pb) || Math.max(...pb) <= Math.min(...pa)) return false;
    }
  }
  return true;
}

function circleRectOverlap(circle: LayoutItem, rect: LayoutItem): boolean {
  const c = toLocal(rect, circle);
  const nx = clamp(c.x, -rect.w / 2, rect.w / 2);
  const ny = clamp(c.y, -rect.h / 2, rect.h / 2);
  return Math.hypot(c.x - nx, c.y - ny) < circle.w / 2;
}

/** Whether two pieces' footprints (the furniture itself, not the chairs) touch. */
export function overlaps(a: LayoutItem, b: LayoutItem): boolean {
  const ra = PIECES[a.kind].shape === "round";
  const rb = PIECES[b.kind].shape === "round";
  if (ra && rb) return Math.hypot(a.x - b.x, a.y - b.y) < a.w / 2 + b.w / 2;
  if (ra) return circleRectOverlap(a, b);
  if (rb) return circleRectOverlap(b, a);
  return rectsOverlap(a, b);
}

/**
 * Ids of pieces that sit on top of another piece or hang off the floor — the
 * editor outlines them so a clash is obvious before anyone books rentals.
 * Quadratic, which is fine: a layout tops out at a few hundred pieces and this
 * runs once per change, not per frame.
 */
export function findClashes(items: LayoutItem[], widthFt: number, lengthFt: number): Set<string> {
  const bad = new Set<string>();
  const eps = 0.01;
  for (const it of items) {
    const pts = PIECES[it.kind].shape === "round"
      ? [{ x: it.x - it.w / 2, y: it.y - it.w / 2 }, { x: it.x + it.w / 2, y: it.y + it.w / 2 }]
      : corners(it);
    if (pts.some((p) => p.x < -eps || p.y < -eps || p.x > widthFt + eps || p.y > lengthFt + eps)) bad.add(it.id);
  }
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      // Things stand on a stage (the DJ, the band's gear), so it doesn't clash
      // with what is put on it.
      if (items[i].kind === "stage" || items[j].kind === "stage") continue;
      // The room's own features can sit on each other (a pillar inside a
      // no-go area, an aisle running out of a door); they only clash with
      // what's brought in.
      if (PIECES[items[i].kind].group === "Room" && PIECES[items[j].kind].group === "Room") continue;
      if (overlaps(items[i], items[j])) {
        bad.add(items[i].id);
        bad.add(items[j].id);
      }
    }
  }
  return bad;
}

/**
 * Feet from a table's edge to the back of its chairs: the chair sits about
 * 10" off the edge (chairPositions) and is about 18" deep.
 */
export const CHAIR_DEPTH = 1.55;

/** The walkway planners keep between chair backs and anything else: 36". */
export const PATHWAY_FT = 3;

/**
 * A piece's footprint grown by `pad` feet on every side, plus its chairs for a
 * table that has any. A rectangle grows as a rectangle, so its corners are a
 * little generous — it errs towards warning, which is the safe side.
 */
function envelope(it: LayoutItem, pad: number): LayoutItem {
  const grow = pad + (PIECES[it.kind].isTable && it.seats > 0 ? CHAIR_DEPTH : 0);
  return { ...it, w: it.w + grow * 2, h: it.h + grow * 2 };
}

/**
 * Pairs that don't touch but leave less than a 36" walkway behind the chairs:
 * enough room on paper, not enough for a server with a tray or a bride in a
 * gown. At least one of the pair is a table people sit at; the dance floor and
 * the aisle are walkable themselves, and the room's features are left to the
 * clash check. Pairs that already clash aren't repeated here.
 */
export function findTightSpots(items: LayoutItem[], clashes: Set<string> = new Set()): { a: string; b: string }[] {
  const out: { a: string; b: string }[] = [];
  const pad = PATHWAY_FT / 2;
  const counts = (it: LayoutItem) =>
    PIECES[it.kind].group !== "Room" && it.kind !== "dance" && it.kind !== "stage";
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (!counts(a) || !counts(b)) continue;
      const seatedA = PIECES[a.kind].isTable && a.seats > 0;
      const seatedB = PIECES[b.kind].isTable && b.seats > 0;
      if (!seatedA && !seatedB) continue;
      if ((clashes.has(a.id) && clashes.has(b.id)) || overlaps(a, b)) continue;
      if (overlaps(envelope(a, pad), envelope(b, pad))) out.push({ a: a.id, b: b.id });
    }
  }
  return out;
}
