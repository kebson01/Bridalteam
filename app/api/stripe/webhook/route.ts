import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, planForPrice } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Authenticated by Stripe's signature (not a user session), so
 * it updates the database with the service role. Keeps each org's plan in sync
 * with its subscription: 'featured' while active, back to 'free' when it ends.
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "billing not configured" }, { status: 503 });
  }

  const admin = supabaseAdmin();
  if (!admin) {
    console.error("stripe webhook: SUPABASE_SERVICE_ROLE_KEY not set");
    return NextResponse.json({ error: "server misconfigured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig ?? "", secret);
  } catch (err) {
    console.error("stripe webhook signature failed:", err);
    return NextResponse.json({ error: "bad signature" }, { status: 400 });
  }

  async function applyByCustomer(customerId: string, patch: Record<string, unknown>) {
    await admin!.from("organizations").update(patch).eq("stripe_customer_id", customerId);
    // Keep the vendor's gallery in/out of the public Inspiration feed in step
    // with their plan: Pro/Featured media shows in the feed, Free does not.
    if (typeof patch.plan === "string") {
      const inFeed = patch.plan !== "free";
      const { data: orgs } = await admin!
        .from("organizations")
        .select("id")
        .eq("stripe_customer_id", customerId);
      const ids = (orgs ?? []).map((o) => o.id);
      if (ids.length > 0) {
        await admin!.from("inspiration_images").update({ in_feed: inFeed }).in("vendor_id", ids);
      }
    }
  }

  // The plan a subscription grants, from its price. Falls back to 'featured'
  // (the original single tier) if the price isn't recognised, so a legacy setup
  // keeps working.
  function planForSubscription(sub: Stripe.Subscription): "pro" | "featured" {
    const priceId = sub.items?.data?.[0]?.price?.id;
    return planForPrice(priceId) ?? "featured";
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.customer && s.subscription) {
          const sub = await stripe.subscriptions.retrieve(String(s.subscription));
          await applyByCustomer(String(s.customer), {
            stripe_subscription_id: String(s.subscription),
            subscription_status: "active",
            plan: planForSubscription(sub),
            cancel_at_period_end: false,
          });
        }
        break;
      }
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const active = sub.status === "active" || sub.status === "trialing";
        await applyByCustomer(String(sub.customer), {
          stripe_subscription_id: sub.id,
          subscription_status: sub.status,
          plan: active ? planForSubscription(sub) : "free",
          cancel_at_period_end: sub.cancel_at_period_end,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applyByCustomer(String(sub.customer), {
          subscription_status: "canceled",
          plan: "free",
          cancel_at_period_end: false,
        });
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler error:", err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
