"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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

  // The type row scrolls sideways rather than wrapping, so it stays one line
  // however many categories exist. Arrows appear only on the side with more.
  const typeRow = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const updateEdges = () => {
    const el = typeRow.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  };
  useEffect(() => {
    updateEdges();
    window.addEventListener("resize", updateEdges);
    return () => window.removeEventListener("resize", updateEdges);
  }, []);
  const scrollTypes = (dir: 1 | -1) =>
    typeRow.current?.scrollBy({ left: dir * typeRow.current.clientWidth * 0.7, behavior: "smooth" });

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
      <div className="rounded-2xl border border-stone-2 bg-white p-2 shadow-card lg:flex lg:items-center lg:gap-2">
        <label className="flex flex-1 items-center gap-3 px-4">
          <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-stone-3">
            <circle cx="9" cy="9" r="6" />
            <path d="m17 17-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search vendors, e.g. 'photographer in ${LAUNCH_CITY}'`}
            aria-label="Search vendors"
            className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-stone-3"
          />
        </label>

        {areaChips.length > 0 && (
          <div
            role="group"
            aria-label="Area"
            className="flex gap-1 overflow-x-auto rounded-xl bg-stone-4 p-1 [scrollbar-width:none] lg:shrink-0"
          >
            {[{ id: null, label: "Anywhere" }, ...areaChips].map((a) => (
              <button
                key={a.id ?? "any"}
                type="button"
                onClick={() => setArea(a.id === area ? null : a.id)}
                aria-pressed={a.id === area}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-sm transition-colors ${
                  a.id === area
                    ? "bg-white font-medium text-ink shadow-sm"
                    : "text-ink-soft/70 hover:text-ink"
                }`}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <div className="relative mt-5">
          <div
            ref={typeRow}
            onScroll={updateEdges}
            role="group"
            aria-label="Vendor type"
            className="flex gap-2 overflow-x-auto scroll-px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {[null, ...categories].map((c) => (
              <button
                key={c ?? "all"}
                type="button"
                onClick={() => setCategory(c === category ? null : c)}
                aria-pressed={c === category}
                className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[13px] transition-colors ${
                  c === category
                    ? "border-ink bg-ink text-white"
                    : "border-stone-2 bg-white text-ink-soft/80 hover:border-stone-5 hover:text-ink"
                }`}
              >
                {c ?? "All types"}
              </button>
            ))}
          </div>
          {edges.left && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex w-20 items-center justify-start bg-gradient-to-r from-white via-white/90 to-transparent">
              <button
                type="button"
                onClick={() => scrollTypes(-1)}
                aria-label="Scroll vendor types left"
                className="pointer-events-auto hidden h-8 w-8 items-center justify-center rounded-full border border-stone-2 bg-white text-ink-soft shadow-sm hover:text-ink sm:flex"
              >
                <span aria-hidden>‹</span>
              </button>
            </div>
          )}
          {edges.right && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex w-20 items-center justify-end bg-gradient-to-l from-white via-white/90 to-transparent">
              <button
                type="button"
                onClick={() => scrollTypes(1)}
                aria-label="Scroll vendor types right"
                className="pointer-events-auto hidden h-8 w-8 items-center justify-center rounded-full border border-stone-2 bg-white text-ink-soft shadow-sm hover:text-ink sm:flex"
              >
                <span aria-hidden>›</span>
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-stone-2 pt-5">
        <p className="text-sm text-ink-soft/60">
          {filtered.length === vendors.length ? `${vendors.length} vendors` : `${filtered.length} of ${vendors.length} vendors`}
          {area && filtered.some((v) => isRegionWide(v.city)) && (
            <span> &middot; includes vendors who cover all of South Florida</span>
          )}
          {(query || category || area) && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory(null);
                setArea(null);
              }}
              className="ml-3 font-medium text-brand-text hover:text-brand-deep"
            >
              Clear filters
            </button>
          )}
        </p>
        <Link
          href="/planner"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text hover:text-brand-deep"
        >
          <span aria-hidden>✦</span> Not sure who you need? Match me with AI
        </Link>
      </div>

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
