import {
  startProCheckout,
  startFeaturedCheckout,
  upgradeToFeatured,
  openBillingPortal,
  cancelSubscription,
  resumeSubscription,
} from "@/app/vendor/billing/actions";
import { normalizePlan, TIERS } from "@/lib/tiers";

/**
 * Vendor billing panel. Server component: upgrade/manage buttons are plain
 * server-action forms that redirect to Stripe. Shows the current tier (Free /
 * Pro / Featured) and the upgrade paths available from it.
 */
export default function VendorBilling({
  plan,
  status,
  proConfigured,
  featuredConfigured,
  flash,
  cancelAtPeriodEnd = false,
}: {
  plan: string;
  status: string | null;
  proConfigured: boolean;
  featuredConfigured: boolean;
  flash: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const current = normalizePlan(plan);
  const anyPaidConfigured = proConfigured || featuredConfigured;

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      {flash === "success" && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          You&rsquo;re all set — thanks for subscribing!
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
          Done — your plan won&rsquo;t renew. You keep your current features until the period ends.
        </p>
      )}
      {flash === "resumed" && (
        <p className="mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Your subscription will renew as normal — welcome back!
        </p>
      )}

      {current === "free" ? (
        <div>
          <h2 className="text-lg font-medium text-ink">Grow your business</h2>
          <p className="mt-1 text-sm text-ink-soft/75">
            Your basic listing is free. Upgrade for an unlimited gallery, direct inquiries,
            stats and more.
          </p>
          {anyPaidConfigured ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <TierCard
                name={TIERS.pro.name}
                price={TIERS.pro.priceMonthly}
                blurb="Unlimited gallery, inquiries, links and stats."
                action={startProCheckout}
                cta="Upgrade to Pro"
                disabled={!proConfigured}
                highlight
              />
              <TierCard
                name={TIERS.featured.name}
                price={TIERS.featured.priceMonthly}
                blurb="Everything in Pro, plus top placement and a badge."
                action={startFeaturedCheckout}
                cta="Go Featured"
                disabled={!featuredConfigured}
              />
            </div>
          ) : (
            <p className="mt-5 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft/70">
              Paid plans are opening soon.
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold uppercase text-white">
                  {TIERS[current].name}
                </span>
                You&rsquo;re on the {TIERS[current].name} plan
              </p>
              <p className="mt-1 text-xs text-ink-soft/60">
                {cancelAtPeriodEnd
                  ? "Set to cancel — you keep your features until the end of the current period, then it won't renew."
                  : status
                    ? `Subscription ${status}. Renews automatically until you cancel.`
                    : "Renews automatically until you cancel."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {current === "pro" && featuredConfigured && !cancelAtPeriodEnd && (
                <form action={upgradeToFeatured}>
                  <button type="submit" className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white">
                    Upgrade to Featured
                  </button>
                </form>
              )}
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
          </div>
          <p className="mt-4 border-t border-stone-2 pt-4 text-xs leading-relaxed text-ink-soft/60">
            <strong className="text-ink-soft/80">Cancel anytime.</strong> You keep your plan
            through the period you&rsquo;ve paid for.
          </p>
        </div>
      )}
    </div>
  );
}

function TierCard({
  name,
  price,
  blurb,
  action,
  cta,
  disabled,
  highlight = false,
}: {
  name: string;
  price: number;
  blurb: string;
  action: () => void | Promise<void>;
  cta: string;
  disabled?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? "border-brand" : "border-stone-2"}`}>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink">{name}</span>
        <span className="text-sm text-ink-soft/70">
          <strong className="text-ink">${price}</strong>/mo
        </span>
      </div>
      <p className="mt-1 text-xs text-ink-soft/70">{blurb}</p>
      {disabled ? (
        <p className="mt-3 rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/60">Opening soon</p>
      ) : (
        <form action={action} className="mt-3">
          <button
            type="submit"
            className={`w-full rounded-full px-4 py-2 text-sm font-semibold ${
              highlight
                ? "bg-gradient-to-r from-brand to-brand-dark text-white"
                : "border border-stone-2 text-ink-soft hover:border-brand"
            }`}
          >
            {cta}
          </button>
        </form>
      )}
    </div>
  );
}
