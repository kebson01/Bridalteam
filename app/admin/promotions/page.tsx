"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { dayOf, lastDayOf } from "@/lib/promotions";
import { TIERS } from "@/lib/tiers";

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

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";
const label = "text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft";

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
    <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto rounded-lg border border-stone-2 p-3">
      {options.length === 0 && <p className="text-xs text-ink-soft/60">Nothing matches.</p>}
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            disabled={disabled}
            onClick={() => onToggle(o)}
            aria-pressed={on}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              on ? "border-brand bg-brand-wash font-semibold text-ink" : "border-stone-2 text-ink-soft hover:border-brand"
            }`}
          >
            {on && "✓ "}
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function AdminPromotionsPage() {
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
      const body = await res.json();
      if (!res.ok) {
        setError(res.status === 401 ? "Sign in on the admin dashboard first." : (body.error ?? "Couldn't load promotions."));
        return;
      }
      setPromotions(body.promotions);
      setCategories(body.categories);
      setCities(body.cities);
    } catch {
      setError("Couldn't load promotions.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Live count of who the draft would reach.
  useEffect(() => {
    setReach(null);
    const incomplete =
      (mode === "groups" && !pickedCategories.length && !pickedCities.length) || (mode === "picked" && !picked.length);
    if (incomplete) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/admin/promotions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "preview", audience }),
        });
        if (res.ok) setReach((await res.json()).reach);
      } catch {
        // The count is a convenience.
      }
    }, 300);
    return () => clearTimeout(t);
  }, [audience, mode, pickedCategories.length, pickedCities.length, picked.length]);

  // Vendor search for hand-picking.
  useEffect(() => {
    const q = vendorQuery.trim();
    if (q.length < 2) {
      setVendorResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/promotions?vendors=${encodeURIComponent(q)}`);
        if (res.ok) setVendorResults((await res.json()).vendors);
      } catch {
        // Ignore; they can type again.
      }
    }, 250);
    return () => clearTimeout(t);
  }, [vendorQuery]);

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

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-medium text-ink">Promotions</h1>
        <Link href="/admin" className="text-sm text-ink-soft hover:text-brand-text">
          ← Admin
        </Link>
      </div>
      <p className="mt-1 text-sm text-ink-soft/70">
        Give vendors a paid plan free for a set time. They get its features right away, including vendors who join
        while it runs, and go back to their own plan when it ends. Nobody is charged.
      </p>

      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

      <form onSubmit={create} className="mt-6 space-y-6 rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <h2 className="text-lg font-medium text-ink">New promotion</h2>

        <label className="block">
          <span className={label}>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
            placeholder="Holiday 2026: Pro for everyone"
            className={`${field} mt-2`}
          />
        </label>

        <fieldset>
          <legend className={label}>Plan to give</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {(["pro", "featured"] as const).map((p) => (
              <label
                key={p}
                className={`cursor-pointer rounded-xl border p-4 ${plan === p ? "border-brand bg-brand-wash" : "border-stone-2"}`}
              >
                <input type="radio" name="plan" className="sr-only" checked={plan === p} onChange={() => setPlan(p)} />
                <span className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold text-ink">{TIERS[p].name}</span>
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
            <div className="mt-2 flex items-center gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
                <input type="checkbox" checked={startNow} onChange={(e) => setStartNow(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
                Right away
              </label>
              {!startNow && (
                <input type="date" value={startDay} min={today} onChange={(e) => setStartDay(e.target.value)} required className={field} />
              )}
            </div>
          </div>
          <label className="block">
            <span className={label}>Last day</span>
            <input type="date" value={endDay} min={today} onChange={(e) => setEndDay(e.target.value)} required className={`${field} mt-2`} />
            <span className="mt-1 block text-xs text-ink-soft/60">Runs through the end of this day, Florida time.</span>
          </label>
        </div>

        <fieldset>
          <legend className={label}>Who gets it</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["all", "All vendors"],
                ["groups", "By category or city"],
                ["picked", "Hand-picked vendors"],
              ] as const
            ).map(([m, text]) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={`rounded-full border px-4 py-2 text-sm ${
                  mode === m ? "border-brand bg-brand-wash font-semibold text-ink" : "border-stone-2 text-ink-soft hover:border-brand"
                }`}
              >
                {text}
              </button>
            ))}
          </div>

          {mode === "groups" && (
            <div className="mt-4 space-y-4">
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
                <input
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  placeholder="Filter cities…"
                  className={`${field} mt-2`}
                />
                <div className="mt-2">
                  <Chips options={shownCities} selected={pickedCities} onToggle={toggle(setPickedCities)} />
                </div>
              </div>
            </div>
          )}

          {mode === "picked" && (
            <div className="mt-4">
              <input
                value={vendorQuery}
                onChange={(e) => setVendorQuery(e.target.value)}
                placeholder="Search vendors by name…"
                className={field}
              />
              {vendorResults.length > 0 && (
                <ul className="mt-2 divide-y divide-stone-2 rounded-lg border border-stone-2">
                  {vendorResults.map((v) => {
                    const added = picked.some((p) => p.org_id === v.org_id);
                    return (
                      <li key={v.org_id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <span className="min-w-0">
                          <span className="font-medium text-ink">{v.business_name}</span>
                          <span className="ml-2 text-xs text-ink-soft/60">
                            {[v.category, v.city, v.status === "published" ? null : "draft"].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                        <button
                          type="button"
                          disabled={added}
                          onClick={() => setPicked((l) => [...l, v])}
                          className="shrink-0 text-xs font-semibold text-brand-text disabled:text-ink-soft/40"
                        >
                          {added ? "Added" : "+ Add"}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
              {picked.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {picked.map((v) => (
                    <span key={v.org_id} className="inline-flex items-center gap-1.5 rounded-full bg-brand-wash px-3 py-1 text-xs text-ink">
                      {v.business_name}
                      <button
                        type="button"
                        aria-label={`Remove ${v.business_name}`}
                        onClick={() => setPicked((l) => l.filter((p) => p.org_id !== v.org_id))}
                        className="text-ink-soft/60 hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={publishedOnly} onChange={(e) => setPublishedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
              Only published listings
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-ink-soft">
              <input type="checkbox" checked={claimedOnly} onChange={(e) => setClaimedOnly(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand)]" />
              Only claimed listings
            </label>
          </div>
          <p className="mt-3 text-sm text-ink">
            {reach === null ? (
              <span className="text-ink-soft/60">Counting vendors…</span>
            ) : (
              <>
                Reaches <strong>{reach}</strong> vendor{reach === 1 ? "" : "s"} today.
                {mode !== "picked" && <span className="text-ink-soft/60"> Vendors who join later and match are included too.</span>}
              </>
            )}
          </p>
        </fieldset>

        <label className="block">
          <span className={label}>Note (only admins see this)</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={2} className={`${field} mt-2`} />
        </label>

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {busy ? "Saving…" : "Start promotion"}
        </button>
      </form>

      <h2 className="mt-10 text-lg font-medium text-ink">All promotions</h2>
      {promotions === null && !error && <p className="mt-3 text-sm text-ink-soft/60">Loading…</p>}
      {promotions?.length === 0 && <p className="mt-3 text-sm text-ink-soft/60">No promotions yet.</p>}
      <ul className="mt-4 space-y-3">
        {promotions?.map((p) => (
          <li key={p.id} className="rounded-2xl border border-stone-2 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-ink">
                  {p.name}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                      p.status === "running"
                        ? "bg-green-50 text-green-800"
                        : p.status === "scheduled"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-stone-4 text-ink-soft/60"
                    }`}
                  >
                    {p.status}
                  </span>
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold uppercase text-white">
                    {TIERS[p.plan].name}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-soft/70">
                  {fmtDay(dayOf(p.starts_at))} – {fmtDay(lastDayOf(p.ends_at))}
                  {p.ended_at && <> · ended early on {fmtDay(dayOf(p.ended_at))}{p.ended_by && ` by ${p.ended_by}`}</>}
                </p>
                <p className="mt-1 text-sm text-ink-soft">
                  {audienceSummary(p)} · <strong>{p.reach}</strong> vendor{p.reach === 1 ? "" : "s"}
                  {p.status === "ended" && " match today"}
                </p>
                {p.note && <p className="mt-1 text-xs italic text-ink-soft/60">{p.note}</p>}
                {p.created_by && <p className="mt-1 text-xs text-ink-soft/50">Set up by {p.created_by}</p>}
              </div>
              {p.status !== "ended" && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEditing(editing === p.id ? null : p.id);
                      setEditDay(lastDayOf(p.ends_at));
                    }}
                    className="rounded-full border border-stone-2 px-4 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand"
                  >
                    Change last day
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => end(p)}
                    className="rounded-full border border-red-200 px-4 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    End now
                  </button>
                </div>
              )}
            </div>
            {editing === p.id && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-stone-2 pt-4">
                <input type="date" value={editDay} min={today} onChange={(e) => setEditDay(e.target.value)} className={`${field} max-w-[12rem]`} />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => saveEnd(p)}
                  className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-xs font-semibold text-white"
                >
                  Save
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
