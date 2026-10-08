import Image from "next/image";
import Link from "next/link";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/brand/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-slow-zoom object-cover object-center"
        />
        {/* the original site's signature orange wash */}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/30 via-brand-deep/15 to-ink/60" />
      </div>

      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 py-28 text-center sm:py-36">
        <span className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-brand-amber animate-pulse-dot" />
          Now with an AI planning team
        </span>

        <h1 className="animate-fade-up text-4xl font-light uppercase leading-tight tracking-[0.12em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)] sm:text-6xl">
          Fun, Simple
          <br />
          Wedding Planning.
        </h1>

        <p className="animate-fade-up mt-7 max-w-2xl text-lg font-light text-white/90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] sm:text-xl">
          Organize details. Find ideas. Collaborate with your team. All in one
          place — now guided by AI every step of the way. Open your free account
          today.
        </p>

        <div className="animate-fade-up mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Link
            href="/planner"
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-text shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Try the AI planner
          </Link>
          <Link
            href={SHOW_VENDOR_DIRECTORY ? "/vendors" : "/#how"}
            className="rounded-full border border-white/50 px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            {SHOW_VENDOR_DIRECTORY ? "Browse vendors" : "See how it works"}
          </Link>
        </div>

        {/*
          Was a stat bar: "100%" free to start, "1 place", "24/7". Visitors read
          the slot under a hero as proof — couples planning, weddings completed
          — so putting non-numbers in a number's shape reads as a site with no
          numbers to show, which is the opposite of what it was there to do.

          These three steps can be told truthfully on day one and stay true at
          ten thousand couples, so nothing here has to be revisited when the
          real numbers arrive. Swap in the counts then, with the honest caveat
          that `page_events` records views and not visitors (see the migration
          in supabase/migrations/20260920060000_page_events.sql).
        */}
        <ol className="animate-fade-up mt-16 grid w-full max-w-2xl grid-cols-1 gap-6 text-white sm:grid-cols-3 sm:gap-4">
          {[
            ["Ask", "Tell the planner your date, city and guest count."],
            ["Organize", "Get a timeline, budget and checklist you can edit."],
            ["Share", "Invite your partner, your party and your parents."],
          ].map(([step, label], i) => (
            <li key={step} className="text-center">
              <span
                aria-hidden
                className="mx-auto flex h-8 w-8 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold backdrop-blur"
              >
                {i + 1}
              </span>
              <span className="mt-3 block text-sm font-semibold uppercase tracking-widest">
                {step}
              </span>
              <p className="mt-1 text-sm font-light text-white/75">{label}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
