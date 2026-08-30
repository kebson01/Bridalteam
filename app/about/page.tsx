import Link from "next/link";
import PageHero from "@/components/page-hero";
import { pageMetadata } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";

export const metadata = pageMetadata({
  path: "/about",
  title: "About",
  description:
    "Bridal Team has helped couples plan happier weddings since 2014 — now rebuilt and powered by AI.",
});

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title="Planning weddings since 2014"
        subtitle="We started Bridal Team to make wedding planning fun and simple. Today we're reimagining it with AI at your side."
      />

      <section className="mx-auto max-w-3xl px-5 py-16 text-lg leading-relaxed text-ink-soft/85">
        <p>
          Bridal Team began back in 2014 with a simple belief: planning a wedding
          should feel joyful, not overwhelming. Couples were juggling
          spreadsheets, sticky notes and a dozen browser tabs — so we built one
          place to organize details, find ideas, and collaborate with the people
          helping you say &ldquo;I do.&rdquo;
        </p>
        <p className="mt-6">
          More than a decade later, we&rsquo;ve rebuilt Bridal Team from the
          ground up. The heart is the same — fun, simple, collaborative planning
          — but now an AI planning team works alongside you, drafting timelines,
          estimating budgets, advising on vendors and sparking ideas in seconds.
        </p>
        <p className="mt-6">
          Whether you&rsquo;re just getting engaged or deep in the details,
          Bridal Team keeps everything (and everyone) in sync — so you can spend
          less time managing and more time celebrating.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            ["2014", "Founded"],
            ["1 place", "For your whole team"],
            ["AI", "At the core"],
          ].map(([stat, label]) => (
            <div key={label} className="rounded-2xl border border-stone-2 bg-white p-6 text-center shadow-card">
              <div className="text-2xl font-semibold text-brand-text">{stat}</div>
              <div className="mt-1 text-sm uppercase tracking-wider text-ink-soft/60">{label}</div>
            </div>
          ))}
        </div>

        <div id="contact" className="mt-12 rounded-2xl bg-stone-4 p-8 text-center">
          <h2 className="text-xl font-medium text-ink">Get in touch</h2>
          <p className="mt-2 text-base text-ink-soft/75">
            Questions, press, or partnerships? Email{" "}
            <a href="mailto:hello@bridalteam.com" className="font-semibold text-brand-text">
              hello@bridalteam.com
            </a>
            .
          </p>
          <Link
            href={SIGNUP_URL}
            className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3 text-sm font-semibold text-white"
          >
            Start planning free
          </Link>
        </div>
      </section>
    </>
  );
}
