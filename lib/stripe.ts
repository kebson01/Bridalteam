import Stripe from "stripe";

/**
 * Stripe client, or null if STRIPE_SECRET_KEY isn't configured yet. Everything
 * billing-related checks for null and degrades gracefully, so the app runs fine
 * before Stripe is connected.
 */
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** Stripe Price IDs for the paid vendor tiers (set these in the environment). */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? "";
export const FEATURED_PRICE_ID = process.env.STRIPE_FEATURED_PRICE_ID ?? "";

export type PaidPlan = "pro" | "featured";

/** The Stripe Price ID to charge for a given paid plan. */
export function priceForPlan(plan: PaidPlan): string {
  return plan === "pro" ? PRO_PRICE_ID : FEATURED_PRICE_ID;
}

/** Map a Stripe Price ID back to our plan. Unknown/empty → null. */
export function planForPrice(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null;
  if (PRO_PRICE_ID && priceId === PRO_PRICE_ID) return "pro";
  if (FEATURED_PRICE_ID && priceId === FEATURED_PRICE_ID) return "featured";
  return null;
}

export const proConfigured = () => Boolean(stripe && PRO_PRICE_ID);
export const featuredConfigured = () => Boolean(stripe && FEATURED_PRICE_ID);

/** True if at least one paid tier can be checked out. */
export const billingConfigured = () => proConfigured() || featuredConfigured();
