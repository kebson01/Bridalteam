"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Venue } from "@/lib/supabase";

function locationOf(v: Partial<Venue>) {
  return [v.city, v.state].filter(Boolean).join(", ");
}

/**
 * Client-side search and category filtering for the vendor directory.
 *
 * Categories are derived from the rows themselves rather than a hardcoded list,
 * so a chip can never reference a category that no listing actually uses.
 */
export default function VendorDirectory({ venues }: { venues: Partial<Venue>[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const v of venues) if (v.category) seen.add(v.category);
    return [...seen].sort();
  }, [venues]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return venues.filter((v) => {
      if (category && v.category !== category) return false;
      if (!q) return true;
      return [v.name, v.category, v.city, v.state, v.tag, v.description]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [venues, query, category]);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-2 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vendors, e.g. 'rustic barn venue in Texas'"
          aria-label="Search vendors"
          className="flex-1 rounded-full border border-stone-2 px-5 py-3 text-sm text-ink outline-none focus:border-brand"
        />
        <Link
          href="/planner"
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-center text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Match me with AI
        </Link>
      </div>

      {categories.length > 0 && (
        <ul className="mt-8 flex flex-wrap gap-2">
          <li>
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={category === null}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                category === null
                  ? "border-brand bg-brand text-white"
                  : "border-stone-2 bg-white text-ink-soft hover:border-brand hover:text-brand-text"
              }`}
            >
              All
            </button>
          </li>
          {categories.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => setCategory(c === category ? null : c)}
                aria-pressed={c === category}
                className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                  c === category
                    ? "border-brand bg-brand text-white"
                    : "border-stone-2 bg-white text-ink-soft hover:border-brand hover:text-brand-text"
                }`}
              >
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm text-ink-soft/60">
        {filtered.length === venues.length
          ? `${venues.length} ${venues.length === 1 ? "vendor" : "vendors"}`
          : `${filtered.length} of ${venues.length} vendors`}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-12 text-center">
          <p className="text-ink">No vendors match that search.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory(null);
            }}
            className="mt-3 text-sm font-semibold text-brand-text hover:text-brand-deep"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v, i) => (
            <article
              key={v.id ?? `${v.name}-${i}`}
              className="overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand/15 via-stone-4 to-brand-dark/10">
                {v.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.image_url} alt={v.name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text">
                    {v.category ?? "Venue"}
                  </span>
                )}
                {v.featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-medium text-ink">{v.name}</h3>
                  {v.price && (
                    <span className="text-sm font-semibold text-brand-text">{v.price}</span>
                  )}
                </div>
                {locationOf(v) && (
                  <p className="mt-1 text-sm text-ink-soft/70">{locationOf(v)}</p>
                )}
                {v.tag && <p className="mt-3 text-sm text-ink-soft/80">{v.tag}</p>}
                <Link
                  href="/planner"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text hover:text-brand-deep"
                >
                  Ask AI about this venue <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
