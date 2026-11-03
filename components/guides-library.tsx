"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

/**
 * The /guides index: search, category chips, the curated sections, and a
 * reading list.
 *
 * The reading list lives in this browser only (localStorage). It is a
 * per-visitor convenience like a bookmark, nothing anyone else sees, and the
 * page works the same when storage is blocked.
 */

export interface GuideCard {
  slug: string;
  title: string;
  category: string;
  readMinutes: number;
  excerpt: string;
}

export interface GuideGroups {
  flagship: GuideCard | null;
  foundation: GuideCard[];
  hiring: GuideCard[];
  logistics: GuideCard[];
}

const STORAGE_KEY = "bt:guide-reading-list";

function loadSaved(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const v = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

function storeSaved(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Private mode or blocked storage: the list just won't survive a reload.
  }
}

// ── Icons ────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ReactNode> = {
  checklist: <path d="M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2" />,
  coins: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  venue: <path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-5a2 2 0 0 1 4 0v5" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.5c2.8.2 5 2.5 5 5.5" />
    </>
  ),
  envelope: <path d="M3 6h18v12H3zM3 7l9 7 9-7" />,
  camera: (
    <>
      <path d="M3 8h4l2-3h6l2 3h4v12H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </>
  ),
  flower: (
    <>
      <circle cx="12" cy="9" r="2.5" />
      <path d="M12 6.5c0-2.5 3.5-2.5 3.5 0M12 6.5c0-2.5-3.5-2.5-3.5 0M14.5 9c2.5 0 2.5 3.5 0 3.5M9.5 9c-2.5 0-2.5 3.5 0 3.5M12 11.5V21M12 17c-2-2-4-2-5-1" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V5l11-2v13" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  utensils: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 0-3 2.5-3 6h3v12" />,
  video: <path d="M3 7h12v10H3zM15 10l6-3v10l-6-3" />,
  brush: <path d="M18 3l3 3-9 9-3-3 9-9zM9 12c-3 0-5 2-5 5 0 1.5-1 3-1 3s4 0 6-2c1.5-1.5 2-3 2-4" />,
  cake: <path d="M4 21h16M5 21v-7h14v7M5 17c2 1 3-1 4.7 0s3.3 1 4.6 0S17 16 19 17M12 14v-3M12 8a1.5 1.5 0 0 0 1.5-1.5C13.5 5 12 3 12 3s-1.5 2-1.5 3.5A1.5 1.5 0 0 0 12 8z" />,
  rings: (
    <>
      <circle cx="9" cy="14" r="5" />
      <circle cx="15" cy="14" r="5" />
      <path d="M10 4l2 3 2-3" />
    </>
  ),
  calendar: <path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  gift: <path d="M4 10h16v11H4zM3 7h18v3H3zM12 7v14M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0" />,
  plane: <path d="M2 13l20-8-6 16-4-6-6-1zM12 15l4-6" />,
  book: <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21a2 2 0 0 1 2-2h13" />,
};

const CATEGORY_ICON: Record<string, string> = {
  Planning: "checklist",
  Budget: "coins",
  Venues: "venue",
  Vendors: "people",
  Stationery: "envelope",
};

const SLUG_ICON: [RegExp, string][] = [
  [/photograph/, "camera"],
  [/florist/, "flower"],
  [/dj|band/, "music"],
  [/cater/, "utensils"],
  [/videograph/, "video"],
  [/hair|makeup/, "brush"],
  [/cake/, "cake"],
  [/officiant/, "rings"],
  [/when-to-book/, "calendar"],
  [/timeline|6-months/, "clock"],
  [/registry/, "gift"],
  [/honeymoon/, "plane"],
  [/guest-list/, "people"],
];

function iconFor(g: GuideCard) {
  return SLUG_ICON.find(([re]) => re.test(g.slug))?.[1] ?? CATEGORY_ICON[g.category] ?? "book";
}

