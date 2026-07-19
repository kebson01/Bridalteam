import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Blog",
  description: "Wedding planning tips, ideas and inspiration from the Bridal Team.",
};

const POSTS = [
  { title: "The 12-month wedding timeline that actually works", cat: "Planning", read: "6 min", excerpt: "A month-by-month roadmap from 'we're engaged' to 'I do' — and how AI keeps it on track." },
  { title: "How to build a realistic wedding budget", cat: "Budget", read: "5 min", excerpt: "Where the money really goes, plus a percentage breakdown you can steal for any headcount." },
  { title: "Which vendors to book first (and why it matters)", cat: "Vendors", read: "4 min", excerpt: "The booking order that keeps your top choices from getting away." },
  { title: "2026 wedding trends couples are loving", cat: "Inspiration", read: "7 min", excerpt: "From candle-lit vineyards to modern minimalism — the looks defining the year." },
  { title: "Planning together: keeping your whole team in sync", cat: "Collaboration", read: "5 min", excerpt: "How to share the load with your partner, family and vendors without the chaos." },
  { title: "5 ways AI makes wedding planning easier", cat: "AI", read: "4 min", excerpt: "Timelines, budgets, vendor matching and more — what your AI planning team can do." },
];

export default function BlogPage() {
  return (
    <>
      <PageHero
        eyebrow="From the team"
        title="The Bridal Team blog"
        subtitle="Tips, ideas and inspiration to make planning your wedding a little more fun."
      />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {POSTS.map((p) => (
            <article
              key={p.title}
              className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-dark">
                <span>{p.cat}</span>
                <span className="text-stone-3">·</span>
                <span className="text-ink-soft/60">{p.read} read</span>
              </div>
              <h3 className="mt-3 text-lg font-medium leading-snug text-ink">{p.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/80">{p.excerpt}</p>
              <span className="mt-4 text-sm font-semibold text-stone-3">Full article coming soon</span>
            </article>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-ink-soft/70">Want answers now, not later?</p>
          <Link
            href="/planner"
            className="mt-4 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Ask the AI planner
          </Link>
        </div>
      </section>
    </>
  );
}
