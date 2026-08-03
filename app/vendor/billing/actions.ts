"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe, priceForPlan, billingConfigured, type PaidPlan } from "@/lib/stripe";
import { SITE_URL } from "@/lib/site";

/** Resolves the signed-in user's vendor org, or null. */
async function vendorOrg() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("org_members")
    .select("organizations(id, type, name, stripe_customer_id, stripe_subscription_id)")
    .limit(1);
  const org = data?.[0]?.organizations as unknown as
    | {
        id: string;
        type: string;
        name: string;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
      }
    | undefined;
  if (!org || org.type !== "vendor") return null;
  return { org, userId: user.id, email: user.email ?? undefined, supabase };
}

/** Starts a Stripe Checkout for a paid tier and redirects to it. */
async function startCheckoutFor(tier: PaidPlan) {
  if (!billingConfigured() || !stripe) redirect("/vendor?billing=unavailable");
  const priceId = priceForPlan(tier);
  if (!priceId) redirect("/vendor?billing=unavailable");
  const ctx = await vendorOrg();
  if (!ctx) redirect("/vendor");

  // Reuse or create the Stripe customer for this org.
  let customerId = ctx.org.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.email,
      name: ctx.org.name,
      metadata: { org_id: ctx.org.id },
    });
    customerId = customer.id;
    // Persist the Stripe customer id with the service role, not the user's client.
    // This lets us revoke UPDATE(stripe_customer_id) from `authenticated` (see
    // security/2026-08-phase2-lock-stripe-customer-id.sql), closing the last way a
    // signed-in vendor could tamper with their org's billing identifiers. The write
    // is still scoped to the caller's own org id (resolved from their session above).
    const admin = supabaseAdmin();
    if (!admin) redirect("/vendor?billing=unavailable");
    const { error } = await admin
      .from("organizations")
      .update({ stripe_customer_id: customerId })
      .eq("id", ctx.org.id);
    if (error) redirect("/vendor?billing=error");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${SITE_URL}/vendor?billing=success`,
    cancel_url: `${SITE_URL}/vendor?billing=cancelled`,
    // The webhook keys off this to find the org (and the price to set the plan).
    subscription_data: { metadata: { org_id: ctx.org.id } },
    metadata: { org_id: ctx.org.id },
  });

  if (!session.url) redirect("/vendor?billing=error");
  redirect(session.url);
}

/** Form actions — one per paid tier (server actions take no useful arg here). */
export async function startProCheckout() {
  await startCheckoutFor("pro");
}
export async function startFeaturedCheckout() {
  await startCheckoutFor("featured");
}

/**
 * Upgrade an existing Pro subscription to Featured in place — swaps the price on
 * the current subscription (prorated) rather than opening a second one. The
 * webhook then syncs plan=featured.
 */
export async function upgradeToFeatured() {
  if (!stripe) redirect("/vendor?billing=unavailable");
  const featuredPrice = priceForPlan("featured");
  if (!featuredPrice) redirect("/vendor?billing=unavailable");
  const ctx = await vendorOrg();
  if (!ctx?.org.stripe_subscription_id) {
    // No existing subscription — fall back to a fresh Featured checkout.
    await startCheckoutFor("featured");
    return;
  }

  const sub = await stripe.subscriptions.retrieve(ctx.org.stripe_subscription_id);
  const itemId = sub.items.data[0]?.id;
  if (!itemId) redirect("/vendor?billing=error");

  await stripe.subscriptions.update(ctx.org.stripe_subscription_id, {
    items: [{ id: itemId, price: featuredPrice }],
    proration_behavior: "create_prorations",
  });
  redirect("/vendor?billing=success");
}

/**
 * Cancels the Featured subscription at the end of the current paid period. The
 * vendor keeps Featured until then and is not charged again. Per our refund
 * policy, the current period is non-refundable — so we cancel at period end
 * rather than immediately, letting them use what they've paid for.
 */
export async function cancelSubscription() {
  if (!billingConfigured() || !stripe) redirect("/vendor?billing=unavailable");
  const ctx = await vendorOrg();
  if (!ctx?.org.stripe_subscription_id) redirect("/vendor");

  await stripe.subscriptions.update(ctx.org.stripe_subscription_id, {
    cancel_at_period_end: true,
  });
  // Optimistic; the webhook confirms it too.
  await ctx.supabase
    .from("organizations")
    .update({ cancel_at_period_end: true })
    .eq("id", ctx.org.id);

  redirect("/vendor?billing=cancel_scheduled");
}

/** Undo a scheduled cancellation — the subscription renews normally again. */
export async function resumeSubscription() {
  if (!billingConfigured() || !stripe) redirect("/vendor?billing=unavailable");
  const ctx = await vendorOrg();
  if (!ctx?.org.stripe_subscription_id) redirect("/vendor");

  await stripe.subscriptions.update(ctx.org.stripe_subscription_id, {
    cancel_at_period_end: false,
  });
  await ctx.supabase
    .from("organizations")
    .update({ cancel_at_period_end: false })
    .eq("id", ctx.org.id);

  redirect("/vendor?billing=resumed");
}

/** Opens the Stripe billing portal so the vendor can manage/cancel. */
export async function openBillingPortal() {
  if (!billingConfigured() || !stripe) redirect("/vendor?billing=unavailable");
  const ctx = await vendorOrg();
  if (!ctx?.org.stripe_customer_id) redirect("/vendor");

  const session = await stripe.billingPortal.sessions.create({
    customer: ctx.org.stripe_customer_id,
    return_url: `${SITE_URL}/vendor`,
  });
  redirect(session.url);
}
