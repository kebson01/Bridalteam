"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { count, duration, pageLabel, pct, shortDay } from "@/lib/analytics-format";
import { excludeAdminBrowserByDefault, setTrackingDisabled, trackingDisabled } from "@/lib/events";

/**
 * Website analytics: visits, page views, time on site, where people land, where
 * they go next, where they leave, where they came from, and how many sign up.
 *
 * Everything is first-party (public.page_events), with no cookie and no
 * third-party script. A "visit" is one browser tab until it closes or sits
 * idle for 30 minutes; nobody is followed across visits. See
 * supabase/migrations/20261102120000_page_events_visits.sql.
 */

type Row = Record<string, string | number | null>;
type Summary = {
  range: { days: number; scope: string };
  totals: {
    page_views: number;
    visits: number;
    pages_per_visit: number;
    avg_visit_seconds: number;
    bounce_rate: number | null;
    signup_visits: number;
    visit_to_signup: number | null;
    planner_messages: number;
    visits_tracked_since: string | null;
    new_accounts: number;
    new_weddings: number;
    new_vendor_accounts: number;
  };
  daily: { day: string; views: number; visits: number; signups: number }[];
  top_pages: { path: string; views: number; share: number; visits: number; avg_seconds: number | null }[];
  entry_pages: { path: string; visits: number; share: number; bounce_rate: number; signups: number }[];
  exit_pages: { path: string; visits: number; share: number }[];
  flows: { from: string; to: string; count: number }[];
  sources: { source: string; visits: number; share: number; signups: number }[];
  vendors: { profile_views: number; website_clicks: number; top: { name: string; org_id: string; views: number; clicks: number }[] };
};

const RANGES: [number, string][] = [
  [1, "Today"],
  [7, "7 days"],
  [30, "30 days"],
  [90, "90 days"],
  [365, "12 months"],
];

