"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { dayOf, lastDayOf } from "@/lib/promotions";
import { TIERS } from "@/lib/tiers";
import { useAdmin } from "@/components/admin/admin-shell";
import { Badge, Card, CardTitle, Empty, Field, Icon, Kpi, Notice, PageHeader, SearchBox, btn, field, table } from "@/components/admin/ui";

/**
 * Plan promotions: give vendors Pro or Featured for a set time, without
 * payment. "Everyone gets Pro until Dec 31", or only certain categories or
 * cities, or hand-picked vendors. Vendors covered get the plan's features
 * straight away, including vendors who sign up while it runs, and lose them
 * when it ends. See app/api/admin/promotions and lib/promotions.ts.
 */

type Mode = "all" | "groups" | "picked";
type Vendor = { org_id: string; business_name: string; category?: string | null; city?: string | null; status?: string };
type Promotion = {
  id: string;
  name: string;
  plan: "pro" | "featured";
  starts_at: string;
  ends_at: string;
  categories: string[] | null;
  cities: string[] | null;
  published_only: boolean;
  claimed_only: boolean;
  org_ids: string[] | null;
  note: string | null;
  created_by: string | null;
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
  status: "scheduled" | "running" | "ended";
  reach: number;
  vendors: Vendor[];
};

/** Labels that sit over a group of controls rather than one input (so not a kit <Field>). */
const label = "text-xs font-semibold text-ink-soft";
const checkbox = "size-4 accent-[var(--color-brand)]";
/** A selectable pill: the audience mode and the category/city chips. */
const choice = (on: boolean) =>
  `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
    on ? "border-brand bg-brand-wash font-semibold text-brand-text" : "border-stone-2 bg-white text-ink-soft hover:border-brand"
  }`;
const STATUS_TONE = { running: "green", scheduled: "amber", ended: "grey" } as const;
const STATUS_LABEL = { running: "Running", scheduled: "Scheduled", ended: "Ended" } as const;

const fmtDay = (day: string) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function audienceSummary(p: Pick<Promotion, "categories" | "cities" | "org_ids" | "published_only" | "claimed_only" | "vendors">) {
  const parts: string[] = [];
  if (p.org_ids?.length) {
    const names = p.vendors.map((v) => v.business_name);
    parts.push(names.length <= 3 ? names.join(", ") : `${names.slice(0, 3).join(", ")} and ${names.length - 3} more`);
  } else if (p.categories?.length || p.cities?.length) {
    if (p.categories?.length) parts.push(p.categories.join(", "));
    if (p.cities?.length) parts.push(`in ${p.cities.join(", ")}`);
  } else {
    parts.push("All vendors");
  }
  const limits = [p.published_only && "published", p.claimed_only && "claimed"].filter(Boolean);
  if (limits.length) parts.push(`(${limits.join(" and ")} listings only)`);
  return parts.join(" ");
}

