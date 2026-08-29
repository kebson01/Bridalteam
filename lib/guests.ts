/**
 * Shared guest-list rules.
 *
 * Lives outside the "use server" action module because that file may only
 * export async functions — and because the page and the server both need these
 * numbers. One definition, so the count the couple sees can't drift from the
 * rule the server actually enforces.
 */

/** How long to leave a household alone between reminders. */
export const REMINDER_COOLDOWN_DAYS = 3;

/** The cutoff: anyone reminded before this may be reminded again. */
export function reminderCutoff(now: Date = new Date()): Date {
  return new Date(now.getTime() - REMINDER_COOLDOWN_DAYS * 86_400_000);
}

/**
 * Can this household be nudged right now?
 *
 * Invited, still silent, reachable by email, and not chased in the last few
 * days. The server re-checks this in the query that picks recipients — this
 * copy exists so the button can show a truthful count and disable itself.
 */
export function canRemind(
  g: {
    email: string | null;
    invited_at: string | null;
    responded_at: string | null;
    reminded_at: string | null;
  },
  now: Date = new Date(),
): boolean {
  if (!g.email || !g.invited_at || g.responded_at) return false;
  if (!g.reminded_at) return true;
  return new Date(g.reminded_at) < reminderCutoff(now);
}
