/**
 * Plan promotions, set up at /admin/promotions: give a group of vendors Pro or
 * Featured for a date range. The rule lives in the plan_promotions table and is
 * resolved live by the database (migration 20261115160000_plan_promotions.sql);
 * lib/tiers.ts effectivePlan() folds it in. This file checks what the admin
 * page sends.
 */

/** Promotion dates are whole days in the site's home time zone (Florida). */
export const PROMO_TIME_ZONE = "America/New_York";

export type PromotionAudience = {
  mode: "all" | "groups" | "picked";
  categories: string[] | null;
  cities: string[] | null;
  published_only: boolean;
  claimed_only: boolean;
  org_ids: string[] | null;
};

export type PromotionInput = {
  name: string;
  plan: "pro" | "featured";
  starts_at: string;
  ends_at: string;
  note: string | null;
} & Omit<PromotionAudience, "mode">;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MAX_LIST = 500;

/** Minutes the zone is ahead of UTC at instant `t` (negative west of UTC). */
function zoneOffsetMinutes(t: number, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(new Date(t))
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - t) / 60000);
}

/** The instant a calendar day (YYYY-MM-DD) starts in `timeZone`, or null if not a real date. */
export function startOfDay(day: string, timeZone = PROMO_TIME_ZONE): Date | null {
  const m = DAY.exec(day);
  if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]];
  const guess = Date.UTC(y, mo - 1, d);
  const check = new Date(guess);
  if (check.getUTCFullYear() !== y || check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null;
  // Correct twice so a DST change between the guess and the answer is handled.
  let t = guess - zoneOffsetMinutes(guess, timeZone) * 60000;
  t = guess - zoneOffsetMinutes(t, timeZone) * 60000;
  return new Date(t);
}

/** The instant just after `day` ends in `timeZone`: a promotion "until Dec 31" runs through Dec 31. */
export function endOfDay(day: string, timeZone = PROMO_TIME_ZONE): Date | null {
  const m = DAY.exec(day);
  if (!m || !startOfDay(day, timeZone)) return null;
  const next = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3] + 1));
  return startOfDay(next.toISOString().slice(0, 10), timeZone);
}

/** The calendar day an instant falls on in `timeZone`, as YYYY-MM-DD. */
export function dayOf(iso: string | Date, timeZone = PROMO_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(iso),
  );
}

/** The last day a promotion covers, for display: ends_at is the instant after it. */
export function lastDayOf(endsAt: string, timeZone = PROMO_TIME_ZONE): string {
  return dayOf(new Date(new Date(endsAt).getTime() - 1), timeZone);
}

function list(v: unknown, max: number): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = [...new Set(v.filter((x): x is string => typeof x === "string").map((x) => x.trim().slice(0, max)).filter(Boolean))];
  return out.length ? out.slice(0, MAX_LIST) : null;
}

/** Checks an audience from the admin page. Returns it, or an error to show. */
export function parseAudience(raw: unknown): { value: PromotionAudience } | { error: string } {
  const a = (raw ?? {}) as Record<string, unknown>;
  const mode = a.mode === "groups" || a.mode === "picked" ? a.mode : a.mode === "all" ? "all" : null;
  if (!mode) return { error: "Choose who gets the promotion." };
  const published_only = a.published_only === true;
  const claimed_only = a.claimed_only === true;

  if (mode === "all") {
    return { value: { mode, categories: null, cities: null, org_ids: null, published_only, claimed_only } };
  }
  if (mode === "groups") {
    const categories = list(a.categories, 80);
    const cities = list(a.cities, 100);
    if (!categories && !cities) return { error: "Pick at least one category or city." };
    return { value: { mode, categories, cities, org_ids: null, published_only, claimed_only } };
  }
  const org_ids = list(a.org_ids, 36)?.filter((id) => UUID.test(id)) ?? [];
  if (!org_ids.length) return { error: "Pick at least one vendor." };
  return { value: { mode, categories: null, cities: null, org_ids, published_only, claimed_only } };
}

/**
 * Checks a new promotion. `start` is "now" or a YYYY-MM-DD day; `end` is the
 * last day it covers (inclusive).
 */
export function parsePromotion(raw: unknown, now = new Date()): { value: PromotionInput } | { error: string } {
  const b = (raw ?? {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim().slice(0, 120) : "";
  if (!name) return { error: "Give the promotion a name, like \"Holiday 2026: Pro for everyone\"." };
  const plan = b.plan === "pro" || b.plan === "featured" ? b.plan : null;
  if (!plan) return { error: "Choose Pro or Featured." };

  const start = b.start === "now" || b.start == null || b.start === "" ? now : startOfDay(String(b.start));
  if (!start) return { error: "That start date isn't valid." };
  const end = typeof b.end === "string" ? endOfDay(b.end) : null;
  if (!end) return { error: "Choose the last day of the promotion." };
  if (end <= now) return { error: "The end date has already passed." };
  if (end <= start) return { error: "The end date must be after the start date." };

  const audience = parseAudience(b.audience);
  if ("error" in audience) return audience;
  const { mode: _mode, ...who } = audience.value;
  void _mode;

  const note = typeof b.note === "string" && b.note.trim() ? b.note.trim().slice(0, 500) : null;
  return { value: { name, plan, starts_at: start.toISOString(), ends_at: end.toISOString(), note, ...who } };
}

/** Running, scheduled or over, for the admin list. */
export function promotionStatus(
  p: { starts_at: string; ends_at: string; ended_at: string | null },
  now = new Date(),
): "scheduled" | "running" | "ended" {
  if (p.ended_at || new Date(p.ends_at) <= now) return "ended";
  return new Date(p.starts_at) > now ? "scheduled" : "running";
}
