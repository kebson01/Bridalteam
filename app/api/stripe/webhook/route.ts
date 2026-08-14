import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, planForPrice, type PaidPlan } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Format a Stripe minor-unit amount, e.g. 1200/"usd" -> "$12.00". */
function formatAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return "";
  const value = (amount / 100).toFixed(2);
  const cur = (currency ?? "usd").toUpperCase();
  return cur === "USD" ? `$${value}` : `${value} ${cur}`;
}

/**
 * Post-purchase confirmation email for a vendor subscription. Repeats the
 * auto-renewal facts required at point of sale (plan, price, interval, renewal
 * terms, how to cancel) — auto-renewal law wants them in the confirmation too.
 * Best-effort: a send failure must not fail the webhook (Stripe would retry the
 * whole event), and it's skipped when RESEND_API_KEY isn't set.
 */
async function sendSubscriptionConfirmation(session: Stripe.Checkout.Session, plan: PaidPlan) {
  const to = session.customer_details?.email;
  if (!to) return;

  const planLabel = plan === "pro" ? "Vendor — Pro" : "Vendor — Featured";
  const amount = formatAmount(session.amount_total, session.currency);
  const price = amount ? `${amount} / month` : "billed monthly";
  const body = `
    <p>Thanks for subscribing — your listing is now on the <strong>${planLabel}</strong> plan.</p>
    <p style="margin-top:16px;padding:16px;background:#f6f4f1;border-radius:12px;">
      <strong>${planLabel}</strong><br/>
      ${price}<br/>
      Renews automatically every month until cancelled.<br/>
      Cancel anytime in Account &rarr; Billing.
    </p>
    <p style="margin-top:16px;">You can manage or cancel your subscription at any time from your vendor billing settings.</p>`;

  try {
    await sendEmail({
      to,
      subject: "Your Bridal Team vendor subscription",
      html: emailLayout("You're subscribed 🎉", body, {
        label: "Manage billing",
        url: `${SITE_URL}/vendor`,
      }),
    });
  } catch (err) {
    console.error("subscription confirmation email failed:", err);
  }
}

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
          const plan = planForSubscription(sub);
          await applyByCustomer(String(s.customer), {
            stripe_subscription_id: String(s.subscription),
            subscription_status: "active",
            plan,
            cancel_at_period_end: false,
          });
          await sendSubscriptionConfirmation(s, plan);
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
