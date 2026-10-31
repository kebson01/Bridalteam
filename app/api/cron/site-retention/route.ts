import { timingSafeEqual } from "node:crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { reminderEmail, type RetentionNotice } from "@/lib/custom-site/retention-email";

export const dynamic = "force-dynamic";

/**
 * Daily guest-website clean-up, called by .github/workflows/site-retention.yml
 * with `Authorization: Bearer $CRON_SECRET`.
 *
 * public.run_site_retention() does the work (trim history 30 days after the
 * wedding, take sites down 6 months after it, hold their addresses 30 days)
 * and returns who to remind; this sends those reminders. Safe to call more
 * than once a day: every step is idempotent and each reminder is sent once.
 */

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32) return false;
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response("Not found", { status: 404 });

  const admin = supabaseAdmin();
  if (!admin) return Response.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 503 });

  const { data, error } = await admin.rpc("run_site_retention");
  if (error) {
    console.error("run_site_retention failed:", error.code, error.message);
    return Response.json({ error: "retention failed" }, { status: 500 });
  }
  const result = data as { trimmed: number; ended: number; notices: RetentionNotice[] };

  let sent = 0;
  let failed = 0;
  for (const n of result.notices ?? []) {
    const { subject, html } = reminderEmail(n);
    for (const to of n.emails ?? []) {
      const r = await sendEmail({ to, subject, html });
      if (r.sent) sent++;
      else failed++;
    }
  }

  const summary = { trimmed: result.trimmed, ended: result.ended, reminders: (result.notices ?? []).length, emails_sent: sent, emails_failed: failed };
  console.log("site retention:", JSON.stringify(summary));
  return Response.json(summary);
}
