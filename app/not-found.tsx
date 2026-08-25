import Link from "next/link";
import type { Metadata } from "next";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Page not found",
  // A 404 shouldn't accumulate in the index, and it must not inherit the
  // homepage's title — which is exactly what the framework default did.
  robots: { index: false, follow: true },
};

const SUGGESTIONS = [
  {
    href: "/planner",
    label: "AI planner",
    blurb: "Ask anything about your wedding and get a real answer in seconds.",
  },
  {
    href: "/guides",
    label: "Planning guides",
    blurb: "Checklists, budgets, timelines and how to choose each vendor.",
  },
  {
    href: "/inspiration",
    label: "Inspiration",
    blurb: "Browse real wedding photography by theme and colour.",
  },
  {
    href: "/community",
    label: "Community",
    blurb: "Advice and real weddings from other couples and vendors.",
  },
];

export default function NotFound() {
  return (
    <>
      <PageHero
        eyebrow="404"
        title="We can't find that page"
        subtitle="It may have moved, or the link might have a typo. Here's where most people are heading."
      />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="grid gap-4 sm:grid-cols-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-2xl border border-stone-2 bg-white p-5 shadow-card transition-transform hover:-translate-y-1 hover:border-brand"
            >
              <h2 className="font-medium text-ink transition-colors group-hover:text-brand-text">
                {s.label}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft/75">{s.blurb}</p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-ink-soft/70">
          Or head back to the{" "}
          <Link href="/" className="font-semibold text-brand-text underline-offset-2 hover:underline">
            homepage
          </Link>
          . Still stuck? Email{" "}
          <a
            href="mailto:hello@bridalteam.com"
            className="font-semibold text-brand-text underline-offset-2 hover:underline"
          >
            hello@bridalteam.com
          </a>
          .
        </p>
      </section>
    </>
  );
}
