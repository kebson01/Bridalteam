import { NextResponse } from "next/server";
import { readOutreachConfig } from "@/lib/outreach/config";
import { classifyResendEvent, verifyResendWebhook } from "@/lib/outreach/delivery";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Resend's delivery webhook for the vendor claim campaign.
 *
 * In Resend: Webhooks -> Add endpoint -> https://bridalteam.com/api/outreach/webhook,
 * events email.delivered, email.bounced, email.complained (opened/clicked
 * optional), then put its signing secret in RESEND_WEBHOOK_SECRET.
 *
 * The account also sends the site's own transactional mail, so events for
 * messages the campaign didn't send are acknowledged and ignored: an event
 * counts only if its email id is one we recorded in outreach_events.
 *
 * A hard bounce or a spam complaint suppresses the address for good, which is
 * what keeps a bad address from being retried and a complaint from turning
 * into two.
 */
export async function POST(req: Request) {
  const { config } = readOutreachConfig();
  if (!config.webhookSecret) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const raw = await req.text();
  const ok = verifyResendWebhook(
    config.webhookSecret,
    {
      id: req.headers.get("svix-id"),
      timestamp: req.headers.get("svix-timestamp"),
      signature: req.headers.get("svix-signature"),
    },
    raw,
  );
  if (!ok) return NextResponse.json({ error: "bad signature" }, { status: 401 });

  let event: { type?: string; data?: { email_id?: string; bounce?: { type?: string; message?: string } } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad json" }, { status: 400 });
  }

  const outcome = classifyResendEvent(event);
  const messageId = event.data?.email_id;
  if (!outcome || !messageId) return NextResponse.json({ ignored: true });

  const db = supabaseAdmin();
  if (!db) return NextResponse.json({ error: "not configured" }, { status: 503 });

  const { data: sent } = await db
    .from("outreach_events")
    .select("org_id, email")
    .eq("message_id", messageId)
    .in("kind", ["sent_first", "sent_followup"])
    .limit(1)
    .maybeSingle();
  if (!sent) return NextResponse.json({ ignored: true }); // not a campaign email

  await db.from("outreach_events").insert({
    org_id: sent.org_id,
    email: sent.email,
    kind: outcome.kind,
    message_id: messageId,
    detail: event.data?.bounce ? { bounce: event.data.bounce } : null,
  });

  if ("suppress" in outcome && sent.email) {
    const reason = outcome.kind === "bounced" ? "bounced" : "complained";
    await db.from("outreach_suppressions").upsert({ email: sent.email.toLowerCase(), reason }, { onConflict: "email" });
    if (sent.org_id) {
      await db.from("vendor_outreach").update({ status: reason, updated_at: new Date().toISOString() }).eq("org_id", sent.org_id);
    }
  }

  return NextResponse.json({ ok: true });
}
