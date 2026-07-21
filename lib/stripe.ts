import Stripe from "stripe";

/**
 * Stripe client, or null if STRIPE_SECRET_KEY isn't configured yet. Everything
 * billing-related checks for null and degrades gracefully, so the app runs fine
 * before Stripe is connected.
 */
export const stripe: Stripe | null = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/** The Stripe Price ID for the vendor "Featured" subscription. */
export const FEATURED_PRICE_ID = process.env.STRIPE_FEATURED_PRICE_ID ?? "";

export const billingConfigured = () => Boolean(stripe && FEATURED_PRICE_ID);
