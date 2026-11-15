import Link from "next/link";
import {
  startProCheckout,
  startFeaturedCheckout,
  upgradeToFeatured,
  openBillingPortal,
  cancelSubscription,
  resumeSubscription,
} from "@/app/vendor/billing/actions";
import { normalizePlan, TIERS, type Plan } from "@/lib/tiers";

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
  granted = null,
}: {
  plan: string;
  /**
   * A better plan given free (a promotion or comp), from planGrant() in
   * lib/tiers.ts. null when the vendor's features come from what they pay for.
   */
  granted?: { plan: Plan; source: "comp" | "promotion"; expiresAt: string | null } | null;
  status: string | null;
  proConfigured: boolean;
  featuredConfigured: boolean;
  flash: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  const current = normalizePlan(plan);
  const anyPaidConfigured = proConfigured || featuredConfigured;
  const grantedUntil = granted?.expiresAt
    ? // expiresAt is the instant after the last day, so step back to that day.
      new Date(new Date(granted.expiresAt).getTime() - 1).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "America/New_York",
      })
    : null;

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

      {granted && (
        <div className="mb-5 rounded-xl border border-brand/30 bg-brand-wash px-4 py-3">
          <p className="text-sm font-semibold text-ink">
            You have {TIERS[granted.plan].name} free{grantedUntil ? ` through ${grantedUntil}` : ""} — on us.
          </p>
          <p className="mt-0.5 text-xs text-ink-soft/70">
            All {TIERS[granted.plan].name} features are switched on, with no card needed.
            {grantedUntil
              ? ` After that you go back to the ${TIERS[current].name} plan unless you subscribe.`
              : ""}
          </p>
        </div>
      )}

      {current === "free" ? (
        <div>
          <h2 className="text-lg font-medium text-ink">Grow your business</h2>
          <p className="mt-1 text-sm text-ink-soft/75">
            You&rsquo;re on the Free plan &mdash; your listing stays live at no cost, for as
            long as you like. Upgrade any time for an unlimited gallery, direct inquiries,
            stats and more.
          </p>
          {anyPaidConfigured ? (
            <>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <TierCard
                  name={TIERS.free.name}
                  price={TIERS.free.priceMonthly}
                  blurb={`Your listing, website link and up to ${TIERS.free.entitlements.galleryLimit} photos.`}
                  current
                  currentLabel={granted ? "Your plan after the free period" : undefined}
                />
                <TierCard
                  name={TIERS.pro.name}
                  price={TIERS.pro.priceMonthly}
                  blurb="Unlimited gallery, inquiries and stats."
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
              {/* Auto-renewal disclosure at the point of sale (CA ARL and
                  similar): plan price, monthly interval, renewal terms and how
                  to cancel, stated before the pay button. */}
              <p className="mt-4 text-xs leading-relaxed text-ink-soft/60">
                Staying on Free costs nothing and needs no card. Paid plans are billed monthly and renew automatically until cancelled.
                Cancel anytime from this page — you keep your features through the
                period you&rsquo;ve paid for. By subscribing you agree to our{" "}
                <Link href="/terms" className="font-semibold text-brand-text">
                  Terms
                </Link>
                .
              </p>
            </>
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
  current = false,
  currentLabel = "Current plan",
}: {
  name: string;
  price: number;
  blurb: string;
  action?: () => void | Promise<void>;
  cta?: string;
  disabled?: boolean;
  highlight?: boolean;
  /** The vendor's current plan: shown with a "Current plan" label, no button. */
  current?: boolean;
  currentLabel?: string;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-4 ${
        highlight ? "border-brand" : current ? "border-stone-2 bg-stone-4/40" : "border-stone-2"
      }`}
    >
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold text-ink">{name}</span>
        <span className="text-sm text-ink-soft/70">
          {price === 0 ? (
            <strong className="text-ink">$0</strong>
          ) : (
            <>
              <strong className="text-ink">${price}</strong>/mo
            </>
          )}
        </span>
      </div>
      <p className="mt-1 flex-1 text-xs text-ink-soft/70">{blurb}</p>
      {current ? (
        <p className="mt-3 rounded-full border border-stone-2 bg-white px-4 py-2 text-center text-sm font-semibold text-ink-soft">
          {currentLabel}
        </p>
      ) : disabled || !action ? (
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
