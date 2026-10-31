/**
 * How long guest websites stay up. Mirrors public.wedding_site_ends_on() in
 * migration 20261101120000_custom_site_policy_and_retention.sql, which is
 * what the daily job (app/api/cron/site-retention) actually enforces; this
 * copy is for showing couples the date. Keep the two in step.
 */

export const SITE_MONTHS_AFTER_WEDDING = 6;
export const SITE_MONTHS_WITHOUT_DATE = 24;
export const ADDRESS_HOLD_DAYS = 30;

function addMonths(d: Date, months: number): Date {
  // Postgres date + interval 'N months' clamps to the month's last day (Aug 31 + 6 months = Feb 28/29).
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + months;
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return new Date(Date.UTC(y, m, Math.min(d.getUTCDate(), lastDay)));
}

/** The day the site comes down, as YYYY-MM-DD. */
export function siteEndsOn(eventDate: string | null, createdAt: string): string {
  const base = eventDate ? new Date(`${eventDate}T00:00:00Z`) : new Date(createdAt);
  const day = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  return addMonths(day, eventDate ? SITE_MONTHS_AFTER_WEDDING : SITE_MONTHS_WITHOUT_DATE).toISOString().slice(0, 10);
}

export function formatDay(isoDay: string): string {
  return new Date(`${isoDay}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function retentionNote(eventDate: string | null, createdAt: string): string {
  const ends = formatDay(siteEndsOn(eventDate, createdAt));
  return eventDate
    ? `Your guest website comes down on ${ends}, ${SITE_MONTHS_AFTER_WEDDING} months after your wedding.`
    : `Your guest website comes down on ${ends}. Add your wedding date and it will stay up until ${SITE_MONTHS_AFTER_WEDDING} months after it.`;
}
