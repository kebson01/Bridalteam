/**
 * Date formatting for dates that can be far in the future.
 *
 * "Oct 29" is fine for something happening this year and needless clutter for
 * anything recent. It is actively misleading on a wedding plan: a 12-month
 * checklist always straddles two calendar years, and a long engagement can
 * straddle three. A task showing "Oct 29" against a wedding on 29 October 2029
 * gives no way to tell whether it is due this October, next, or the one after.
 *
 * So: show the year only when it isn't the current one. Near-term dates stay
 * short, distant ones stay unambiguous.
 */
export function shortDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  if (Number.isNaN(d.getTime())) return "";

  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}
