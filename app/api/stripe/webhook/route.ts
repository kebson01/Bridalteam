import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
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
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        if (s.customer && s.subscription) {
          await applyByCustomer(String(s.customer), {
            stripe_subscription_id: String(s.subscription),
            subscription_status: "active",
            plan: "featured",
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
          plan: active ? "featured" : "free",
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await applyByCustomer(String(sub.customer), {
          subscription_status: "canceled",
          plan: "free",
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
