/**
 * The public seating chart page's "how many tables?" math.
 *
 * Deliberately simple: guests at a head table (if any) are taken off first,
 * everyone else fills tables of one size, and the last table takes the
 * remainder. No layout, shapes or room size; it answers the question a couple
 * asks their venue and rental company, nothing more.
 */

export interface TablePlan {
  /** Guests seated at the guest tables (not the head table). */
  seated: number;
  tables: number;
  /** Tables filled to `perTable`. */
  fullTables: number;
  /** People at the last, partly filled table; 0 when every table is full. */
  lastTable: number;
  emptySeats: number;
}

const whole = (n: number) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

/**
 * Tables needed for `guests` people at tables of `perTable`, after `headTable`
 * people sit at a separate head table. Null when there's no usable table size.
 */
export function tablePlan(guests: number, perTable: number, headTable = 0): TablePlan | null {
  const size = whole(perTable);
  if (size < 1) return null;
  const seated = Math.max(0, whole(guests) - whole(headTable));
  const tables = Math.ceil(seated / size);
  const remainder = seated % size;
  return {
    seated,
    tables,
    fullTables: remainder === 0 ? tables : tables - 1,
    lastTable: remainder,
    emptySeats: tables * size - seated,
  };
}

/** The table sizes rental companies most often offer, shown side by side. */
export const COMMON_TABLE_SIZES = [8, 10, 12] as const;
