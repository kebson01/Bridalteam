import { METROS, metroOf } from "@/lib/areas";

/**
 * Who gets an email today. Pure, so the rules that keep the campaign safe are
 * tested without a database:
 *
 *  - Warm-up. A brand-new sending domain that jumps straight to volume lands
 *    in spam, so the daily total starts at 20 and rises to 35, then 50, as
 *    days of sending accumulate (weekdays only; the schedule runs Mon-Fri).
 *  - Follow-ups first. Each one is due 7 days after the first email and is
 *    the last message that vendor will ever get, so it is not left waiting
 *    behind new sends.
 *  - One metro at a time, best categories first. VENDOR-OUTREACH.md: work a
 *    metro before moving on, and start with the vendors who say yes fastest
 *    (photographers, florists) and leave venues and caterers for last.
 *  - Never twice. An address that has been emailed, suppressed, or appears on
 *    two listings is emailed once, ever.
 *  - Pause on trouble. Too many bounces or any real number of spam complaints
 *    stops the campaign until a person looks at it.
 */

export interface Candidate {
  orgId: string;
  email: string;
  businessName: string;
  category: string | null;
  city: string | null;
  published: boolean;
}

export interface FollowUpDue {
  orgId: string;
  email: string;
  firstSentAt: string;
}

export const FOLLOWUP_AFTER_DAYS = 7;

/** Lower goes first. Anything unlisted sits in the middle. */
const CATEGORY_TIER: Record<string, number> = {
  photography: 1,
  videography: 1,
  florist: 2,
  "cake & dessert": 2,
  "dessert cart": 2,
  dj: 3,
  band: 3,
  officiant: 3,
  "ceremony music": 3,
  "hair & makeup": 4,
  "wedding planner": 4,
  "bridal salon": 4,
  venue: 9,
  caterer: 9,
};
const DEFAULT_TIER = 5;

const METRO_RANK = new Map(METROS.map((m, i) => [m.id, i]));

/** The daily limit after `sendDays` days of sending. */
export function warmupCap(sendDays: number, dailyMax: number): number {
  const step = sendDays < 5 ? 20 : sendDays < 10 ? 35 : 50;
  return Math.max(0, Math.min(step, dailyMax));
}

export interface CampaignStats {
  sent: number;
  bounced: number;
  complained: number;
}

/** A reason to stop sending, or null to carry on. */
export function pauseReason({ sent, bounced, complained }: CampaignStats): string | null {
  if (complained >= 2 || (sent >= 300 && complained / sent > 0.003)) {
    return `${complained} spam complaints from ${sent} emails. Review the wording and the list before resuming.`;
  }
  if (sent >= 40 && bounced / sent > 0.05) {
    return `${bounced} of ${sent} emails bounced (over 5%). Clean the address list before resuming.`;
  }
  return null;
}

export const isPlausibleEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(e) && e.length <= 254;

export interface PlanInput {
  candidates: Candidate[];
  followUps: FollowUpDue[];
  /** Lowercased addresses that must not get a first email: suppressions plus every address already emailed. */
  blocked: Set<string>;
  /** Lowercased addresses that must not get anything, follow-ups included. */
  suppressed: Set<string>;
  cap: number;
  now: Date;
}

export interface Plan {
  followUps: FollowUpDue[];
  firsts: Candidate[];
}

export function planToday({ candidates, followUps, blocked, suppressed, cap, now }: PlanInput): Plan {
  const cutoff = now.getTime() - FOLLOWUP_AFTER_DAYS * 86_400_000;
  const due = followUps
    .filter((f) => new Date(f.firstSentAt).getTime() <= cutoff && !suppressed.has(f.email.toLowerCase()))
    .sort((a, b) => a.firstSentAt.localeCompare(b.firstSentAt))
    .slice(0, cap);

  const rank = (c: Candidate) => {
    const metro = metroOf(c.city);
    return [
      metro === null ? METROS.length : (METRO_RANK.get(metro) ?? METROS.length),
      CATEGORY_TIER[(c.category ?? "").toLowerCase()] ?? DEFAULT_TIER,
      c.published ? 0 : 1, // a live page is a better first impression than a draft
    ];
  };
  const byPriority = (a: Candidate, b: Candidate) => {
    const ra = rank(a);
    const rb = rank(b);
    for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i];
    return a.businessName.localeCompare(b.businessName);
  };

  // Addresses on more than one listing are emailed once, for the best-ranked listing.
  const seen = new Set<string>();
  const firsts: Candidate[] = [];
  for (const c of [...candidates].sort(byPriority)) {
    if (firsts.length >= cap - due.length) break;
    const key = c.email.trim().toLowerCase();
    if (!isPlausibleEmail(key) || blocked.has(key) || seen.has(key)) continue;
    seen.add(key);
    firsts.push(c);
  }
  return { followUps: due, firsts };
}
