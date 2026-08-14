import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import { TIERS } from "@/lib/tiers";
import { SIGNUP_URL } from "@/lib/config";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Free for couples. Vendors grow with Pro and Featured plans.",
};

type VendorTier = {
  name: string;
  price: string;
  note: string;
  blurb: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const VENDOR_TIERS: VendorTier[] = [
  {
    name: TIERS.free.name,
    price: "Free",
    note: "forever",
    blurb: "Claim your listing and get discovered.",
    features: [
      "Claimed vendor profile",
      `Gallery up to ${TIERS.free.entitlements.galleryLimit} photos`,
      "Listed in the vendor directory",
    ],
    cta: "List your business",
  },
  {
    name: TIERS.pro.name,
    price: `$${TIERS.pro.priceMonthly}`,
    note: "/ month",
    blurb: "Everything you need to win more couples.",
    features: [
      "Everything in Free",
      "Unlimited gallery",
      "Post to Inspiration",
      "Link to your website",
      "Receive inquiries directly",
      "View & click stats",
    ],
    cta: "Start Pro",
    highlight: true,
  },
  {
    name: TIERS.featured.name,
    price: `$${TIERS.featured.priceMonthly}`,
    note: "/ month",
    blurb: "Rise to the top of your category.",
    features: [
      "Everything in Pro",
      "Top-of-category placement in your area",
      "Homepage & Inspiration boosts",
      "“Featured” badge on your listing",
      "Priority in couple recommendations",
    ],
    cta: "Go Featured",
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHero
        eyebrow="Simple pricing"
        title="Free for couples"
        subtitle="Plan your entire wedding with the full AI team — free, forever, no card required. Vendors grow their business with Pro and Featured plans."
      />

      {/* Couples */}
      <section className="mx-auto max-w-3xl px-5 pt-14">
        <div className="rounded-3xl border border-brand bg-ink p-8 text-white shadow-card">
          <span className="mb-3 inline-flex w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
            Free forever
          </span>
          <h2 className="text-lg font-medium text-brand-amber">Couples</h2>
          <div className="mt-3 flex items-end gap-1">
            <span className="text-4xl font-semibold">Free</span>
            <span className="mb-1 text-sm text-white/60">forever</span>
          </div>
          <p className="mt-2 text-sm text-white/70">
            The whole AI planning team — every feature, no paywall.
          </p>
          <Link
            href={SIGNUP_URL}
            className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-semibold text-brand-dark"
          >
            Start free
          </Link>
        </div>
      </section>

      {/* Vendors */}
      <section className="mx-auto max-w-5xl px-5 py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-light uppercase tracking-wide text-ink">For vendors</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft/75">
            Start free, upgrade when you&rsquo;re ready to grow. Cancel anytime.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {VENDOR_TIERS.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col rounded-3xl border p-8 shadow-card ${
                t.highlight ? "border-brand ring-1 ring-brand" : "border-stone-2 bg-white"
              }`}
            >
              {t.highlight && (
                <span className="mb-3 inline-flex w-fit rounded-full bg-brand px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-medium text-brand-dark">{t.name}</h3>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-semibold text-ink">{t.price}</span>
                <span className="mb-1 text-sm text-ink-soft/60">{t.note}</span>
              </div>
              <p className="mt-2 text-sm text-ink-soft/75">{t.blurb}</p>
              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 text-brand-dark">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m20 6-11 11-5-5" />
                      </svg>
                    </span>
                    <span className="text-ink-soft/85">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/for-vendors"
                className="mt-8 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-center text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
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
