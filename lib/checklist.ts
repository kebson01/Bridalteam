import { PLAN_TEMPLATE } from "@/lib/plan-template";

/**
 * The public checklist's dates.
 *
 * Uses PLAN_TEMPLATE, the same starter plan the app seeds for a signed-in
 * couple, and the same rule seed_wedding_plan uses: due date = wedding date
 * minus dueOffsetDays. So the dates on /wedding-checklist are the dates a
 * couple gets after signing up.
 *
 * Dates are plain "YYYY-MM-DD" strings and the math runs in UTC, so a
 * visitor's time zone can't shift a deadline by a day.
 */

export interface ChecklistTask {
  title: string;
  tip?: string;
  /** "YYYY-MM-DD", or null when there's no wedding date or no timing. */
  due: string | null;
  /** Due before `today`. */
  overdue: boolean;
}

export interface ChecklistPhase {
  name: string;
  tasks: ChecklistTask[];
}

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses "YYYY-MM-DD" to a UTC timestamp, or null if it isn't a real date. */
export function parseIsoDate(s: string): number | null {
  const m = ISO.exec(s.trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(t);
  // Rejects 2027-02-30 and friends, which Date.UTC would roll over.
  return d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3] ? t : null;
}

const toIso = (t: number) => new Date(t).toISOString().slice(0, 10);

/** The starter plan with due dates for `weddingDate`, measured against `today`. */
export function datedChecklist(weddingDate: string, today: string): ChecklistPhase[] {
  const wedding = parseIsoDate(weddingDate);
  const now = parseIsoDate(today);
  return PLAN_TEMPLATE.map((m) => ({
    name: m.name,
    tasks: m.deliverables.flatMap((d) =>
      d.tasks.map((t) => {
        const due =
          wedding !== null && typeof t.dueOffsetDays === "number"
            ? toIso(wedding - t.dueOffsetDays * 86_400_000)
            : null;
        return {
          title: t.title,
          tip: t.tip,
          due,
          overdue: due !== null && now !== null && due < toIso(now),
        };
      }),
    ),
  }));
}
