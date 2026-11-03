import Link from "next/link";
import { SIGNUP_URL } from "@/lib/config";

/**
 * The card above the planner chat: the wedding the planner is working on, so
 * a couple can see what it already knows about them. It is the same wedding
 * /api/plan picks (the ?w= one, or the caller's soonest), read the same way.
 */

export interface PlannerWedding {
  id: string;
  partner_one: string | null;
  partner_two: string | null;
  event_date: string | null;
  city: string | null;
  region: string | null;
  venue: string | null;
  guest_count: number | null;
  tasksDone: number;
  tasksTotal: number;
}

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
      strokeLinejoin="round" className="h-4 w-4 shrink-0 text-brand-text" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

const ICON = {
  date: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4",
  place: "M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11zM12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z",
  guests: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M16 14.5c2.8.2 5 2.5 5 5.5",
  venue: "M3 21h18M5 21V10l7-6 7 6v11M10 21v-5a2 2 0 0 1 4 0v5",
};

/** "Oct 24, 2026" from "2026-10-24", without a timezone moving the day. */
export function formatEventDate(iso: string | null): string | null {
  if (!iso) return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export default function PlannerWeddingCard({ wedding, signedIn }: { wedding: PlannerWedding | null; signedIn: boolean }) {
  if (!wedding) {
    return (
      <div className="flex flex-col gap-3 rounded-3xl border border-brand/20 bg-brand-wash p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">Make it yours</p>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {signedIn
              ? "Add your date, city and guest count, and the planner tailors every answer to your wedding."
              : "Create a free account and the planner remembers your date, guests and venue, and can add what it suggests to your checklist and budget."}
          </p>
        </div>
        <Link
          href={signedIn ? "/onboarding" : SIGNUP_URL}
          className="inline-flex shrink-0 items-center justify-center self-start rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white sm:self-auto"
        >
          {signedIn ? "Add my wedding" : "Start free"}
        </Link>
      </div>
    );
  }

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";
  const place = [wedding.city, wedding.region].filter(Boolean).join(", ");
  const tiles = [
    { icon: ICON.date, label: "Date", value: formatEventDate(wedding.event_date) },
    { icon: ICON.place, label: "Location", value: place || null },
    { icon: ICON.guests, label: "Guests", value: wedding.guest_count ? `${wedding.guest_count} guests` : null },
    { icon: ICON.venue, label: "Venue", value: wedding.venue },
  ];
  const pct = wedding.tasksTotal ? Math.round((wedding.tasksDone / wedding.tasksTotal) * 100) : 0;

  return (
    <div className="rounded-3xl border border-stone-2 bg-gradient-to-br from-white to-brand-wash/70 p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-white" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 20.5s-7.5-4.6-9.2-9.4C1.6 7.6 4 4.5 7.3 4.5c2 0 3.6 1.1 4.7 2.7 1.1-1.6 2.7-2.7 4.7-2.7 3.3 0 5.7 3.1 4.5 6.6-1.7 4.8-9.2 9.4-9.2 9.4z" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">Planning for</p>
            <p className="text-xl font-medium leading-tight text-ink">{names}</p>
          </div>
        </div>
        <Link
          href={`/w/${wedding.id}`}
          className="inline-flex items-center gap-1 rounded-full border border-stone-2 bg-white px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand-text"
        >
          Edit
        </Link>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="flex items-center gap-2 rounded-xl bg-white/80 px-3 py-2.5">
            <Icon d={t.icon} />
            <div className="min-w-0">
              <dt className="sr-only">{t.label}</dt>
              <dd className={`truncate text-sm ${t.value ? "text-ink" : "text-ink-soft/50"}`}>{t.value ?? `Add ${t.label.toLowerCase()}`}</dd>
            </div>
          </div>
        ))}
      </dl>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-ink-soft">Checklist</span>
          <span className="font-semibold text-brand-text">
            {wedding.tasksTotal ? `${pct}% complete · ${wedding.tasksDone} of ${wedding.tasksTotal}` : "No tasks yet: ask the planner to build one"}
          </span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden rounded-full bg-stone-2"
          role="progressbar"
          aria-label="Checklist progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-deep" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
