/**
 * Who sits in which chair, for the layout's seat dial and table roster.
 *
 * Pure data — no React, no Supabase — so the editor, the print page and the
 * tests share one set of rules. People are matched to tables by name
 * (tableKey), the same way the guest list and the layout already agree on
 * "4" and "Table 4".
 */

import { tableKey } from "@/lib/venue-layout";

/** One confirmed person, as the layout sees them. */
export interface SeatGuest {
  /** guest_attendees.id */
  id: string;
  name: string;
  household: string;
  /** Free-text table name from the guest list. Null = not seated. */
  tableName: string | null;
  /** 1-based chair, clockwise from 12 o'clock. Null = no chair chosen. */
  seat: number | null;
  dish: string | null;
  /** The household's allergies and dietary needs, free text. */
  dietary: string | null;
}

/** A change to one person's seat, as sent to the server. */
export interface SeatChange {
  id: string;
  table_name: string | null;
  seat_number: number | null;
}

/**
 * Short tags for the dietary text a household typed on their RSVP ("Sam is
 * gluten free, no nuts please" → GF, NUT FREE), so a caterer can scan a table
 * at a glance. Anything not recognised is still shown in full in the roster;
 * the tags are a summary, not a replacement.
 */
const TAGS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bvegan\b/i, "VEGAN"],
  [/\bvegetarian\b|\bveggie\b/i, "VEG"],
  [/\bgluten|coeliac|celiac|\bgf\b/i, "GF"],
  [/\bdairy|lactose|\bdf\b/i, "DF"],
  [/\bnut|peanut/i, "NUT FREE"],
  [/shellfish|\bfish\b|seafood|pescatarian/i, "FISH"],
  [/\bhalal\b/i, "HALAL"],
  [/\bkosher\b/i, "KOSHER"],
  [/\begg/i, "EGG FREE"],
  [/epi-?pen|anaphyla|severe/i, "SEVERE"],
];

export function dietaryTags(text: string | null | undefined): string[] {
  if (!text?.trim()) return [];
  const out: string[] = [];
  for (const [re, tag] of TAGS) if (re.test(text) && !out.includes(tag)) out.push(tag);
  // Vegan implies vegetarian and dairy free; saying all three is noise.
  if (out.includes("VEGAN")) return out.filter((t) => t !== "VEG" && t !== "DF");
  return out.length ? out : ["NOTE"];
}

/** "4" → "Table 4"; "Oak" stays "Oak". How a table is named on screen and in the guest list. */
export function tableTitle(label: string): string {
  return /^\d+$/.test(label.trim()) ? `Table ${label.trim()}` : label.trim();
}

/** "Elena Rostova" → "ER"; "Prince" → "PR". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Everyone grouped by tableKey of their table name; unseated people are left out. */
export function guestsByTable(guests: SeatGuest[]): Map<string, SeatGuest[]> {
  const out = new Map<string, SeatGuest[]>();
  for (const g of guests) {
    const k = g.tableName ? tableKey(g.tableName) : "";
    if (!k) continue;
    out.set(k, [...(out.get(k) ?? []), g]);
  }
  return out;
}

export interface TableSeating {
  /** One entry per chair; null = empty. */
  chairs: (SeatGuest | null)[];
  /** Seated at this table with no chair left for them. */
  overflow: SeatGuest[];
}

/**
 * Puts a table's people in its chairs: anyone with a chair number keeps it
 * (first come, if two claim the same one), then everyone else fills the
 * lowest free chairs in guest-list order. Whoever is left over has no chair.
 */
export function seatTable(guests: SeatGuest[], seats: number): TableSeating {
  const chairs: (SeatGuest | null)[] = Array.from({ length: Math.max(0, seats) }, () => null);
  const waiting: SeatGuest[] = [];
  for (const g of guests) {
    const i = g.seat !== null && Number.isInteger(g.seat) ? g.seat - 1 : -1;
    if (i >= 0 && i < chairs.length && !chairs[i]) chairs[i] = g;
    else waiting.push(g);
  }
  const overflow: SeatGuest[] = [];
  for (const g of waiting) {
    const free = chairs.indexOf(null);
    if (free === -1) overflow.push(g);
    else chairs[free] = g;
  }
  return { chairs, overflow };
}

