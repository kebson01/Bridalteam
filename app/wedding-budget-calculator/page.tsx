import Link from "next/link";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import BudgetCalculator from "@/components/budget-calculator";
import { pageMetadata } from "@/lib/site";
import { SIGNUP_URL } from "@/lib/config";
import { faqSchema, breadcrumbSchema } from "@/lib/structured-data";

/**
 * Public wedding budget calculator.
 *
 * The split comes from lib/budget-template.ts, the same starter budget the app
 * builds on /w/[id]/budget, so what someone sees here is what they get after
 * signing up. If the template changes, re-read the FAQ answers below: they
 * quote its percentages.
 */

export const metadata = pageMetadata({
  path: "/wedding-budget-calculator",
  title: "Wedding Budget Calculator",
  ogTitle: "Free Wedding Budget Calculator — Bridal Team",
  description:
    "Enter your total and guest count to see a wedding budget by category, the cost per guest, and the often-forgotten costs to set money aside for.",
});

const CTA_LABEL = "Start my free budget";

const FAQS = [
  {
    q: "How is the budget split?",
    a: "Venue rental and catering together take 45%, photography and video 12%, flowers and décor 10%, music 8%, attire, hair and makeup 7%, rings 3%, and cake and stationery 2% each. The remaining 11% is left as a buffer for the costs couples tend to forget.",
  },
  {
    q: "Are these percentages a rule?",
    a: "No. They're a starting point. Shift money toward whatever matters most to you, and away from the things your guests won't remember.",
  },
  {
    q: "Why does the guest count matter so much?",
    a: "Catering, bar, rentals, invitations and favors all scale with the number of people. Cutting the list by 20 guests often saves more than trimming any single vendor.",
  },
  {
    q: "What costs do couples forget?",
    a: "Vendor tips, alterations, delivery and setup fees, the marriage license, postage, vendor meals on the day, transportation and wedding insurance are the usual ones. That's what the buffer is for.",
  },
  {
    q: "Is the calculator free?",
    a: "Yes, and nothing you type is saved or sent anywhere. To keep your budget, create a free Bridal Team account and it builds the same starter budget for you to edit, with estimates and amounts paid for every line.",
  },
];

export default function WeddingBudgetCalculatorPage() {
  return (
    <>
      <JsonLd data={faqSchema(FAQS)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Wedding Budget Calculator", path: "/wedding-budget-calculator" },
        ])}
      />

      <PageHero
        eyebrow="Free tool"
        title="Wedding Budget Calculator"
        subtitle="Type in your total and guest count to see where the money goes, what that means per guest, and what to set aside for the costs nobody plans for."
      />

      <section className="mx-auto max-w-3xl px-5 py-16">
        <BudgetCalculator />
        <div className="mt-8 text-center">
          <Link
            href={SIGNUP_URL}
            className="inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            {CTA_LABEL}
          </Link>
          <p className="mt-3 text-xs text-ink-soft/60">
            Free for couples. Your account builds this same budget, ready to edit.
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
        <h2 className="text-2xl font-light uppercase tracking-wide text-ink">Working out the money?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink-soft/80">
          Read{" "}
          <Link href="/guides/how-much-does-a-wedding-cost" className="text-brand-text underline">
            how much a wedding costs
          </Link>
          ,{" "}
          <Link href="/blog/realistic-wedding-budget" className="text-brand-text underline">
            how to build a realistic budget
          </Link>
          ,{" "}
          <Link href="/guides/who-pays-for-the-wedding" className="text-brand-text underline">
            who pays for the wedding
          </Link>{" "}
          and{" "}
          <Link href="/guides/wedding-guest-list" className="text-brand-text underline">
            how to build your guest list
          </Link>
          , or ask the{" "}
          <Link href="/planner" className="text-brand-text underline">
            free AI wedding planner
          </Link>{" "}
          how to split your budget.
        </p>
      </section>
    </>
  );
}
