import Image from "next/image";
import Link from "next/link";
import type { HomeVendorSummary } from "@/lib/home-vendors";
import { SIGNUP_URL } from "@/lib/config";

/**
 * The homepage sections. Photos are from Unsplash (free license; the owner's
 * rule is no recognisable faces, checked at full size), self-hosted in
 * public/media/home:
 *
 *   camera.webp          Amrit Sangar      unsplash.com/photos/Vrwbwm-jvm0
 *   flowers.webp         Dan Edwards       unsplash.com/photos/8bhzvpM8PJ4
 *   long-table.webp      M F (@mfe1)       unsplash.com/photos/fb0_wj2MZk4
 *   cake.webp            Mads Eneqvist     unsplash.com/photos/Xb5c2x6wJPc
 *   candlelit-roses.webp Zane Persaud      unsplash.com/photos/r3XxZj-J4uQ
 *   floral-arch.webp     David Goldman     unsplash.com/photos/kdlfXY9rvZA
 *
 * public/media/guides/planning-binder.webp is the owner's own photo. The hero
 * uses the original site's beach-aisle banner, public/brand/hero.jpg, at the
 * owner's request.
 *
 * The Wedding moments section mixes those Unsplash details with photos from
 * the St. Charles (2012) and Paul (2014) weddings in public/media/real-weddings,
 * shared by the couples.
 */

const SPARK = "M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z";