function Chips({
  options,
  selected,
  onToggle,
  disabled,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-stone-2 bg-stone-4/40 p-3">
      {options.length === 0 && <p className="text-xs text-ink-soft/60">Nothing matches.</p>}
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button key={o} type="button" disabled={disabled} onClick={() => onToggle(o)} aria-pressed={on} className={choice(on)}>
            {on && "✓ "}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminPromotionsPage() {
  const { expired } = useAdmin();
  const [promotions, setPromotions] = useState<Promotion[] | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // New promotion
  const today = dayOf(new Date());
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<"pro" | "featured">("pro");
  const [startNow, setStartNow] = useState(true);
  const [startDay, setStartDay] = useState(today);
  const [endDay, setEndDay] = useState(`${today.slice(0, 4)}-12-31`);
  const [mode, setMode] = useState<Mode>("all");
  const [pickedCategories, setPickedCategories] = useState<string[]>([]);
  const [pickedCities, setPickedCities] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [picked, setPicked] = useState<Vendor[]>([]);
  const [vendorQuery, setVendorQuery] = useState("");
  const [vendorResults, setVendorResults] = useState<Vendor[]>([]);
  const [publishedOnly, setPublishedOnly] = useState(false);
  const [claimedOnly, setClaimedOnly] = useState(false);
  const [note, setNote] = useState("");
  const [reach, setReach] = useState<number | null>(null);
  const [reachFailed, setReachFailed] = useState(false);
  const [searchFailed, setSearchFailed] = useState(false);

  // Changing a promotion's last day
  const [editing, setEditing] = useState<string | null>(null);
  const [editDay, setEditDay] = useState("");

  const audience = useMemo(
    () => ({
      mode,
      categories: pickedCategories,
      cities: pickedCities,
      org_ids: picked.map((v) => v.org_id),
      published_only: publishedOnly,
      claimed_only: claimedOnly,
    }),
    [mode, pickedCategories, pickedCities, picked, publishedOnly, claimedOnly],
  );

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/promotions");
      // A 401 means the admin session ran out: the shell shows sign-in again.
      if (res.status === 401) return expired();
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't load promotions.");
        return;
      }
      setPromotions(body.promotions);
      setCategories(body.categories);
      setCities(body.cities);
    } catch {
      setError("Couldn't load promotions.");
    }
  }, [expired]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live count of who the draft would reach. A failure says so rather than
  // leaving "Counting vendors…" up for good.
  const audienceIncomplete =
    (mode === "groups" && !pickedCategories.length && !pickedCities.length) || (mode === "picked" && !picked.length);
  useEffect(() => {
    setReach(null);
    setReachFailed(false);
    if (audienceIncomplete) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "preview", audience }),
        });
        if (res.status === 401) return expired();
        const body = await res.json().catch(() => ({}));
        if (res.ok && typeof body.reach === "number") setReach(body.reach);
        else setReachFailed(true);
      } catch {
        setReachFailed(true);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [audience, audienceIncomplete, expired]);

  // Vendor search for hand-picking.
  useEffect(() => {
    const q = vendorQuery.trim();
    setSearchFailed(false);
    if (q.length < 2) {
      setVendorResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/promotions?vendors=${encodeURIComponent(q)}`);
        if (res.status === 401) return expired();
        const body = await res.json().catch(() => ({}));
        if (res.ok && Array.isArray(body.vendors)) setVendorResults(body.vendors);
        else setSearchFailed(true);
      } catch {
        setSearchFailed(true);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [vendorQuery, expired]);

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/promotions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        expired();
        return false;
      }
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "That didn't work.");
        return false;
      }
      await load();
      return true;
    } catch {
      setError("That didn't work.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const who = reach === null ? "the selected vendors" : `${reach} vendor${reach === 1 ? "" : "s"}`;
    if (!window.confirm(`Give ${who} ${TIERS[plan].name} free through ${fmtDay(endDay)}?`)) return;
    const ok = await post({
      action: "create",
      name,
      plan,
      start: startNow ? "now" : startDay,
      end: endDay,
      audience,
      note,
    });
    if (ok) {
      setNotice(`"${name.trim()}" is set up.`);
      setName("");
      setNote("");
      setPicked([]);
      setPickedCategories([]);
      setPickedCities([]);
      setVendorQuery("");
    }
  }

  async function end(p: Promotion) {
    if (!window.confirm(`End "${p.name}" now? Vendors who only had ${TIERS[p.plan].name} through it go back to their own plan.`)) return;
    if (await post({ action: "end", id: p.id })) setNotice(`"${p.name}" has ended.`);
  }

  async function saveEnd(p: Promotion) {
    if (await post({ action: "extend", id: p.id, end: editDay })) {
      setNotice(`"${p.name}" now runs through ${fmtDay(editDay)}.`);
      setEditing(null);
    }
  }

  const toggle = (set: React.Dispatch<React.SetStateAction<string[]>>) => (v: string) =>
    set((list) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]));
  const shownCities = cities.filter((c) => c.toLowerCase().includes(cityFilter.trim().toLowerCase()));

  const count = (s: Promotion["status"]) => (promotions ?? []).filter((p) => p.status === s).length;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Vendors"
        title="Promotions"
        subtitle="Give vendors a paid plan free for a set time. They get its features right away, including vendors who join while it runs, and go back to their own plan when it ends. Nobody is charged."
        actions={
          <>
            <a href="#all-promotions" className={btn.secondary}>
              All promotions
            </a>
            <a href="#new-promotion" className={btn.primary}>
              <Icon name="plus" className="size-4" />
              New promotion
            </a>
          </>
        }
      />

      {error && <Notice tone="error">{error}</Notice>}
      {notice && <Notice tone="success">{notice}</Notice>}

      {promotions && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          <Kpi label="Running" value={String(count("running"))} sub="Vendors on a free plan now" icon="tag" />
          <Kpi label="Scheduled" value={String(count("scheduled"))} sub="Starting on a later day" icon="send" />
          <Kpi label="Ended" value={String(count("ended"))} sub="Finished or ended early" icon="check" className="col-span-2 lg:col-span-1" />
        </div>
      )}

      <Card>
        <form id="new-promotion" onSubmit={create} className="scroll-mt-24 space-y-6">
          <div>
            <h2 className="font-display text-xl font-medium text-ink">New promotion</h2>
            <p className="mt-1 text-sm text-ink-soft/70">Pick a plan, the dates, and who gets it.</p>
          </div>

          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              required
              placeholder="Holiday 2026: Pro for everyone"
              className={field}
            />
          </Field>

          <fieldset>
            <legend className={label}>Plan to give</legend>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {(["pro", "featured"] as const).map((p) => (
                <label
                  key={p}
                  className={`cursor-pointer rounded-2xl border p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand ${
                    plan === p ? "border-brand bg-brand-wash" : "border-stone-2 bg-white hover:border-brand/50"
                  }`}
                >
                  <input type="radio" name="plan" className="sr-only" checked={plan === p} onChange={() => setPlan(p)} />
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-base font-medium text-ink">{TIERS[p].name}</span>
                    <span className="text-xs text-ink-soft/60">normally ${TIERS[p].priceMonthly}/mo</span>
                  </span>
                  <span className="mt-1 block text-xs text-ink-soft/70">
                    {p === "pro"
                      ? "Unlimited gallery, Inspiration page, inquiries and stats."
                      : "Everything in Pro, plus top placement and a badge."}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className={label}>Starts</span>
              <div className="mt-1 flex min-h-[2.75rem] flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
                  <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} className={checkbox} />
                  Right away
                </label>
                {!startNow && (
                  <input
                    type="date"
                    aria-label="Start day"
                    value={startDay}
                    min={today}
                    onChange={(e) => setStartDay(e.target.value)}
                    required
                    className={`${field} min-w-0 flex-1`}
                  />
                )}
              </div>
            </div>
            <div>
              <Field label="Last day">
                <input type="date" value={endDay} min={today} onChange={(e) => setEndDay(e.target.value)} required className={field} />
              </Field>
              <span className="mt-1 block text-xs text-ink-soft/60">Runs through the end of this day, Florida time.</span>
            </div>
          </div>

          <fieldset className="space-y-4 rounded-2xl border border-stone-2 p-4">
            <legend className={`${label} px-1`}>Who gets it</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All vendors"],
                  ["groups", "By category or city"],
                  ["picked", "Hand-picked vendors"],
                ] as const
              ).map(([m, text]) => (
                <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={`${choice(mode === m)} px-4 py-2 text-sm`}>
                  {text}
                </button>
              ))}
            </div>

            {mode === "groups" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-ink">Categories</p>
                  <p className="text-xs text-ink-soft/60">Leave empty for every category.</p>
                  <div className="mt-2">
                    <Chips options={categories} selected={pickedCategories} onToggle={toggle(setPickedCategories)} />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">Cities</p>
                  <p className="text-xs text-ink-soft/60">Leave empty for every city. Vendors must match both lists.</p>
                  <div className="mt-2">
                    <SearchBox value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} aria-label="Filter cities" placeholder="Filter cities…" />
                  </div>
                  <div className="mt-2">
                    <Chips options={shownCities} selected={pickedCities} onToggle={toggle(setPickedCities)} />
                  </div>
                </div>
              </div>
            )}

            {mode === "picked" && (
              <div className="space-y-3">
                <SearchBox
                  value={vendorQuery}
                  onChange={(e) => setVendorQuery(e.target.value)}
                  aria-label="Search vendors"
                  placeholder="Search vendors by name…"
                />
                {searchFailed && <p role="alert" className="text-xs text-red-700">The search didn&rsquo;t work. Type again to retry.</p>}
                {vendorResults.length > 0 && (
                  <ul className="divide-y divide-stone-2/70 overflow-hidden rounded-2xl border border-stone-2">
                    {vendorResults.map((v) => {
                      const added = picked.some((p) => p.org_id === v.org_id);
                      return (
                        <li key={v.org_id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-stone-4/70">
                          <span className="min-w-0">
                            <span className="font-medium text-ink">{v.business_name}</span>
                            <span className="ml-2 text-xs text-ink-soft/60">
                              {[v.category, v.city, v.status === "published" ? null : "draft"].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <button type="button" disabled={added} onClick={() => setPicked((l) => [...l, v])} className={`${btn.small} shrink-0`}>
                            {added ? "Added" : "+ Add"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {picked.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {picked.map((v) => (
                      <span
                        key={v.org_id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-wash py-1 pl-3 pr-1.5 text-xs text-ink"
                      >
                        {v.business_name}
                        <button
                          type="button"
                          aria-label={`Remove ${v.business_name}`}
                          onClick={() => setPicked((l) => l.filter((p) => p.org_id !== v.org_id))}
                          className="rounded-full p-0.5 text-ink-soft/60 hover:text-red-700"
                        >
                          <Icon name="close" className="size-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={publishedOnly} onChange={(e) => setPublishedOnly(e.target.checked)} className={checkbox} />
                Only published listings
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={claimedOnly} onChange={(e) => setClaimedOnly(e.target.checked)} className={checkbox} />
                Only claimed listings
              </label>
            </div>
            <div className="rounded-xl bg-brand-wash px-4 py-3 text-sm text-ink" role="status">
              {audienceIncomplete ? (
                <span className="text-ink-soft/70">Pick who gets it to see how many vendors that is.</span>
              ) : reachFailed ? (
                <span className="text-red-700">Couldn&rsquo;t count vendors just now. Change the selection to try again.</span>
              ) : reach === null ? (
                <span className="text-ink-soft/70">Counting vendors…</span>
              ) : (
                <>
                  Reaches <strong>{reach}</strong> vendor{reach === 1 ? "" : "s"} today.
                  {mode !== "picked" && <span className="text-ink-soft/70"> Vendors who join later and match are included too.</span>}
                </>
              )}
            </div>
          </fieldset>

          <Field label="Note" hint="(only admins see this)">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className={field} />
          </Field>

          <div className="flex justify-end border-t border-stone-2 pt-5">
            <button type="submit" disabled={busy} className={btn.primary}>
              {busy ? "Saving…" : "Start promotion"}
            </button>
          </div>
        </form>
      </Card>

      <Card className="space-y-5">
        <div id="all-promotions" className="scroll-mt-24">
          <CardTitle count={promotions?.length}>All promotions</CardTitle>
        </div>
        {promotions === null && !error && <Empty>Loading…</Empty>}
        {promotions?.length === 0 && <Empty>No promotions yet.</Empty>}
        {promotions && promotions.length > 0 && (
          <div className={table.wrap}>
            <table className={table.table}>
              <thead>
                <tr className={table.headRow}>
                  <th className={table.th}>Promotion</th>
                  <th className={table.th}>Dates</th>
                  <th className={table.th}>Who gets it</th>
                  <th className={`${table.th} text-right`}>Action</th>
                </tr>
              </thead>
              <tbody className={table.body}>
                {promotions.map((p) => (
                  <Fragment key={p.id}>
                    <tr className={`${table.row} ${p.status === "ended" ? "bg-stone-4/30" : ""}`}>
                      <td className={table.td}>
                        <p className="font-medium text-ink">{p.name}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          <Badge tone={STATUS_TONE[p.status]} dot>
                            {STATUS_LABEL[p.status]}
                          </Badge>
                          <Badge tone={p.plan === "featured" ? "brandSolid" : "brand"}>{TIERS[p.plan].name}</Badge>
                        </div>
                        {p.note && <p className="mt-1.5 text-xs italic text-ink-soft/60">{p.note}</p>}
                        {p.created_by && <p className="mt-1 text-xs text-ink-soft/50">Set up by {p.created_by}</p>}
                      </td>
                      <td className={`${table.td} whitespace-nowrap text-ink-soft/85`}>
                        {fmtDay(dayOf(p.starts_at))} – {fmtDay(lastDayOf(p.ends_at))}
                        {p.ended_at && (
                          <p className="mt-1 whitespace-normal text-xs text-ink-soft/60">
                            Ended early on {fmtDay(dayOf(p.ended_at))}
                            {p.ended_by && ` by ${p.ended_by}`}
                          </p>
                        )}
                      </td>
                      <td className={`${table.td} text-ink-soft/85`}>
                        {audienceSummary(p)}
                        <p className="mt-1 text-xs text-ink-soft/60">
                          <strong className="font-semibold text-ink">{p.reach}</strong> vendor{p.reach === 1 ? "" : "s"}
                          {p.status === "ended" && " match today"}
                        </p>
                      </td>
                      <td className={`${table.td} text-right`}>
                        {p.status !== "ended" && (
                          <div className="flex flex-wrap justify-end gap-1">
                            <button
                              type="button"
                              disabled={busy}
                              aria-expanded={editing === p.id}
                              onClick={() => {
                                setEditing(editing === p.id ? null : p.id);
                                setEditDay(lastDayOf(p.ends_at));
                              }}
                              className={btn.small}
                            >
                              Change last day
                            </button>
                            <button type="button" disabled={busy} onClick={() => end(p)} className={btn.dangerQuiet}>
                              End now
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                    {editing === p.id && (
                      <tr className="bg-stone-4/50">
                        <td colSpan={4} className="px-4 py-4">
                          <div className="flex flex-wrap items-end gap-3">
                            <Field label="New last day" className="w-48">
                              <input type="date" value={editDay} min={today} onChange={(e) => setEditDay(e.target.value)} className={field} />
                            </Field>
                            <button type="button" disabled={busy} onClick={() => saveEnd(p)} className={btn.primary}>
                              Save
                            </button>
                            <button type="button" onClick={() => setEditing(null)} className={btn.quiet}>
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

