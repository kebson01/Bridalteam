"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { LAUNCH_CITY } from "@/lib/site";
import { sortCategories } from "@/lib/categories";
import {
  AREAS,
  type AreaId,
  METROS,
  type MetroId,
  areasPresent,
  isRegionWide,
  matchesArea,
  matchesMetro,
  metrosPresent,
  regionScope,
} from "@/lib/areas";

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
  /** 1-4 ($ to $$$$), from the vendor's profile. */
  price_tier?: number | null;
  /** Lowest package starting price in USD. */
  packages_from?: number | null;
  /** The vendor's first highlight, e.g. "Bilingual". */
  highlight?: string | null;
  rating?: { average: number; count: number } | null;
}

/** Cards shown before "Load more", and how many each click adds. */
export const DIRECTORY_PAGE = 24;
/** Featured vendors shown as large spotlight cards above the list. */
const SPOTLIGHT_MAX = 3;

const TIER_LABEL: Record<number, string> = { 1: "$", 2: "$$", 3: "$$$", 4: "$$$$" };

function where(v: DirectoryVendor) {
  return isRegionWide(v.city)
    ? `Serves all of ${METROS.find((m) => m.id === regionScope(v.city))?.label ?? "Florida"}`
    : [v.city, v.region].filter(Boolean).join(", ");
}