function Glyph({ name, className = "h-5 w-5" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      strokeLinejoin="round" className={className} aria-hidden="true">
      {ICONS[name] ?? ICONS.book}
    </svg>
  );
}

function BookmarkButton({ saved, onToggle, title, light = false }: { saved: boolean; onToggle: () => void; title: string; light?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove "${title}" from your reading list` : `Save "${title}" to your reading list`}
      className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
        light ? "bg-white/90 text-ink shadow-sm backdrop-blur hover:bg-white" : "text-ink-soft/60 hover:bg-stone-4 hover:text-brand-text"
      } ${saved ? "text-brand-text" : ""}`}
    >
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={saved ? "currentColor" : "none"} stroke="currentColor"
        strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
    </button>
  );
}

function Meta({ g, className = "" }: { g: GuideCard; className?: string }) {
  return (
    <span className={`text-[11px] font-semibold uppercase tracking-wider ${className}`}>
      <span className="text-brand-text">{g.category}</span>
      <span className="text-ink-soft/50"> · {g.readMinutes} min read</span>
    </span>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────

function SectionHead({ title, sub, aside }: { title: string; sub: string; aside?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-medium text-ink sm:text-3xl">{title}</h2>
        <p className="mt-1 text-sm text-ink-soft/70">{sub}</p>
      </div>
      {aside}
    </div>
  );
}

export function GuidesHeader({ count }: { count: number }) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
        <span className="hidden sm:inline">Plan with confidence · </span>
        {count} practical guides
      </span>
      <h1 className="mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
        Wedding planning <span className="text-brand-text">guides</span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft/80">
        In-depth, practical guides for every part of planning, written to actually help, not to fill a page.
      </p>
    </header>
  );
}

export function PlannerPromo() {
  return (
    <div className="relative overflow-hidden rounded-3xl text-center text-white shadow-card">
      <Image src="/media/guides/reception-table.webp" alt="" fill sizes="(max-width: 1024px) 100vw, 1100px" className="object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand/90 via-brand-dark/85 to-brand-deep/90" />
      <div className="relative px-6 py-10 sm:px-12">
        <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
          </svg>
        </span>
        <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">AI wedding planner</p>
        <h2 className="mx-auto mt-2 max-w-lg text-2xl font-medium leading-snug sm:text-3xl">
          Rather have a plan built for your day?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/90">
          Tell the AI planner your date, guest count and style, and it builds a month-by-month timeline and the order
          to book your vendors.
        </p>
        <Link
          href="/planner"
          className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-text shadow transition-transform hover:-translate-y-0.5"
        >
          ✦ Try the AI planner
        </Link>
        <p className="mt-3 text-xs text-white/75">Free to try</p>
      </div>
    </div>
  );
}

// ── The library ──────────────────────────────────────────────────────────

