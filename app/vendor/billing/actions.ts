"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { stripe, FEATURED_PRICE_ID, billingConfigured } from "@/lib/stripe";
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

/** Starts a Stripe Checkout for the Featured subscription and redirects to it. */
export async function startCheckout() {
  if (!billingConfigured() || !stripe) redirect("/vendor?billing=unavailable");
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
    await ctx.supabase.from("organizations").update({ stripe_customer_id: customerId }).eq("id", ctx.org.id);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: FEATURED_PRICE_ID, quantity: 1 }],
    success_url: `${SITE_URL}/vendor?billing=success`,
    cancel_url: `${SITE_URL}/vendor?billing=cancelled`,
    // The webhook keys off this to find the org.
    subscription_data: { metadata: { org_id: ctx.org.id } },
    metadata: { org_id: ctx.org.id },
  });

  if (!session.url) redirect("/vendor?billing=error");
  redirect(session.url);
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
