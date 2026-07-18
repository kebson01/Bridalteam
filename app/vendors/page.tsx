import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Find Wedding Vendors — Bridal Team",
  description:
    "Browse venues, photographers, florists, caterers and more — or let AI match you with the best-fit vendors for your style, budget and location.",
};

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

const VENDORS = [
  { name: "Rosewood Estate", category: "Venue", location: "Austin, TX", price: "$$$", tag: "Garden · 200 guests" },
  { name: "Amber & Ash Photo", category: "Photographer", location: "Nashville, TN", price: "$$", tag: "Documentary style" },
  { name: "Wildbloom Florals", category: "Florist", location: "Portland, OR", price: "$$", tag: "Seasonal & local" },
  { name: "The Copper Spoon", category: "Caterer", location: "Denver, CO", price: "$$$", tag: "Farm-to-table" },
  { name: "Midnight Avenue", category: "Band", location: "Chicago, IL", price: "$$$", tag: "8-piece soul band" },
  { name: "Sugar & Sea", category: "Cakes", location: "Miami, FL", price: "$$", tag: "Custom tiers" },
];

export default function VendorsPage() {
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

        {/* Vendor grid */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VENDORS.map((v) => (
            <article
              key={v.name}
              className="overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand/15 via-stone-4 to-brand-dark/10">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-dark">
                  {v.category}
                </span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-lg font-medium text-ink">{v.name}</h3>
                  <span className="text-sm font-semibold text-brand-dark">{v.price}</span>
                </div>
                <p className="mt-1 text-sm text-ink-soft/70">{v.location}</p>
                <p className="mt-3 text-sm text-ink-soft/80">{v.tag}</p>
                <Link
                  href="/planner"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-dark hover:text-brand-deep"
                >
                  Ask AI about this vendor <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-ink-soft/60">
          Sample listings shown. Real vendor profiles arrive with the directory
          launch — vendors can{" "}
          <Link href="/for-vendors" className="font-semibold text-brand-dark">
            join the waitlist here
          </Link>
          .
        </p>
      </section>
    </>
  );
}
