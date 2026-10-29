import Link from "next/link";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import TableCalculator from "@/components/table-calculator";
import { pageMetadata } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";
import { faqSchema, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Public seating chart page: a "how many tables?" calculator plus the seating
 * feature in the app.
 *
 * Seating in the app is deliberately simple: type a table name next to each
 * guest who accepted (components/wedding/guest-list.tsx), then print a chart
 * grouped by table or place cards (app/w/[id]/guests/print). There is no
 * drag-and-drop floor plan, so nothing below claims one. Keep it that way
 * unless one is built.
 */

export const metadata = pageMetadata({
  path: "/wedding-seating-chart",
  title: "Wedding Seating Chart",
  ogTitle: "Free Wedding Seating Chart & Table Calculator — Bridal Team",
  description:
    "Work out how many tables your wedding needs, then seat guests straight from their RSVPs and print your seating chart and place cards. Free.",
});

const CTA_LABEL = "Start your free seating chart";

const FEATURES: Array<[string, string]> = [
  ["Seated from your RSVPs", "Only guests who said yes appear, under the names they gave, with the meal they chose."],
  ["Name tables your way", "Type a table name next to each guest: “Table 4”, “Head table”, “Oak”. Change it any time."],
  ["Print the chart", "One section per table with its guests, their meals and a seat count. Anyone not seated yet is listed last, so nobody is missed."],
  ["Print place cards", "A card for every guest with their name, table and meal, ready to cut out."],
];

const TIPS = [
  "Wait for most RSVPs before you start. You only need seats for the people who are coming.",
  "Keep couples and households at the same table.",
  "Seat close family nearest to you.",
  "Seat guests near someone they know, or someone they have something in common with.",
  "Keep older guests away from the speakers, and families with young children near an exit.",
  "Leave a spare seat or two for last-minute changes.",
];

const FAQS = [
  {
    q: "How many guests fit at a table?",
    a: "Round tables commonly seat 8 to 10, and some seat 12. It depends on the table and the room, so confirm sizes with your venue or rental company, then use the calculator above to see how many you need.",
  },
  {
    q: "When should we make the seating chart?",
    a: "After your RSVP deadline, once you know who's coming. In Bridal Team only guests who have accepted appear, so the chart is built from real replies.",
  },
  {
    q: "Can we print place cards?",
    a: "Yes. Bridal Team prints a place card for every guest who accepted, with their name, table and meal, and a seating chart grouped by table.",
  },
  {
    q: "Can we change tables later?",
    a: "Yes. A table is just a name you type next to each guest, so moving someone is a matter of typing a different one. Print again whenever things change.",
  },
  {
    q: "Is it free?",
    a: "Yes. Bridal Team is free for couples, with no card required. Seating comes with the guest list, RSVPs, budget, wedding website and AI planner.",
  },
];

export default function WeddingSeatingChartPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Wedding Seating Chart", path: "/wedding-seating-chart" },
        ])}
      />

      <PageHero
        eyebrow="Free tool"
        title="Wedding Seating Chart"
        subtitle="Find out how many tables you need, then seat your guests straight from their RSVPs and print the chart and place cards."
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
          How many tables do you need?
        </h2>
        <div className="mt-8">
          <TableCalculator />
        </div>
      </section>

      <section className="border-t border-stone-2 bg-stone-4 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
            Seating in Bridal Team
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
                <h3 className="text-lg font-medium text-brand-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{body}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link
              href={SIGNUP_URL}
              className="inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
            >
              {CTA_LABEL}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
          Tips for seating your guests
        </h2>
        <ul className="mt-8 space-y-3">
          {TIPS.map((t) => (
            <li key={t} className="flex gap-3 text-ink-soft/85">
              <span aria-hidden className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/15 text-brand-text">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m20 6-11 11-5-5" />
                </svg>
              </span>
              {t}
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-stone-2 bg-stone-4 py-16">
        <div className="mx-auto max-w-3xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">Questions</h2>
          <div className="mt-8 space-y-4">
            {FAQS.map((f) => (
              <div key={f.q} className="rounded-2xl border border-stone-2 bg-white p-6">
                <h3 className="font-medium text-ink">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-16 text-center">
        <h2 className="text-2xl font-light uppercase tracking-wide text-ink">Still waiting on replies?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft/80">
          Collect them with the{" "}
          <Link href="/wedding-rsvp" className="text-brand-text underline">
            free guest list &amp; RSVP
          </Link>
          , read{" "}
          <Link href="/guides/wedding-guest-list" className="text-brand-text underline">
            how to build your guest list
          </Link>{" "}
          and the{" "}
          <Link href="/guides/wedding-day-timeline" className="text-brand-text underline">
            wedding day timeline
          </Link>
          , or see your cost per guest with the{" "}
          <Link href="/wedding-budget-calculator" className="text-brand-text underline">
            budget calculator
          </Link>
          .
        </p>
        <Link
          href={SIGNUP_URL}
          className="mt-8 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          {CTA_LABEL}
        </Link>
      </section>
    </>
  );
}
