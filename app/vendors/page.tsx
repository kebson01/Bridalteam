import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import { supabasePublic, type Venue } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Find Wedding Vendors — Bridal Team",
  description:
    "Browse venues, photographers, florists, caterers and more — or let AI match you with the best-fit vendors for your style, budget and location.",
};

// Always read fresh venue data at request time.
export const dynamic = "force-dynamic";

const CATEGORIES = [
  "Venues",
  "Photographers",
  "Florists",
  "Caterers",
  "DJs & Bands",
  "Cakes & Desserts",
  "Planners",
  "Beauty & Hair",
];

// Fallback shown only if the database can't be reached.
const FALLBACK: Partial<Venue>[] = [
  { name: "Rosewood Estate", category: "Venue", city: "Austin", state: "TX", price: "$$$", tag: "Garden · 200 guests" },
  { name: "The Grand Marquee", category: "Venue", city: "Nashville", state: "TN", price: "$$$", tag: "Ballroom · 300 guests" },
  { name: "Wildflower Barn", category: "Venue", city: "Portland", state: "OR", price: "$$", tag: "Rustic barn · 150 guests" },
];

async function getVenues(): Promise<Partial<Venue>[]> {
  try {
    const supabase = supabasePublic();
    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .order("featured", { ascending: false })
      .order("created_at", { ascending: false });
    if (error || !data || data.length === 0) return FALLBACK;
    return data;
  } catch {
    return FALLBACK;
  }
}

function locationOf(v: Partial<Venue>) {
  return [v.city, v.state].filter(Boolean).join(", ");
}

export default async function VendorsPage() {
  const venues = await getVenues();

  return (
    <>
      <PageHero
        eyebrow="Smart vendor matching"
        title="Find your dream team"
        subtitle="Browse the directory, or tell our AI your style, budget and location and get matched with vendors who actually fit your day."
      />

      <section className="mx-auto max-w-6xl px-5 py-12">
        {/* Search + AI match */}
        <div className="flex flex-col gap-3 rounded-2xl border border-stone-2 bg-white p-4 shadow-card sm:flex-row sm:items-center">
          <input
            placeholder="Search vendors, e.g. 'rustic barn venue in Texas'"
            className="flex-1 rounded-full border border-stone-2 px-5 py-3 text-sm text-ink outline-none focus:border-brand"
          />
          <Link
            href="/planner"
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-center text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Match me with AI
          </Link>
        </div>

        {/* Category chips */}
        <ul className="mt-8 flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <li key={c}>
              <span className="inline-block cursor-default rounded-full border border-stone-2 bg-white px-4 py-2 text-sm text-ink-soft transition-colors hover:border-brand hover:text-brand-dark">
                {c}
              </span>
            </li>
          ))}
        </ul>

        {/* Venue grid — live from Supabase */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {venues.map((v, i) => (
            <article
              key={v.id ?? `${v.name}-${i}`}
              className="overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="relative flex h-36 items-center justify-center bg-gradient-to-br from-brand/15 via-stone-4 to-brand-dark/10">
                {v.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.image_url} alt={v.name ?? ""} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">
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
                    <span className="text-sm font-semibold text-brand-dark">{v.price}</span>
                  )}
                </div>
                {locationOf(v) && (
                  <p className="mt-1 text-sm text-ink-soft/70">{locationOf(v)}</p>
                )}
                {v.tag && <p className="mt-3 text-sm text-ink-soft/80">{v.tag}</p>}
                <Link
                  href="/planner"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:text-brand-deep"
                >
                  Ask AI about this venue <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-ink-soft/60">
          Venues are managed in Supabase. Add or edit them from the{" "}
          <Link href="/admin/venues" className="font-semibold text-brand-dark">
            venue admin
          </Link>
          . Vendors can also{" "}
          <Link href="/for-vendors" className="font-semibold text-brand-dark">
            join the waitlist
          </Link>
          .
        </p>
      </section>
    </>
  );
}