function initials(name: string) {
  return name.replace(/[^A-Za-z0-9 ]/g, " ").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

function Star({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={`${className} text-brand`} aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5z" />
    </svg>
  );
}

function money(n: number) {
  return `$${n.toLocaleString("en-US")}`;
}

export default function VendorDirectoryList({
  vendors,
  initialCategory = null,
}: {
  vendors: DirectoryVendor[];
  /** From /vendors?type=..., e.g. the homepage's type chips. Ignored unless some listing has it. */
  initialCategory?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(() =>
    initialCategory && vendors.some((v) => v.category === initialCategory) ? initialCategory : null,
  );
  const [metro, setMetro] = useState<MetroId | null>(null);
  const [area, setArea] = useState<AreaId | null>(null);
  const [limit, setLimit] = useState(DIRECTORY_PAGE);


  const categories = useMemo(() => sortCategories(vendors.map((v) => v.category)), [vendors]);

  // Only offer a metro or area that something is actually in, so a filter can
  // never lead to an empty page.
  const cities = useMemo(() => vendors.map((v) => v.city), [vendors]);
  const metroIds = useMemo(() => metrosPresent(cities), [cities]);
  const metroChips = useMemo(() => METROS.filter((m) => metroIds.includes(m.id)), [metroIds]);

  // The area row belongs to the selected metro. Only South Florida has areas
  // defined, so the row simply does not render for the others -- better than a
  // row containing one chip that filters nothing.
  const areaIds = useMemo(() => (metro ? areasPresent(cities, metro) : []), [cities, metro]);
  const areaChips = useMemo(() => AREAS.filter((a) => areaIds.includes(a.id)), [areaIds]);

  // Switching metro must drop the area, or a Broward filter survives into
  // Orlando and silently returns nothing. Unlike the chips this replaced, a
  // select cannot toggle: re-choosing the current metro fires no change event,
  // and clearing is what the "Anywhere" option is for.
  const selectMetro = (id: MetroId | null) => {
    setMetro(id);
    setArea(null);
  };

  /**
   * Everything except the location filters. The metro dropdown counts with it
   * too, so a count can never disagree with the list it is counting -- which is
   * the whole risk of putting a number next to a filter.
   */
  const matchesSearch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (v: DirectoryVendor) => {
      if (category && v.category !== category) return false;
      if (!q) return true;
      return [v.business_name, v.category, v.city, v.region, v.description]
        .filter(Boolean)
        .some((f) => String(f).toLowerCase().includes(q));
    };
  }, [query, category]);

  /** How many listings each type would show, given location and search. */
  const categoryCounts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const counts = new Map<string, number>();
    let all = 0;
    for (const v of vendors) {
      if (metro && !matchesMetro(v.city, metro)) continue;
      if (area && !matchesArea(v.city, area)) continue;
      if (q && ![v.business_name, v.category, v.city, v.region, v.description].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))) continue;
      all++;
      if (v.category) counts.set(v.category, (counts.get(v.category) ?? 0) + 1);
    }
    return { all, counts };
  }, [vendors, query, metro, area]);

  const filtered = useMemo(
    () =>
      vendors.filter((v) => {
        if (!matchesSearch(v)) return false;
        if (metro && !matchesMetro(v.city, metro)) return false;
        if (area && !matchesArea(v.city, area)) return false;
        return true;
      }),
    [vendors, matchesSearch, metro, area],
  );

  /**
   * How many listings each metro would show if picked, given the type and text
   * already chosen. Coverage is very uneven -- hundreds in South Florida
   * against a few dozen on the Space Coast -- so saying so up front beats
   * letting a couple pick a metro and find it nearly empty.
   */
  const metroCounts = useMemo(() => {
    const base = vendors.filter(matchesSearch);
    const counts = new Map<MetroId | "any", number>([["any", base.length]]);
    for (const m of METROS) {
      counts.set(m.id, base.filter((v) => matchesMetro(v.city, m.id)).length);
    }
    return counts;
  }, [vendors, matchesSearch]);

  const spotlight = filtered.filter((v) => v.featured).slice(0, SPOTLIGHT_MAX);
  const spotIds = new Set(spotlight.map((v) => v.org_id));
  const rest = filtered.filter((v) => !spotIds.has(v.org_id));
  const visible = rest.slice(0, limit);
  const anyFilter = Boolean(query || category || metro || area);

  // A new filter starts the list from the top again.
  useEffect(() => setLimit(DIRECTORY_PAGE), [query, category, metro, area]);

  return (
    <>
      {/* AI matchmaker */}
      <Link
        href="/planner"
        className="group flex flex-col gap-3 rounded-3xl border border-brand/20 bg-brand-wash p-5 transition-colors hover:border-brand/50 sm:flex-row sm:items-center sm:justify-between"
      >
        <span>
          <span className="flex items-center gap-2 text-sm font-semibold text-brand-text">
            <span aria-hidden>✦</span> Not sure who to book first?
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
            Tell the AI planner your style, guest count and venue, and it will suggest which vendors to book and when.
          </span>
        </span>
        <span className="inline-flex shrink-0 items-center justify-center gap-1.5 self-start rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white sm:self-auto">
          ✦ Match me with AI
        </span>
      </Link>

      {/* Search, type and location */}
      <div className="mt-5 flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="flex flex-1 items-center gap-3 rounded-full border border-stone-2 bg-white px-4 shadow-sm focus-within:border-brand">
          <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-stone-3">
            <circle cx="9" cy="9" r="6" />
            <path d="m17 17-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search vendor name, style or specialty, e.g. 'photographer in ${LAUNCH_CITY}'`}
            aria-label="Search vendors"
            className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-stone-3"
          />
        </label>

        {/*
          A select rather than a row of chips. With three metros the chips fit;
          with seven they overflowed, and every chip added narrowed the search
          field. Styled as a pill so it reads as one more filter. Native, so
          keyboard and screen-reader behaviour and the mobile picker come free.
        */}
        <div className="grid grid-cols-2 gap-2 lg:flex lg:shrink-0">
        {/*
          Vendor type is a select too. With 30-odd types, from Venue to
          Cigar roller, a chip row became a long sideways scroll that hid most
          of them. Each option carries how many listings it would show, given
          the location and search already chosen.
        */}
        {categories.length > 0 && (
          <div className={`relative ${metroChips.length > 0 ? "" : "col-span-2"}`}>
            <select
              aria-label="Vendor type"
              value={category ?? ""}
              onChange={(e) => setCategory(e.target.value || null)}
              className={`w-full cursor-pointer appearance-none truncate rounded-full border py-3 pl-4 pr-10 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand lg:w-56 ${
                category ? "border-ink bg-ink text-white" : "border-stone-2 bg-white text-ink"
              }`}
            >
              <option value="">All types ({categoryCounts.all})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c} ({categoryCounts.counts.get(c) ?? 0})
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${category ? "text-white" : "text-stone-3"}`}
            >
              <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {metroChips.length > 0 && (
          <div className={`relative ${categories.length > 0 ? "" : "col-span-2"}`}>
            <select
              aria-label="Metro"
              value={metro ?? ""}
              onChange={(e) => selectMetro((e.target.value || null) as MetroId | null)}
              className={`w-full cursor-pointer appearance-none rounded-full border py-3 pl-4 pr-10 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-brand lg:w-52 ${
                metro ? "border-ink bg-ink text-white" : "border-stone-2 bg-white text-ink"
              }`}
            >
              <option value="">Anywhere ({metroCounts.get("any") ?? 0})</option>
              {metroChips.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({metroCounts.get(m.id) ?? 0})
                </option>
              ))}
            </select>
            <svg
              aria-hidden
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className={`pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 ${metro ? "text-white" : "text-stone-3"}`}
            >
              <path d="m6 8 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        </div>
      </div>

      {areaChips.length > 0 && (
        <div role="group" aria-label="Area" className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink-soft/50">Narrow to</span>
          {[{ id: null as AreaId | null, label: "All areas" }, ...areaChips].map((a) => (
            <button
              key={a.id ?? "all"}
              type="button"
              onClick={() => setArea(a.id === area ? null : a.id)}
              aria-pressed={a.id === area}
              className={`whitespace-nowrap rounded-full border px-3 py-1 text-[13px] transition-colors ${
                a.id === area
                  ? "border-ink bg-ink text-white"
                  : "border-stone-2 bg-white text-ink-soft/80 hover:border-brand hover:text-brand-text"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}

      {/* Spotlight: Featured vendors, as large cards */}
      {spotlight.length > 0 && (
        <section className="mt-10" aria-labelledby="spotlight-heading">
          <div className="flex items-end justify-between gap-3">
            <h2 id="spotlight-heading" className="flex items-center gap-2.5 text-2xl font-medium text-ink">
              <span className="h-6 w-1 rounded-full bg-brand" aria-hidden /> Spotlight
            </h2>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-soft/60">Featured vendors</span>
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {spotlight.map((v) => (
              <article key={v.org_id} className="overflow-hidden rounded-3xl border border-stone-2 bg-white shadow-card">
                <Link href={`/v/${v.org_id}`} className="group relative block aspect-[4/3] overflow-hidden bg-brand-soft">
                  {v.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={v.cover_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-wash via-white to-brand-wash font-display text-5xl font-light tracking-widest text-brand-text/70">
                      {initials(v.business_name)}
                    </span>
                  )}
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
                  <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                    {[v.category ?? "Vendor", v.price_tier ? TIER_LABEL[v.price_tier] : null].filter(Boolean).join(" · ")}
                  </span>
                  <span className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="block text-xs text-white/80">{where(v)}</span>
                    <h3 className="mt-0.5 text-2xl font-medium leading-tight">{v.business_name}</h3>
                  </span>
                </Link>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    {v.rating ? (
                      <span className="inline-flex items-center gap-1 text-ink-soft">
                        <Star /> <b className="text-ink">{v.rating.average.toFixed(1)}</b> ({v.rating.count})
                      </span>
                    ) : (
                      <span className="text-ink-soft/60">New on Bridal Team</span>
                    )}
                    {v.packages_from != null && (
                      <span className="text-ink-soft">
                        From <b className="text-ink">{money(v.packages_from)}</b>
                      </span>
                    )}
                  </div>
                  {v.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft/80">{v.description}</p>}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link href={`/v/${v.org_id}`} className="rounded-full border border-stone-2 py-2.5 text-center text-sm font-semibold text-ink hover:border-brand">
                      View profile
                    </Link>
                    <Link href={`/v/${v.org_id}#contact`} className="rounded-full bg-gradient-to-r from-brand to-brand-dark py-2.5 text-center text-sm font-semibold text-white">
                      Contact
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Everyone else */}
      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium text-ink">{spotlight.length > 0 ? "All Florida wedding pros" : "Florida wedding pros"}</h2>
          <p className="mt-1 text-sm text-ink-soft/60">
            {filtered.length === vendors.length ? `${vendors.length} vendors` : `${filtered.length} of ${vendors.length} vendors`}
            {(metro || area) && filtered.some((v) => isRegionWide(v.city)) && (
              <span> &middot; includes vendors who cover the whole area</span>
            )}
            {anyFilter && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory(null);
                  setMetro(null);
                  setArea(null);
                }}
                className="ml-3 font-medium text-brand-text hover:text-brand-deep"
              >
                Clear filters
              </button>
            )}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-10 text-center text-sm text-ink-soft/70">
          No vendors match that search.
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 md:grid-cols-2">
          {visible.map((v) => {
            const thumb = v.cover_url ?? v.logo_url;
            return (
              <li key={v.org_id}>
                <Link
                  href={`/v/${v.org_id}`}
                  className="flex h-full gap-4 rounded-2xl border border-stone-2 bg-white p-4 shadow-sm transition-colors hover:border-brand/50"
                >
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-wash">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center font-display text-lg tracking-wider text-brand-text/70">
                        {initials(v.business_name)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-text">
                        {v.category ?? "Vendor"}
                      </span>
                      {v.price_tier ? (
                        <span className="text-[11px] font-semibold text-ink-soft/60">{TIER_LABEL[v.price_tier]}</span>
                      ) : null}
                    </span>
                    <h3 className="mt-1 truncate text-lg font-medium leading-snug text-ink">{v.business_name}</h3>
                    {(v.city || v.region) && <span className="block truncate text-xs text-ink-soft/60">{where(v)}</span>}
                    <span className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
                      <span className="inline-flex min-w-0 items-center gap-1 text-ink-soft">
                        {v.rating ? (
                          <>
                            <Star /> <b className="text-ink">{v.rating.average.toFixed(1)}</b>
                            {v.highlight && <span className="truncate">· {v.highlight}</span>}
                          </>
                        ) : (
                          v.highlight && <span className="truncate">{v.highlight}</span>
                        )}
                      </span>
                      {v.packages_from != null && (
                        <span className="font-semibold text-brand-text">From {money(v.packages_from)}</span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {rest.length > visible.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + DIRECTORY_PAGE)}
            className="inline-flex items-center gap-2 rounded-full border border-stone-2 bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm hover:border-brand"
          >
            Load more ({rest.length - visible.length})
          </button>
        </div>
      )}
    </>
  );
}
