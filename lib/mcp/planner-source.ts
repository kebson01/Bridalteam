import { supabasePublic } from "@/lib/supabase";
import { InvalidSiteKeyError } from "@/lib/mcp/site-tools";

/**
 * The planner tools' view of the database: the key_planner_* functions from
 * migration 20261101150000_assistant_planner_access.sql, called with the
 * public anon key. As with the site tools, the key IS the authorization —
 * each function resolves it, acts as the person who connected the assistant
 * and touches only that wedding's rows.
 */

export type PlannerKind = "tasks" | "budget" | "guests" | "menu" | "vendors" | "travel" | "layouts" | "registry";

export interface PlannerSource {
  scope(): Promise<"site" | "planner">;
  overview(): Promise<Record<string, unknown>>;
  list(kind: PlannerKind): Promise<Record<string, unknown>[]>;
  /** Insert when id is null, else update. Returns the saved row. */
  save(kind: PlannerKind, id: string | null, fields: Record<string, unknown>): Promise<Record<string, unknown>>;
  remove(kind: PlannerKind, id: string): Promise<boolean>;
  updateWedding(fields: Record<string, unknown>, shiftDeadlines: boolean): Promise<Record<string, unknown>>;
  seed(what: "checklist" | "budget", template: unknown): Promise<number>;
  recordRsvp(guestId: string, attending: boolean, attendees: { name: string | null; menu_option_id: string | null }[], dietary: string, note: string): Promise<void>;
  seat(attendeeId: string, table: string | null, seat: number | null): Promise<boolean>;
}

/** A key that's valid but only for the website (made with "Your own AI"). */
export class WebsiteOnlyKeyError extends Error {}

/** No such row in this wedding (or it belongs to another wedding). */
export class NotFoundError extends Error {}

/** The database refused a value (bad date, negative amount, unknown status, ...). */
export class InvalidValueError extends Error {}

export function supabasePlannerSource(key: string): PlannerSource {
  const db = supabasePublic();

  async function call<T>(fn: string, args: Record<string, unknown>): Promise<T> {
    const { data, error } = await db.rpc(fn, { p_key: key, ...args });
    if (error) {
      if (error.code === "28000") throw new InvalidSiteKeyError();
      if (error.code === "BT002") throw new WebsiteOnlyKeyError();
      if (error.code === "P0002") throw new NotFoundError();
      // 22xxx data exceptions and 23xxx constraint violations: the value, not us.
      if (error.code?.startsWith("22") || error.code?.startsWith("23")) throw new InvalidValueError(error.message);
      throw new Error(`${fn} failed: ${error.code} ${error.message}`);
    }
    return data as T;
  }

  return {
    scope: () => call<"site" | "planner">("key_scope", {}),
    overview: () => call("key_planner_overview", {}),
    list: (kind) => call("key_planner_list", { p_kind: kind }),
    save: (kind, id, fields) => call("key_planner_save", { p_kind: kind, p_id: id, p_fields: fields }),
    remove: (kind, id) => call("key_planner_delete", { p_kind: kind, p_id: id }),
    updateWedding: (fields, shift) => call("key_planner_update_wedding", { p_fields: fields, p_shift_deadlines: shift }),
    seed: (what, template) => call("key_planner_seed", { p_what: what, p_template: template }),
    recordRsvp: (guestId, attending, attendees, dietary, note) =>
      call("key_planner_record_rsvp", {
        p_guest: guestId,
        p_attending: attending,
        p_attendees: attendees,
        p_dietary: dietary,
        p_note: note,
      }),
    seat: (attendeeId, table, seat) => call("key_planner_seat", { p_attendee: attendeeId, p_table: table, p_seat: seat }),
  };
}
