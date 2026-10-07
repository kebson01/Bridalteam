"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LAUNCH_CITY } from "@/lib/site";
import { AREAS, type AreaId, areasPresent, isRegionWide, matchesArea } from "@/lib/areas";

export interface DirectoryVendor {
  org_id: string;
  business_name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  region: string | null;
  logo_url: string | null;
  cover_url: string | null;
  featured?: boolean;
}

export default function VendorDirectoryList({ vendors }: { vendors: DirectoryVendor[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [area, setArea] = useState<AreaId | null>(null);

  const categories = useMemo(() => {
    const seen = new Set<string>();
    for (const v of vendors) if (v.category) seen.add(v.category);
    return [...seen].sort();
  }, [vendors]);

  // Only offer an area that something is actually in, so a filter can never
  // lead to an empty page.
  const areaIds = useMemo(() => areasPresent(vendors.map((v) => v.city)), [vendors]);
  const areaChips = useMemo(() => AREAS.filter((a) => areaIds.includes(a.id)), [areaIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors.filter((v) => {
      if (category && v.category !== category) return false;
      if (area && !matchesArea(v.city, area)) return false;
      if (!q) return true;
      return [v.business_name, v.category, v.city, v.region, v.description]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    });
  }, [vendors, query, category, area]);

  return (
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-2 bg-white p-4 shadow-card sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search vendors, e.g. 'photographer in ${LAUNCH_CITY}'`}
          aria-label="Search vendors"
          className="flex-1 rounded-full border border-stone-2 px-5 py-3 text-sm text-ink outline-none focus:border-brand"
        />
        <Link
          href="/planner"
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-center text-sm font-semibold text-white"
        >
          Match me with AI
        </Link>
      </div>

      {areaChips.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-ink-soft/60">Area</span>
          <button type="button" onClick={() => setArea(null)} aria-pressed={area === null}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${area === null ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
            Anywhere
          </button>
          {areaChips.map((a) => (
            <button key={a.id} type="button" onClick={() => setArea(a.id === area ? null : a.id)} aria-pressed={a.id === area}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${a.id === area ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
              {a.label}
            </button>
          ))}
        </div>
      )}

      {categories.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-sm font-medium text-ink-soft/60">Type</span>
          <button type="button" onClick={() => setCategory(null)} aria-pressed={category === null}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${category === null ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
            All
          </button>
          {categories.map((c) => (
            <button key={c} type="button" onClick={() => setCategory(c === category ? null : c)} aria-pressed={c === category}
              className={`rounded-full border px-4 py-2 text-sm transition-colors ${c === category ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
              {c}
            </button>
          ))}
        </div>
      )}

      <p className="mt-6 text-sm text-ink-soft/60">
        {filtered.length === vendors.length ? `${vendors.length} vendors` : `${filtered.length} of ${vendors.length} vendors`}
        {area && filtered.some((v) => isRegionWide(v.city)) && (
          <span> &middot; includes vendors who cover all of South Florida</span>
        )}
      </p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-10 text-center text-sm text-ink-soft/70">
          No vendors match that search.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((v) => (
            <Link
              key={v.org_id}
              href={`/v/${v.org_id}`}
              className="overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand/15 via-stone-4 to-brand-dark/10">
                {v.cover_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.cover_url} alt={v.business_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-text">
                    {v.category ?? "Vendor"}
                  </span>
                )}
                {v.featured && (
                  <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Featured
                  </span>
                )}
              </div>
              <div className="p-5">
                <h3 className="text-lg font-medium text-ink">{v.business_name}</h3>
                {(v.category || v.city) && (
                  <p className="mt-1 text-sm text-ink-soft/70">
                    {[
                      v.category,
                      isRegionWide(v.city)
                        ? "Serves all of South Florida"
                        : [v.city, v.region].filter(Boolean).join(", "),
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {v.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-ink-soft/80">{v.description}</p>
                )}
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text">
                  View profile <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