/**
 * Writes down where everyone at a table is drawn right now, for anyone whose
 * saved chair differs. Done before any move at that table, so a person without
 * a chair number doesn't hop into a seat someone else has just left.
 */
function pin(seating: TableSeating, tableName: string): SeatChange[] {
  const out: SeatChange[] = [];
  seating.chairs.forEach((g, i) => {
    if (g && (g.seat !== i + 1 || g.tableName !== tableName)) {
      out.push({ id: g.id, table_name: tableName, seat_number: i + 1 });
    }
  });
  return out;
}

/** Later changes to the same person win. */
function merge(changes: SeatChange[]): SeatChange[] {
  const byId = new Map<string, SeatChange>();
  for (const c of changes) byId.set(c.id, c);
  return [...byId.values()];
}

/**
 * Swaps what's in two chairs of one table: two people trade places, or one
 * person moves into an empty chair.
 */
export function swapSeats(
  guests: SeatGuest[],
  tableName: string,
  seats: number,
  a: number,
  b: number,
): SeatChange[] {
  if (a === b) return [];
  const seating = seatTable(guestsByTable(guests).get(tableKey(tableName)) ?? [], seats);
  const ga = seating.chairs[a - 1] ?? null;
  const gb = seating.chairs[b - 1] ?? null;
  if (!ga && !gb) return [];
  const changes = pin(seating, tableName);
  if (ga) changes.push({ id: ga.id, table_name: tableName, seat_number: b });
  if (gb) changes.push({ id: gb.id, table_name: tableName, seat_number: a });
  return merge(changes);
}

/**
 * Seats a person at a table — in `seat` if given and free, otherwise the first
 * free chair, otherwise at the table with no chair (it's full; the editor says
 * so). Moving someone from another table leaves that table's chairs as drawn.
 */
export function seatGuest(
  guests: SeatGuest[],
  guestId: string,
  tableName: string,
  seats: number,
  seat?: number,
): SeatChange[] {
  const others = guests.filter((g) => g.id !== guestId);
  const seating = seatTable(guestsByTable(others).get(tableKey(tableName)) ?? [], seats);
  const changes = pin(seating, tableName);
  let chair: number | null = null;
  if (seat && seat >= 1 && seat <= seats && !seating.chairs[seat - 1]) chair = seat;
  else {
    const free = seating.chairs.indexOf(null);
    chair = free === -1 ? null : free + 1;
  }
  changes.push({ id: guestId, table_name: tableName, seat_number: chair });
  return merge(changes);
}

export function unseatGuest(guestId: string): SeatChange[] {
  return [{ id: guestId, table_name: null, seat_number: null }];
}

/** The guest list after `changes`, so the editor can show a move before the server confirms it. */
export function applySeatChanges(guests: SeatGuest[], changes: SeatChange[]): SeatGuest[] {
  if (!changes.length) return guests;
  const byId = new Map(changes.map((c) => [c.id, c]));
  return guests.map((g) => {
    const c = byId.get(g.id);
    return c ? { ...g, tableName: c.table_name, seat: c.seat_number } : g;
  });
}

/** Validates changes arriving at the server from the browser. */
export function cleanSeatChanges(raw: unknown): SeatChange[] {
  if (!Array.isArray(raw)) return [];
  const out: SeatChange[] = [];
  for (const r of raw.slice(0, 60)) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (typeof o.id !== "string" || !/^[0-9a-f-]{36}$/i.test(o.id)) continue;
    const table = typeof o.table_name === "string" ? o.table_name.trim().slice(0, 60) : "";
    const seat =
      table && typeof o.seat_number === "number" && Number.isInteger(o.seat_number) && o.seat_number >= 1 && o.seat_number <= 24
        ? o.seat_number
        : null;
    out.push({ id: o.id, table_name: table || null, seat_number: seat });
  }
  return merge(out);
}
