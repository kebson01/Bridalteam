import Stripe from "stripe";
import { SITE_URL } from "@/lib/site";

export type StripeMode = "live" | "test";

/**
 * Which Stripe mode a secret key belongs to, from its prefix. Covers standard
 * (`sk_`) and restricted (`rk_`) keys. Anything else → null.
 */
export function modeForKey(key: string | null | undefined): StripeMode | null {
  const k = key?.trim() ?? "";
  if (/^(sk|rk)_live_/.test(k)) return "live";
  if (/^(sk|rk)_test_/.test(k)) return "test";
  return null;
}

/**
 * True when this server is the real public site: a production build serving
 * bridalteam.com. Local `next dev`, tests, and previews/staging that set their
 * own NEXT_PUBLIC_SITE_URL are not production, so they may use test keys.
 * (To run a local production build against test keys, set
 * NEXT_PUBLIC_SITE_URL=http://localhost:3000.)
 */
export function isProductionSite(
  nodeEnv: string | undefined = process.env.NODE_ENV,
  siteUrl: string = SITE_URL,
): boolean {
  if (nodeEnv !== "production") return false;
  try {
    const host = new URL(siteUrl).hostname.replace(/^www\./, "");
    return host === "bridalteam.com";
  } catch {
    return false;
  }
}

/**
 * Whether a key may be used here. On the production site only live keys are
 * accepted: a test key there would let anyone "subscribe" with Stripe's
 * 4242 test card and unlock a paid plan for free, while no real money moves.
 */
export function keyAllowed(key: string | null | undefined, production = isProductionSite()): boolean {
  const mode = modeForKey(key);
  if (!mode) return false;
  return production ? mode === "live" : true;
}

const RAW_KEY = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

/** The mode of the configured key, whether or not it was accepted. */
export const STRIPE_KEY_MODE: StripeMode | null = modeForKey(RAW_KEY);

if (RAW_KEY && !keyAllowed(RAW_KEY)) {
  console.error(
    STRIPE_KEY_MODE === "test"
      ? "STRIPE_SECRET_KEY is a TEST key but this is the production site — billing is disabled until a live key (sk_live_/rk_live_) is set."
      : "STRIPE_SECRET_KEY is not a recognised Stripe secret key — billing is disabled.",
  );
}

/**
 * Stripe client, or null if STRIPE_SECRET_KEY isn't configured (or is a test
 * key on the production site). Everything billing-related checks for null and
 * degrades gracefully, so the app runs fine before Stripe is connected.
 */
export const stripe: Stripe | null = RAW_KEY && keyAllowed(RAW_KEY) ? new Stripe(RAW_KEY) : null;

/** Mode of the active client (null when billing is off). */
export const stripeMode: StripeMode | null = stripe ? STRIPE_KEY_MODE : null;

/** Stripe Price IDs for the paid vendor tiers (set these in the environment). */
export const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID?.trim() ?? "";
export const FEATURED_PRICE_ID = process.env.STRIPE_FEATURED_PRICE_ID?.trim() ?? "";

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

export interface StripePriceCheck {
  plan: PaidPlan;
  id: string;
  ok: boolean;
  livemode?: boolean;
  active?: boolean;
  amount?: string;
  error?: string;
}

export interface StripeStatus {
  keyMode: StripeMode | null;
  enabled: boolean;
  production: boolean;
  webhookSecretSet: boolean;
  prices: StripePriceCheck[];
}

/**
 * Live readiness check for the admin dashboard: which mode the key is in, and
 * whether each configured price exists in that same account/mode and is
 * active. A test-mode price ID paired with a live key fails here (Stripe
 * returns "No such price"), which is otherwise only discovered when a vendor
 * clicks Subscribe.
 */
export async function stripeStatus(): Promise<StripeStatus> {
  const prices: StripePriceCheck[] = [];
  for (const [plan, id] of [
    ["pro", PRO_PRICE_ID],
    ["featured", FEATURED_PRICE_ID],
  ] as const) {
    if (!id) {
      prices.push({ plan, id: "", ok: false, error: "not set" });
      continue;
    }
    if (!stripe) {
      prices.push({ plan, id, ok: false, error: "billing disabled" });
      continue;
    }
    try {
      const p = await stripe.prices.retrieve(id);
      const amount =
        p.unit_amount != null
          ? `${(p.unit_amount / 100).toFixed(2)} ${p.currency.toUpperCase()}/${p.recurring?.interval ?? "once"}`
          : undefined;
      const modeMatches = p.livemode === (stripeMode === "live");
      prices.push({
        plan,
        id,
        ok: p.active && modeMatches,
        livemode: p.livemode,
        active: p.active,
        amount,
        error: !p.active ? "price is archived" : !modeMatches ? "price mode doesn't match key" : undefined,
      });
    } catch (err) {
      prices.push({ plan, id, ok: false, error: err instanceof Error ? err.message : "lookup failed" });
    }
  }
  return {
    keyMode: STRIPE_KEY_MODE,
    enabled: Boolean(stripe),
    production: isProductionSite(),
    webhookSecretSet: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
    prices,
  };
}