function Spark({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={SPARK} />
    </svg>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">{children}</p>;
}

// ── Hero ─────────────────────────────────────────────────────────────────

export function HomeHero({ vendorCount, showVendors }: { vendorCount: number; showVendors: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-12 pt-10 sm:pt-14">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="text-center lg:text-left">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
            <Spark className="h-3 w-3" /> Your AI wedding planning team
          </span>
          <h1 className="mt-5 text-4xl font-medium leading-[1.1] text-ink sm:text-6xl">
            Fun, simple
            <br />
            <span className="text-brand-text">wedding planning.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[16px] leading-relaxed text-ink-soft/80 lg:mx-0">
            Organize details. Find ideas. Collaborate with your team. All in one place, now guided by AI every step of
            the way.
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link
              href="/planner"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-8 py-3.5 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(243,103,5,0.8)] transition-transform hover:-translate-y-0.5"
            >
              Try the AI planner <span aria-hidden>→</span>
            </Link>
            <Link
              href={showVendors ? "/vendors" : "/#how"}
              className="inline-flex items-center justify-center rounded-full border border-stone-2 bg-white px-8 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-brand"
            >
              {showVendors ? "Browse Florida vendors" : "See how it works"}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          {/* The banner is wide (1280x560); keep the frame landscape and centre the bouquet. */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] shadow-card sm:aspect-[16/9] lg:aspect-[4/3]">
            <Image
              src="/brand/hero.jpg"
              alt="A beach wedding aisle with bouquets and pink ribbons on the chairs"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-cover object-[72%_50%]"
            />
          </div>
          {/* A real count, linked to the directory. No rating and no "vetted":
              see lib/home-vendors.ts for why. */}
          {showVendors && vendorCount > 0 && (
            <Link
              href="/vendors"
              className="absolute -bottom-5 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 p-3.5 shadow-card backdrop-blur transition-transform hover:-translate-y-0.5 sm:left-auto sm:right-6 sm:w-72"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand-text">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                  strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                  <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                  <circle cx="12" cy="10" r="2.3" />
                </svg>
              </span>
              <span className="leading-tight">
                <span className="block text-[11px] font-semibold uppercase tracking-wider text-brand-text">Florida directory</span>
                <span className="block text-sm font-semibold text-ink">{vendorCount.toLocaleString("en-US")} wedding vendors</span>
              </span>
              <span aria-hidden className="ml-auto text-brand-text">→</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

// ── How it works ─────────────────────────────────────────────────────────

const STEPS = [
  { title: "Ask", body: "Tell the AI planner your date, dream vibe and guest count, in your own words." },
  { title: "Organize", body: "Get a checklist with due dates, a realistic budget, and the order to book your vendors." },
  { title: "Share & collaborate", body: "Invite your partner, family and wedding party so everyone works from the same plan." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 bg-brand-wash/50 py-16">
      <div className="mx-auto max-w-5xl px-5">
        <div className="text-center">
          <Eyebrow>How it works</Eyebrow>
          <h2 className="mt-2 text-3xl font-medium text-ink sm:text-4xl">Three simple steps</h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative flex gap-4 rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:flex-col md:gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep font-display text-lg font-medium text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="text-lg font-medium text-ink">{s.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ── One place. A whole team. ─────────────────────────────────────────────

const SUITE = [
  {
    tag: "Vendors",
    title: "Know who to book, and when",
    body: "Tell the AI planner your style, budget and city, and it tells you which vendors to book first, what to ask them, and what a fair price looks like.",
    href: "/vendors",
    cta: "Browse vendors",
    img: "/media/home/camera.webp",
    alt: "A camera on a white table with greenery and kraft paper frames",
  },
  {
    tag: "Inspiration",
    title: "Curated mood boards",
    body: "Browse real wedding photography by theme and color, then save the looks you love to a board your wedding party can see.",
    href: "/inspiration",
    cta: "Find ideas",
    img: "/media/home/flowers.webp",
    alt: "Pink roses, peonies and baby's breath bouquets laid on a wooden table",
  },
  {
    tag: "Budget & RSVPs",
    title: "Budget & smart RSVPs",
    body: "Turn your total into a realistic breakdown, including the costs first-timers forget, then collect RSVPs with meals and dietary needs.",
    href: "/wedding-budget-calculator",
    cta: "Try the budget calculator",
    img: "/media/guides/planning-binder.webp",
    alt: "A wedding planner binder open to a budget tracker and mood board",
  },
  {
    tag: "Your team",
    title: "Plan with your whole team",
    body: "Invite your partner, family and wedding party. Everyone sees the same plan, gets the right to-dos, and stays in sync.",
    href: SIGNUP_URL,
    cta: "Start free",
    img: "/media/home/long-table.webp",
    alt: "A long candlelit reception table with flowers",
  },
];

export function WholeTeam() {
  return (
    <section className="mx-auto max-w-6xl px-5 py-16">
      <div className="max-w-2xl">
        <Eyebrow>The complete planning suite</Eyebrow>
        <h2 className="mt-2 text-3xl font-medium leading-tight text-ink sm:text-4xl">
          One place. A whole team.
          <br />
          <span className="text-brand-text">Everything you need to plan.</span>
        </h2>
      </div>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2">
        {SUITE.map((f) => (
          <li key={f.title}>
            <Link href={f.href} className="group block h-full overflow-hidden rounded-3xl border border-stone-2 bg-white shadow-card">
              <div className="relative aspect-[16/9] overflow-hidden bg-brand-soft">
                <Image src={f.img} alt={f.alt} fill sizes="(max-width: 640px) 100vw, 560px"
                  className="object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                  {f.tag}
                </span>
              </div>
              <div className="p-5">
                <h3 className="text-xl font-medium text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft/80">{f.body}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-text">
                  {f.cta} <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── Real weddings ────────────────────────────────────────────────────────

/**
 * A mix: photos from two real weddings, Kebson & Tricia St. Charles's (2012)
 * and the Paul wedding (2014), both shared by the couples and already in the
 * Inspiration feed, plus three Unsplash detail shots (no people). Each says
 * which it is: the real ones name the wedding, the Unsplash ones say
 * "Inspiration" and are never presented as a real Bridal Team wedding. The
 * Paul archway kiss is left out at the owner's request, and the owner swapped
 * the Paul blessing and lake photos for more of the St. Charles wedding.
 *
 * Order and spans are chosen so grid-flow-dense fills every cell with no
 * gaps: on desktop a 4-column, 5-row mosaic (the five portraits span two
 * rows, the four wide shots span two columns); on phones a 2-column grid
 * where the wide ones take a full row. Changing the list means re-checking
 * that it still tiles.
 */
const ST_CHARLES = "St. Charles wedding · Boca Raton";
const PAUL = "Paul wedding · Parkland";
const IDEA = "Inspiration";
const REAL = [
  { src: "/media/real-weddings/st-charles-2012-getting-dressed.webp", caption: "Getting into the dress", where: ST_CHARLES, cls: "row-span-2", pos: "object-center" },
  { src: "/media/real-weddings/st-charles-2012-wedding-party.webp", caption: "The whole wedding party", where: ST_CHARLES, cls: "col-span-2", pos: "object-center" },
  { src: "/media/home/cake.webp", caption: "Berries & blooms", where: IDEA, cls: "row-span-2", pos: "object-center" },
  { src: "/media/real-weddings/st-charles-2012-bride-smile.webp", caption: "Before the aisle", where: ST_CHARLES, cls: "", pos: "object-[50%_30%]" },
  { src: "/media/home/candlelit-roses.webp", caption: "Candlelit roses", where: IDEA, cls: "row-span-2", pos: "object-center" },
  { src: "/media/home/floral-arch.webp", caption: "A ceremony arch in bloom", where: IDEA, cls: "col-span-2", pos: "object-center" },
  { src: "/media/real-weddings/st-charles-2012-rings.jpg", caption: "Rings in crystal heels", where: ST_CHARLES, cls: "", pos: "object-center" },
  { src: "/media/real-weddings/paul-2014-bridal-party.jpg", caption: "Team Bride", where: PAUL, cls: "col-span-2", pos: "object-[50%_35%]" },
  { src: "/media/real-weddings/st-charles-2012-aisle-walk.webp", caption: "Down the aisle", where: ST_CHARLES, cls: "row-span-2", pos: "object-[50%_60%]" },
  { src: "/media/real-weddings/st-charles-2012-groom-ready.webp", caption: "Buttoning up", where: ST_CHARLES, cls: "row-span-2", pos: "object-top" },
  { src: "/media/real-weddings/st-charles-2012-just-married.webp", caption: "Just married", where: ST_CHARLES, cls: "col-span-2", pos: "object-[50%_45%]" },
];

export function RealWeddings() {
  return (
    <section className="mx-auto max-w-6xl px-5 pb-16">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Eyebrow>Wedding moments</Eyebrow>
          <h2 className="mt-2 text-3xl font-medium leading-tight text-ink sm:text-4xl">
            Moments worth <span className="text-brand-text">planning for</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-ink-soft/75">
            Real moments from the St. Charles and Paul weddings, shared by the couples, alongside ideas for your own day.
          </p>
        </div>
        <Link href="/inspiration" className="hidden shrink-0 text-sm font-semibold text-brand-text hover:text-brand-deep sm:inline">
          See more ideas <span aria-hidden>→</span>
        </Link>
      </div>
      <ul className="mt-6 grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-4 md:auto-rows-[210px]">
        {REAL.map((r) => (
          <li key={r.src} className={`group relative overflow-hidden rounded-2xl shadow-card ${r.cls}`}>
            <Image src={r.src} alt={`${r.caption}, ${r.where}`} fill
              sizes={r.cls === "col-span-2" ? "(max-width: 768px) 100vw, 600px" : "(max-width: 768px) 50vw, 300px"}
              className={`object-cover ${r.pos} transition-transform duration-700 group-hover:scale-105`} />
            <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
            <span className="absolute inset-x-0 bottom-0 p-3 text-white">
              <span className="block truncate text-sm font-medium">{r.caption}</span>
              {/* Says whose photo it is, so stock is never mistaken for a real wedding. Phone tiles get the short form. */}
              <span className="hidden truncate text-[11px] text-white/80 sm:block">{r.where}</span>
              <span className="block truncate text-[11px] text-white/80 sm:hidden">{r.where.split(" · ")[0]}</span>
            </span>
          </li>
        ))}
      </ul>
      <Link href="/inspiration" className="mt-5 inline-flex text-sm font-semibold text-brand-text sm:hidden">
        See more ideas <span aria-hidden className="ml-1">→</span>
      </Link>
    </section>
  );
}

// ── Browse Florida vendors ───────────────────────────────────────────────

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

export function HomeVendors({ summary }: { summary: HomeVendorSummary }) {
  if (summary.count === 0) return null;
  return (
    <section id="vendors" className="bg-stone-4/60 py-16">
      <div className="mx-auto max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Florida wedding vendors</Eyebrow>
            <h2 className="mt-2 text-3xl font-medium text-ink sm:text-4xl">Browse Florida vendors</h2>
          </div>
          <Link href="/vendors" className="shrink-0 text-sm font-semibold text-brand-text hover:text-brand-deep">
            View all <span aria-hidden>→</span>
          </Link>
        </div>

        {/* Each chip opens the directory filtered to that type. */}
        <ul className="-mx-5 mt-6 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:flex-wrap">
          <li className="shrink-0">
            <Link href="/vendors" className="inline-flex rounded-full bg-ink px-4 py-2 text-sm font-medium text-white">
              All vendors <span className="ml-1 text-white/60">({summary.count})</span>
            </Link>
          </li>
          {summary.types.map((t) => (
            <li key={t.name} className="shrink-0">
              <Link
                href={`/vendors?type=${encodeURIComponent(t.name)}`}
                className="inline-flex rounded-full border border-stone-2 bg-white px-4 py-2 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand-text"
              >
                {t.name} <span className="ml-1 text-ink-soft/50">({t.count})</span>
              </Link>
            </li>
          ))}
        </ul>

        {summary.picks.length > 0 && (
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {summary.picks.map((v) => (
              <li key={v.org_id} className="min-w-0">
                <Link href={`/v/${v.org_id}`} className="group flex h-full gap-4 rounded-2xl border border-stone-2 bg-white p-3 shadow-sm hover:border-brand/50 md:flex-col md:p-0">
                  <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-wash md:aspect-[4/3] md:h-auto md:w-full md:rounded-none md:rounded-t-2xl">
                    {v.cover_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.cover_url} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    )}
                    {v.featured && (
                      <span className="absolute left-2 top-2 hidden rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white md:inline">
                        Featured
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1 md:px-4 md:pb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-text">{v.category ?? "Vendor"}</span>
                    <span className="block truncate text-lg font-medium leading-snug text-ink">{v.business_name}</span>
                    <span className="block truncate text-xs text-ink-soft/60">
                      {[[v.city, v.region].filter(Boolean).join(", "), v.packages_from != null ? `From ${money(v.packages_from)}` : null]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
