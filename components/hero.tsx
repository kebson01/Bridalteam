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
        <div className="absolute inset-0 bg-gradient-to-b from-brand-deep/70 via-brand-dark/65 to-ink/80" />
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
            className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-dark shadow-glow transition-transform hover:-translate-y-0.5"
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

        <dl className="animate-fade-up mt-16 grid w-full max-w-lg grid-cols-3 gap-4 text-white">
          {[
            ["100%", "Free to start"],
            ["1 place", "For your whole team"],
            ["24/7", "AI planning help"],
          ].map(([stat, label]) => (
            <div key={label} className="text-center">
              <dt className="text-2xl font-semibold sm:text-3xl">{stat}</dt>
              <dd className="mt-1 text-xs uppercase tracking-widest text-white/70">
                {label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
