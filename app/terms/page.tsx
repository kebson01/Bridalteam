import PageHero from "@/components/page-hero";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/terms",
  title: "Terms of Service",
  description: "The terms for using Bridal Team.",
});

export default function TermsPage() {
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms of Service" />
      <section className="mx-auto max-w-3xl px-5 py-16 text-ink-soft/85">
        <p className="text-sm text-ink-soft/60">Last updated: 2026</p>
        <div className="mt-6 space-y-6 leading-relaxed">
          <div>
            <h2 className="text-lg font-medium text-ink">Using Bridal Team</h2>
            <p className="mt-2">
              Bridal Team helps couples and vendors plan and connect. This
              version is a preview provided &ldquo;as is&rdquo; for demonstration.
              Be kind, plan happily, and don&rsquo;t misuse the service.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">AI guidance</h2>
            <p className="mt-2">
              The AI planner offers helpful suggestions, not professional, legal
              or financial advice. Always confirm important details (like budgets
              and contracts) directly with your vendors.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Subscriptions, cancellation &amp; refunds</h2>
            <p className="mt-2">
              Paid plans (such as the vendor Featured plan) are billed in advance and
              renew automatically for the term you choose until you cancel. You can cancel
              anytime from your account or the billing portal — your plan stays active
              through the end of the current paid period and won&rsquo;t renew afterward.
            </p>
            <p className="mt-2">
              <strong>All payments are non-refundable.</strong> Once a new billing cycle
              begins and your subscription renews, that payment has been processed for the
              upcoming term and is not eligible for a refund, in whole or in part.
              Cancelling, deactivating or closing your account does not create a prorated
              or partial refund for the remaining time in your current period — you keep
              access until it ends. To avoid the next charge, cancel before your renewal
              date.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Your content</h2>
            <p className="mt-2">
              You own the planning content you create. You grant us permission to
              store and process it so we can provide the service to you and your
              team.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-medium text-ink">Contact</h2>
            <p className="mt-2">
              Questions about these terms? Email{" "}
              <a href="mailto:hello@bridalteam.com" className="font-semibold text-brand-dark">
                hello@bridalteam.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
