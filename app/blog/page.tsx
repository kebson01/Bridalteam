import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import { POSTS_BY_DATE } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog",
  description: "Wedding planning tips, ideas and inspiration from the Bridal Team.",
};

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

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
          {POSTS_BY_DATE.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-dark">
                <span>{p.category}</span>
                <span className="text-stone-3">·</span>
                <span className="text-ink-soft/60">{p.readMinutes} min read</span>
              </div>
              <h2 className="mt-3 text-lg font-medium leading-snug text-ink">{p.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-soft/80">{p.excerpt}</p>
              <span className="mt-4 text-sm font-semibold text-brand-dark">Read more →</span>
            </Link>
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