const card = "rounded-2xl border border-stone-2 bg-white p-5 shadow-card";
const th = "whitespace-nowrap pb-2 pl-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-soft/60 first:pl-0";
const td = "py-1.5 pr-3 align-top text-sm text-ink";
const num = "whitespace-nowrap py-1.5 pl-3 text-right align-top text-sm tabular-nums text-ink";

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const [scope, setScope] = useState<"public" | "all">("public");
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [excluded, setExcluded] = useState(false);

  // This page's effect runs before the layout's tracker, so apply the same
  // admin default here before reading it.
  useEffect(() => {
    excludeAdminBrowserByDefault();
    setExcluded(trackingDisabled());
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?days=${days}&scope=${scope}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(res.status === 401 ? "Sign in on the admin dashboard first." : (body.error ?? "Couldn't load analytics."));
        return;
      }
      setData(body as Summary);
    } finally {
      setLoading(false);
    }
  }, [days, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  const t = data?.totals;

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-light uppercase tracking-wide text-ink">Analytics</h1>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-brand-text">
          ← Admin
        </Link>
      </div>

      {/* Filters: one row above everything they control. */}
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1 rounded-full border border-stone-2 bg-white p-1" role="group" aria-label="Date range">
          {RANGES.map(([d, label]) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`rounded-full px-3 py-1.5 text-sm ${days === d ? "bg-brand text-white" : "text-ink-soft hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-full border border-stone-2 bg-white p-1" role="group" aria-label="Pages included">
          {(["public", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              aria-pressed={scope === s}
              className={`rounded-full px-3 py-1.5 text-sm ${scope === s ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}
            >
              {s === "public" ? "Website" : "Website + app"}
            </button>
          ))}
        </div>
        {loading && <span className="text-sm text-ink-soft/60">Loading…</span>}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {t && data && (
        <>
          {/* Headline numbers */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Visits" value={count(t.visits)} sub={`${t.pages_per_visit || 0} pages per visit`} />
            <Tile label="Page views" value={count(t.page_views)} />
            <Tile label="Avg. time per visit" value={duration(t.avg_visit_seconds)} />
            <Tile label="Left after one page" value={pct(t.bounce_rate)} sub="bounce rate" />
            <Tile label="New accounts" value={count(t.new_accounts)} sub={`${count(t.new_weddings)} weddings · ${count(t.new_vendor_accounts)} vendors`} />
            <Tile label="Visits that signed up" value={count(t.signup_visits)} sub={`${pct(t.visit_to_signup)} of visits`} />
            <Tile label="AI planner messages" value={count(t.planner_messages)} />
            <Tile label="Vendor website clicks" value={count(data.vendors.website_clicks)} sub={`${count(data.vendors.profile_views)} profile views`} />
          </div>

          <p className="mt-3 text-xs leading-relaxed text-ink-soft/60">
            A visit is one browser tab until it closes or sits idle for 30 minutes; someone who comes back later counts as a
            new visit. Visits and time on site are counted from{" "}
            {t.visits_tracked_since ? new Date(t.visits_tracked_since).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "the next visit"}
            ; page views go back further. {scope === "public" ? "Signed-in app pages (dashboard, wedding workspace, vendor tools) are left out." : "Includes signed-in app pages."}
          </p>

          <DailyChart daily={data.daily} />

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className={card}>
              <Heading title="Most visited pages" note="Share of all page views, and average time on the page." />
              <ShareTable
                rows={data.top_pages}
                cols={[
                  ["Views", (r) => count(r.views as number)],
                  ["Share", (r) => pct(r.share as number)],
                  ["Avg. time", (r) => duration(r.avg_seconds as number | null)],
                ]}
                shareKey="share"
              />
            </section>

            <section className={card}>
              <Heading title="Where visits start" note="The first page of each visit, how many left without a second page, and how many signed up." />
              <ShareTable
                rows={data.entry_pages}
                cols={[
                  ["Visits", (r) => count(r.visits as number)],
                  ["Left at once", (r) => pct(r.bounce_rate as number)],
                  ["Signups", (r) => count(r.signups as number)],
                ]}
                shareKey="share"
              />
            </section>

            <section className={card}>
              <Heading title="Where people go next" note="The most common clicks from one page to another." />
              {data.flows.length === 0 ? (
                <Empty />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={th}>From</th>
                      <th className={th}>To</th>
                      <th className={`${th} text-right`}>Times</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.flows.map((f) => (
                      <tr key={`${f.from}>${f.to}`} className="border-t border-stone-2/60">
                        <td className={`${td} break-all`}>{pageLabel(f.from)}</td>
                        <td className={`${td} break-all`}>→ {pageLabel(f.to)}</td>
                        <td className={num}>{count(f.count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>

            <section className={card}>
              <Heading title="Where visits end" note="The last page people saw before leaving." />
              <ShareTable rows={data.exit_pages} cols={[["Visits", (r) => count(r.visits as number)], ["Share", (r) => pct(r.share as number)]]} shareKey="share" />
            </section>

            <section className={card}>
              <Heading title="Where visitors come from" note="Campaign tag (utm_source) or the referring website; (direct) means typed in or bookmarked." />
              <ShareTable
                rows={data.sources.map((s) => ({ ...s, path: s.source }))}
                cols={[
                  ["Visits", (r) => count(r.visits as number)],
                  ["Share", (r) => pct(r.share as number)],
                  ["Signups", (r) => count(r.signups as number)],
                ]}
                shareKey="share"
                raw
              />
            </section>

            <section className={card}>
              <Heading title="Most viewed vendors" note="Profile views and clicks through to the vendor's own website." />
              {data.vendors.top.length === 0 ? (
                <Empty />
              ) : (
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className={th}>Vendor</th>
                      <th className={`${th} text-right`}>Views</th>
                      <th className={`${th} text-right`}>Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.vendors.top.map((v) => (
                      <tr key={v.org_id} className="border-t border-stone-2/60">
                        <td className={td}>
                          <a href={`/v/${v.org_id}`} target="_blank" rel="noreferrer" className="hover:text-brand-text">
                            {v.name}
                          </a>
                        </td>
                        <td className={num}>{count(v.views)}</td>
                        <td className={num}>{count(v.clicks)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        </>
      )}

      <div className="mt-8 rounded-2xl border border-dashed border-stone-2 p-4 text-sm text-ink-soft/80">
        {excluded ? (
          <>
            This browser is <strong className="text-ink">not counted</strong>, so your own visits don&rsquo;t show up here.{" "}
            <button
              className="font-semibold text-brand-text"
              onClick={() => {
                setTrackingDisabled(false);
                setExcluded(false);
              }}
            >
              Count this browser again
            </button>
          </>
        ) : (
          <>
            This browser is counted.{" "}
            <button
              className="font-semibold text-brand-text"
              onClick={() => {
                setTrackingDisabled(true);
                setExcluded(true);
              }}
            >
              Stop counting my visits
            </button>
          </>
        )}
      </div>
    </main>
  );
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className={card}>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/60">{label}</p>
      <p className="mt-1 text-2xl font-light tabular-nums text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft/60">{sub}</p>}
    </div>
  );
}

function Heading({ title, note }: { title: string; note: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-base font-medium text-ink">{title}</h2>
      <p className="text-xs text-ink-soft/60">{note}</p>
    </div>
  );
}

const Empty = () => <p className="text-sm text-ink-soft/60">Nothing yet for this period.</p>;

/** A table whose first column carries a thin bar showing each row's share. */
function ShareTable({
  rows,
  cols,
  shareKey,
  raw = false,
}: {
  rows: Row[];
  cols: [string, (r: Row) => string][];
  shareKey: string;
  raw?: boolean;
}) {
  if (rows.length === 0) return <Empty />;
  const max = Math.max(...rows.map((r) => Number(r[shareKey]) || 0), 0.0001);
  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className={th}>{raw ? "Source" : "Page"}</th>
          {cols.map(([label]) => (
            <th key={label} className={`${th} text-right`}>
              {label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={`${r.path}-${i}`} className="border-t border-stone-2/60">
            <td className={td}>
              <div className="break-all">{raw ? String(r.path) : pageLabel(r.path as string)}</div>
              <div className="mt-1 h-1 rounded-full bg-stone-4" aria-hidden>
                <div className="h-1 rounded-full bg-brand" style={{ width: `${((Number(r[shareKey]) || 0) / max) * 100}%` }} />
              </div>
            </td>
            {cols.map(([label, fmt]) => (
              <td key={label} className={num}>
                {fmt(r)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Visits per day: one series, so no legend; hover (or focus) a day for its numbers. */
function DailyChart({ daily }: { daily: Summary["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  if (daily.length === 0) return null;
  const max = Math.max(...daily.map((d) => d.visits), 1);
  const active = hover !== null ? daily[hover] : null;
  const labelEvery = Math.max(1, Math.ceil(daily.length / 8));

  return (
    <section className={`${card} mt-6`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 className="text-base font-medium text-ink">Visits per day</h2>
          <p className="text-xs text-ink-soft/60">
            {active
              ? `${shortDay(active.day)}: ${count(active.visits)} visits · ${count(active.views)} page views · ${count(active.signups)} new accounts`
              : "Hover a day for its visits, page views and new accounts."}
          </p>
        </div>
        <button onClick={() => setAsTable((v) => !v)} className="text-xs font-semibold text-brand-text">
          {asTable ? "Show chart" : "Show as table"}
        </button>
      </div>

      {asTable ? (
        <div className="mt-3 max-h-80 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Day</th>
                <th className={`${th} text-right`}>Visits</th>
                <th className={`${th} text-right`}>Page views</th>
                <th className={`${th} text-right`}>New accounts</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((d) => (
                <tr key={d.day} className="border-t border-stone-2/60">
                  <td className={td}>{shortDay(d.day)}</td>
                  <td className={num}>{count(d.visits)}</td>
                  <td className={num}>{count(d.views)}</td>
                  <td className={num}>{count(d.signups)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4">
          <div className="relative flex h-40 items-end gap-[2px] border-b border-stone-2" onMouseLeave={() => setHover(null)}>
            <span className="pointer-events-none absolute -top-1 left-0 text-[10px] tabular-nums text-ink-soft/50">{count(max)}</span>
            {daily.map((d, i) => (
              <button
                key={d.day}
                type="button"
                aria-label={`${shortDay(d.day)}: ${d.visits} visits`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="flex h-full min-w-0 flex-1 items-end justify-center"
              >
                <span
                  className={`block w-full max-w-[24px] rounded-t-[4px] ${hover === i ? "bg-brand-dark" : "bg-brand"}`}
                  style={{ height: d.visits ? `${Math.max(2, (d.visits / max) * 100)}%` : "0" }}
                />
              </button>
            ))}
          </div>
          <div className="mt-1 flex gap-[2px]">
            {daily.map((d, i) => (
              <span key={d.day} className="min-w-0 flex-1 text-center text-[10px] text-ink-soft/50">
                {i % labelEvery === 0 ? shortDay(d.day) : ""}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