export default function GuidesLibrary({ guides, groups }: { guides: GuideCard[]; groups: GuideGroups }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [onlySaved, setOnlySaved] = useState(false);
  const [saved, setSaved] = useState<string[]>([]);

  // Read after mount: the server has no localStorage, and reading it during
  // render would make the first paint disagree with the server's HTML.
  useEffect(() => setSaved(loadSaved()), []);

  const toggle = (slug: string) =>
    setSaved((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      storeSaved(next);
      if (next.length === 0) setOnlySaved(false);
      return next;
    });
  const isSaved = (slug: string) => saved.includes(slug);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const g of guides) counts.set(g.category, (counts.get(g.category) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [guides]);

  const q = query.trim().toLowerCase();
  const filtering = Boolean(q || category || onlySaved);
  const results = useMemo(
    () =>
      guides.filter(
        (g) =>
          (!category || g.category === category) &&
          (!onlySaved || saved.includes(g.slug)) &&
          (!q || [g.title, g.excerpt, g.category].some((f) => f.toLowerCase().includes(q))),
      ),
    [guides, category, onlySaved, saved, q],
  );

  const chip = "inline-flex shrink-0 items-center gap-1 rounded-full border px-4 py-2 text-sm font-medium transition-colors";

  return (
    <>
      {/* Search + categories */}
      <div className="mx-auto mt-8 max-w-2xl">
        <label className="flex items-center gap-3 rounded-full border border-stone-2 bg-white px-4 shadow-sm focus-within:border-brand">
          <svg aria-hidden viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-stone-3">
            <circle cx="9" cy="9" r="6" />
            <path d="m17 17-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search guides, timelines, questions to ask…"
            aria-label="Search guides"
            className="w-full bg-transparent py-3 text-sm text-ink outline-none placeholder:text-stone-3"
          />
        </label>
      </div>
      <div className="-mx-5 mt-4 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        <div role="group" aria-label="Guide category" className="flex gap-2 sm:flex-wrap sm:justify-center">
          {[["All guides", guides.length] as const, ...categories].map(([c, n]) => {
            const value = c === "All guides" ? null : c;
            const on = category === value;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => setCategory(value)}
                className={`${chip} ${on ? "border-ink bg-ink text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}
              >
                {c}
                <span aria-hidden className={on ? "text-white/60" : "text-ink-soft/50"}>({n})</span>
              </button>
            );
          })}
        </div>
      </div>

      {filtering ? (
        <section className="mt-10" aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-soft/70">
              {onlySaved ? "Your reading list · " : ""}
              {results.length} {results.length === 1 ? "guide" : "guides"}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setCategory(null);
                setOnlySaved(false);
              }}
              className="text-sm font-semibold text-brand-text hover:text-brand-deep"
            >
              Show all guides
            </button>
          </div>
          {results.length === 0 ? (
            <p className="mt-6 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-10 text-center text-sm text-ink-soft/70">
              No guides match that search.
            </p>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {results.map((g) => (
                <li key={g.slug}><Row g={g} saved={isSaved(g.slug)} onToggle={() => toggle(g.slug)} /></li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <>
          {groups.flagship && (
            <Flagship g={groups.flagship} saved={isSaved(groups.flagship.slug)} onToggle={() => toggle(groups.flagship!.slug)} />
          )}

          {groups.foundation.length > 0 && (
            <section className="mt-14">
              <SectionHead title="The foundation" sub={`Settle these ${groups.foundation.length} before you pay any deposits.`} />
              <ol className="mt-5 grid gap-4 md:grid-cols-3">
                {groups.foundation.map((g, i) => (
                  <li key={g.slug}>
                    <div
                      className="group relative flex h-full flex-col rounded-3xl border border-stone-2 bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between">
                        <span className="font-display text-4xl font-light leading-none text-brand/70">{String(i + 1).padStart(2, "0")}</span>
                        <BookmarkButton saved={isSaved(g.slug)} onToggle={() => toggle(g.slug)} title={g.title} />
                      </div>
                      <Meta g={g} className="mt-4" />
                      <h3 className="mt-1.5 text-lg font-medium leading-snug text-ink">
                        <Link href={`/guides/${g.slug}`} className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand">{g.title}</Link>
                      </h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft/80">{g.excerpt}</p>
                      <span className="mt-auto pt-4 text-sm font-semibold text-brand-text">Read guide →</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}

          <div className="mt-14">
            <PlannerPromo />
          </div>

          {groups.hiring.length > 0 && (
            <section className="mt-14">
              <SectionHead
                title="Hiring your team"
                sub="What to ask, what to check in the contract, and when to book."
                aside={<span className="shrink-0 rounded-full bg-stone-4 px-3 py-1 text-xs font-medium text-ink-soft">{groups.hiring.length} guides</span>}
              />
              <ul className="mt-5 grid gap-3 md:grid-cols-2">
                {groups.hiring.map((g) => (
                  <li key={g.slug}><Row g={g} saved={isSaved(g.slug)} onToggle={() => toggle(g.slug)} /></li>
                ))}
              </ul>
            </section>
          )}

          {groups.logistics.length > 0 && (
            <section className="mt-14">
              <SectionHead title="Logistics & etiquette" sub="Tricky conversations, paperwork and the day itself." />
              <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {groups.logistics.map((g, i) => (
                  <li key={g.slug}>
                    <div
                      className={`group relative flex h-full flex-col rounded-2xl p-4 transition-colors ${
                        i % 3 === 0 ? "bg-brand-wash hover:bg-brand-wash/70" : i % 3 === 1 ? "bg-stone-4 hover:bg-stone-2/60" : "border border-stone-2 bg-white hover:border-brand/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-brand-text shadow-sm">
                          <Glyph name={iconFor(g)} className="h-[18px] w-[18px]" />
                        </span>
                        <BookmarkButton saved={isSaved(g.slug)} onToggle={() => toggle(g.slug)} title={g.title} />
                      </div>
                      <h3 className="mt-3 text-[15px] font-medium leading-snug text-ink">
                        <Link href={`/guides/${g.slug}`} className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand">{g.title}</Link>
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft/75">{g.excerpt}</p>
                      <span className="mt-auto flex items-center pt-3 justify-between text-xs text-ink-soft/60">
                        <span><span className="font-semibold text-brand-text">{g.category}</span> · {g.readMinutes} min</span>
                        <span aria-hidden className="text-brand-text">→</span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {/* Reading list */}
      {saved.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setOnlySaved((v) => !v);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          aria-pressed={onlySaved}
          className="fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-ink py-2.5 pl-3 pr-4 text-sm text-white shadow-lg print:hidden"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M6 3h12v18l-6-4-6 4z" />
            </svg>
          </span>
          <span className="font-semibold">
            {onlySaved ? "Show all guides" : `Reading list (${saved.length} saved)`}
          </span>
        </button>
      )}
    </>
  );
}

function Flagship({ g, saved, onToggle }: { g: GuideCard; saved: boolean; onToggle: () => void }) {
  return (
    <section className="mt-10" aria-label="Start here">
      <div
        className="group relative grid overflow-hidden rounded-3xl border border-stone-2 bg-white shadow-card md:grid-cols-[1.15fr_1fr]"
      >
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[320px]">
          <Image
            src="/media/guides/planning-binder.webp"
            alt="A wedding planner binder open to a budget tracker and mood board, with flowers and fabric swatches"
            fill
            priority
            sizes="(max-width: 768px) 100vw, 600px"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-x-3 top-3 flex items-start justify-between">
            <span className="flex gap-1.5">
              <span className="rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">Start here</span>
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">{g.readMinutes} min read</span>
            </span>
            <BookmarkButton saved={saved} onToggle={onToggle} title={g.title} light />
          </div>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">The master plan</p>
          <h2 className="mt-2 text-2xl font-medium leading-tight text-ink sm:text-3xl">
            <Link href={`/guides/${g.slug}`} className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand">{g.title}</Link>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-soft/80">{g.excerpt}</p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-text">
            Read the guide <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </span>
        </div>
      </div>
    </section>
  );
}

function Row({ g, saved, onToggle }: { g: GuideCard; saved: boolean; onToggle: () => void }) {
  return (
    <div
      className="relative flex h-full items-start gap-4 rounded-2xl border border-stone-2 bg-white p-4 transition-colors hover:border-brand/50"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand-text">
        <Glyph name={iconFor(g)} />
      </span>
      <span className="min-w-0 flex-1">
        <Meta g={g} />
        <h3 className="mt-0.5 text-base font-medium leading-snug text-ink">
          <Link href={`/guides/${g.slug}`} className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-brand">{g.title}</Link>
        </h3>
        <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-ink-soft/75">{g.excerpt}</span>
        <span className="mt-2 block text-sm font-semibold text-brand-text">Read →</span>
      </span>
      <BookmarkButton saved={saved} onToggle={onToggle} title={g.title} />
    </div>
  );
}
