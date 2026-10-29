import Link from "next/link";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import WeddingChecklist from "@/components/wedding-checklist";
import { pageMetadata } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";
import { TEMPLATE_TASK_COUNT } from "@/lib/plan-template";
import { faqSchema, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Public wedding checklist with real dates.
 *
 * The list is PLAN_TEMPLATE, the "expert checklist" the app seeds on /w/[id],
 * dated the same way (lib/checklist.ts), so it matches what a couple gets after
 * signing up. The written guide at /guides/wedding-planning-checklist targets
 * the same searches as an article; this page is the tool, and links to it.
 */

export const metadata = pageMetadata({
  path: "/wedding-checklist",
  title: "Wedding Checklist with Dates",
  ogTitle: "Free Wedding Checklist with Dates — Bridal Team",
  description: `Enter your wedding date and get a ${TEMPLATE_TASK_COUNT}-step wedding checklist with a due date for every task, from just engaged to thank-you notes. Free.`,
});

const CTA_LABEL = "Save my checklist free";

const FAQS = [
  {
    q: "How far in advance should we start?",
    a: "This checklist starts about 14 months before the wedding, which leaves time to book the venue and the vendors that sell out first. You can plan in less time; you'll just make decisions faster.",
  },
  {
    q: "Our wedding is less than a year away. Is it too late?",
    a: "No. Add your date and anything that should already be done is marked past due, so you can see what to catch up on first. Our guide to planning a wedding in 6 months covers the rest.",
  },
  {
    q: "Is this the same checklist as in the app?",
    a: `Yes. It's the ${TEMPLATE_TASK_COUNT}-step expert checklist Bridal Team builds for you after you sign up, with the same due dates. In your account you can tick tasks off on any device, edit and add tasks, and invite your partner and wedding party to the plan.`,
  },
  {
    q: "Is my checklist saved?",
    a: "Ticks on this page are remembered in this browser only, and nothing is sent to us. To keep it everywhere, create a free account.",
  },
  {
    q: "Is it free?",
    a: "Yes. Bridal Team is free for couples, with no card required. The checklist comes with the AI planner, budget, guest list and RSVPs, wedding website and seating chart.",
  },
];

export default function WeddingChecklistPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Wedding Checklist", path: "/wedding-checklist" },
        ])}
      />

      <PageHero
        eyebrow="Free tool"
        title="Wedding Checklist with Dates"
        subtitle={`Add your wedding date and every one of these ${TEMPLATE_TASK_COUNT} steps gets a due date, so you always know what to do next.`}
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <WeddingChecklist />
        <div className="mt-8 text-center">
          <Link
            href={SIGNUP_URL}
            className="inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {CTA_LABEL}
          </Link>
          <p className="mt-3 text-xs text-ink-soft/60">
            Free for couples. Your account builds this same checklist from your date.
          </p>
        </div>
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
        <h2 className="text-2xl font-light uppercase tracking-wide text-ink">Want the why behind each step?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft/80">
          Read{" "}
          <Link href="/guides/wedding-planning-checklist" className="text-brand-text underline">
            the complete wedding planning checklist
          </Link>
          ,{" "}
          <Link href="/guides/when-to-book-wedding-vendors" className="text-brand-text underline">
            when to book wedding vendors
          </Link>{" "}
          and{" "}
          <Link href="/guides/how-to-plan-a-wedding-in-6-months" className="text-brand-text underline">
            how to plan a wedding in 6 months
          </Link>
          , or use the free{" "}
          <Link href="/wedding-budget-calculator" className="text-brand-text underline">
            budget calculator
          </Link>
          ,{" "}
          <Link href="/wedding-rsvp" className="text-brand-text underline">
            guest list &amp; RSVP
          </Link>{" "}
          and{" "}
          <Link href="/wedding-seating-chart" className="text-brand-text underline">
            seating chart
          </Link>
          .
        </p>
      </section>
    </>
  );
}
