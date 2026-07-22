import {
  startCheckout,
  openBillingPortal,
  cancelSubscription,
  resumeSubscription,
} from "@/app/vendor/billing/actions";

const FEATURES = [
  "Featured placement — shown first in the directory",
  "A “Featured” badge on your listing",
  "Unlimited photos, videos and audio",
];

/**
 * Vendor billing panel. Server component: the upgrade/manage buttons are plain
 * server-action forms that redirect to Stripe. Degrades to a "coming soon" note
 * when Stripe isn't configured yet.
 */
export default function VendorBilling({
  plan,
  status,
  configured,
  flash,
  cancelAtPeriodEnd = false,
}: {
  plan: string;
  status: string | null;
  configured: boolean;
  flash: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const isFeatured = plan === "featured";

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      {flash === "success" && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          You&rsquo;re Featured — thanks for subscribing!
        </p>
      )}
      {flash === "cancelled" && (
        <p className="mb-4 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft">Checkout cancelled.</p>
      )}
      {flash === "unavailable" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Billing isn&rsquo;t set up yet. Check back soon.
        </p>
      )}
      {flash === "cancel_scheduled" && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Done — your plan won&rsquo;t renew. You keep Featured until the end of this period.
        </p>
      )}
      {flash === "resumed" && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Your subscription will renew as normal — welcome back!
        </p>
      )}

      {isFeatured ? (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold uppercase text-white">Featured</span>
                You&rsquo;re on the Featured plan
              </p>
              <p className="mt-1 text-xs text-ink-soft/60">
                {cancelAtPeriodEnd
                  ? "Set to cancel — you keep Featured until the end of your current period, then it won't renew."
                  : status
                    ? `Subscription ${status}. Renews automatically until you cancel.`
                    : "Renews automatically until you cancel."}
              </p>
            </div>
            {configured && (
              <div className="flex flex-wrap gap-2">
                {cancelAtPeriodEnd ? (
                  <form action={resumeSubscription}>
                    <button type="submit" className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white">
                      Resume subscription
                    </button>
                  </form>
                ) : (
                  <form action={cancelSubscription}>
                    <button type="submit" className="rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft hover:border-brand">
                      Cancel subscription
                    </button>
                  </form>
                )}
                <form action={openBillingPortal}>
                  <button type="submit" className="rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft hover:border-brand">
                    Manage billing
                  </button>
                </form>
              </div>
            )}
          </div>
          <p className="mt-4 border-t border-stone-2 pt-4 text-xs leading-relaxed text-ink-soft/60">
            <strong className="text-ink-soft/80">Cancel anytime.</strong> You keep Featured
            through the period you&rsquo;ve paid for. Renewals aren&rsquo;t refundable, so cancel
            before your renewal date to skip the next charge.
          </p>
        </div>
      ) : (
        <div>
          <h2 className="text-lg font-medium text-ink">Reach more couples with Featured</h2>
          <p className="mt-1 text-sm text-ink-soft/75">
            Your basic listing is free. Upgrade to get seen first and showcase
            everything you do.
          </p>
          <ul className="mt-4 space-y-2">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-ink-soft/85">
                <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brand/15 text-brand-dark">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m20 6-11 11-5-5" />
                  </svg>
                </span>
                {f}
              </li>
            ))}
          </ul>
          {configured ? (
            <form action={startCheckout} className="mt-5">
              <button type="submit" className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5">
                Upgrade to Featured
              </button>
            </form>
          ) : (
            <p className="mt-5 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft/70">
              Paid plans are opening soon.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
