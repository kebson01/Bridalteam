import Link from "next/link";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/structured-data";
import { GUIDES } from "@/lib/guides";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/guides",
  title: "Wedding Planning Guides",
  description:
    "Free, in-depth wedding planning guides — checklists, budgets, venues, vendors, guest lists and timelines to help you plan with confidence.",
});

export default function GuidesPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <PageHero
        eyebrow="Plan with confidence"
        title="Wedding planning guides"
        subtitle="In-depth, practical guides to every part of planning — written to actually help, not just to fill a page."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-text">
                <span>{g.category}</span>
                <span className="text-stone-3">·</span>
                <span className="text-ink-soft/60">{g.readMinutes} min read</span>
              </div>
              <h2 className="mt-3 text-lg font-medium leading-snug text-ink">{g.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/80">{g.excerpt}</p>
              <span className="mt-4 text-sm font-semibold text-brand-text">Read the guide →</span>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-ink-soft/70">Rather have a plan built for your day?</p>
          <Link
            href="/planner"
            className="mt-4 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Try the AI planner
          </Link>
        </div>
      </section>
    </>
  );
}
