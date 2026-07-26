import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Simple pricing for couples and vendors. Start free.",
};

const TIERS = [
  {
    name: "Couples",
    price: "Free",
    note: "forever",
    blurb: "The whole AI planning team — every feature, no paywall.",
    features: [
      "Unlimited AI planning assistant",
      "Timelines, checklists & budget",
      "Smart vendor matching",
      "Guest list & community groups",
      "Inspiration & shared mood boards",
      "Invite your partner & wedding party",
    ],
    cta: "Start free",
    href: "/signup",
    highlight: true,
  },
  {
    name: "Vendor Assistance",
    price: "$12",
    note: "/ month",
    blurb: "For vendors who want to grow — AI help plus premium placement.",
    features: [
      "AI assistant for your business",
      "Featured in the vendor directory",
      "Lead inbox from couples",
      "Profile & gallery",
      "Bulk listing tools",
      "Priority support",
    ],
    cta: "For vendors",
    href: "/for-vendors",
    highlight: false,
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Simple pricing"
        title="Free for couples"
        subtitle="Plan your entire wedding with the full AI team — free, forever, no card required. Vendors grow their business with Vendor Assistance for $12/month."
      />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <div className="grid gap-6 sm:grid-cols-2">
          {TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-3xl border p-8 shadow-card ${
                t.highlight
                  ? "border-brand bg-ink text-white"
                  : "border-stone-2 bg-white"
              }`}
            >
              {t.highlight && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  Free forever
                </span>
              )}
              <h3 className={`text-lg font-medium ${t.highlight ? "text-brand-amber" : "text-brand-dark"}`}>
                {t.name}
              </h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-semibold">{t.price}</span>
                <span className={`mb-1 text-sm ${t.highlight ? "text-white/60" : "text-ink-soft/60"}`}>
                  {t.note}
                </span>
              </div>
              <p className={`mt-2 text-sm ${t.highlight ? "text-white/70" : "text-ink-soft/75"}`}>
                {t.blurb}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 text-brand-dark">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                    </span>
                    <span className={t.highlight ? "text-white/85" : "text-ink-soft/85"}>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={t.href}
                className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-semibold transition-transform hover:-translate-y-0.5 ${
                  t.highlight
                    ? "bg-white text-brand-dark"
                    : "bg-gradient-to-r from-brand to-brand-dark text-white"
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
