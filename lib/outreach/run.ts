import type { SupabaseClient } from "@supabase/supabase-js";
import type { OutreachConfig } from "@/lib/outreach/config";
import { claimToken, claimUrl, tokenHash, unsubscribeOneClickUrl, unsubscribePageUrl } from "@/lib/outreach/tokens";
import { firstEmail, followUpEmail, type VendorForEmail } from "@/lib/outreach/templates";
import { planToday, pauseReason, warmupCap, type Candidate, type FollowUpDue } from "@/lib/outreach/plan";
import { domainAcceptsMail, sendViaResend, type SendResult } from "@/lib/outreach/delivery";
import { sendEmail } from "@/lib/email";

/**
 * One day of the campaign. Called by /api/outreach/run, which the scheduled
 * GitHub Actions workflow hits every weekday morning.
 *
 * Order of work:
 *  1. Stop if bounces or complaints say something is wrong (plan.ts pauseReason).
 *  2. Mark listings claimed since the last run, so they get no follow-up.
 *  3. Plan today's sends under the warm-up limit.
 *  4. For each: check the domain takes mail (first emails only), make sure the
 *     listing's claim link works for 60 more days, send, record.
 *
 * A dry run does steps 1-3 and returns the plan without sending or writing.
 */

const DAY_MS = 86_400_000;
const CLAIM_WINDOW_DAYS = 60;

export interface RunDeps {
  db: SupabaseClient;
  config: OutreachConfig;
  now?: Date;
  send?: typeof sendViaResend;
  acceptsMail?: (email: string) => Promise<boolean>;
}

export interface RunReport {
  dryRun: boolean;
  paused: string | null;
  cap: number;
  sendDaysSoFar: number;
  newlyClaimed: number;
  planned: { followUps: number; firsts: number };
  sent: { followUps: number; firsts: number };
  skippedInvalid: string[];
  failures: { orgId: string; error: string }[];
  remaining: number;
  preview: { orgId: string; business: string; email: string; kind: "first" | "followup" }[];
}

/** PostgREST returns at most 1,000 rows per request; page through everything. */
async function all<T>(query: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await query(from, from + 999);
    if (error) throw new Error(`outreach query failed: ${JSON.stringify(error)}`);
    out.push(...(data ?? []));
    if (!data || data.length < 1000) return out;
  }
}

type ClaimRow = { id: string; org_id: string; contact_email: string | null; expires_at: string; claimed_at: string | null };
type ProfileRow = { org_id: string; business_name: string; category: string | null; city: string | null; status: string };
type OutreachRow = { org_id: string; email: string; status: string; first_sent_at: string | null };

export async function runOutreach({ db, config, now = new Date(), send = sendViaResend, acceptsMail = domainAcceptsMail }: RunDeps, dryRun: boolean): Promise<RunReport> {
  const report: RunReport = {
    dryRun,
    paused: null,
    cap: 0,
    sendDaysSoFar: 0,
    newlyClaimed: 0,
    planned: { followUps: 0, firsts: 0 },
    sent: { followUps: 0, firsts: 0 },
    skippedInvalid: [],
    failures: [],
    remaining: 0,
    preview: [],
  };

  const [claims, profiles, members, outreach, suppressions, events] = await Promise.all([
    all<ClaimRow>((a, b) => db.from("vendor_claims").select("id, org_id, contact_email, expires_at, claimed_at").order("id").range(a, b)),
    all<ProfileRow>((a, b) => db.from("vendor_profiles").select("org_id, business_name, category, city, status").order("org_id").range(a, b)),
    all<{ org_id: string }>((a, b) => db.from("org_members").select("org_id").order("org_id").range(a, b)),
    all<OutreachRow>((a, b) => db.from("vendor_outreach").select("org_id, email, status, first_sent_at").order("org_id").range(a, b)),
    all<{ email: string }>((a, b) => db.from("outreach_suppressions").select("email").order("email").range(a, b)),
    all<{ kind: string; created_at: string }>((a, b) =>
      db.from("outreach_events").select("kind, created_at").in("kind", ["sent_first", "sent_followup", "bounced", "complained", "resumed"]).order("id").range(a, b),
    ),
  ]);

  // 1. Health check, counted from the last manual resume (if any), so that
  // once a person has fixed the cause the old numbers don't keep it paused.
  const lastResume = events.reduce((t, e) => (e.kind === "resumed" && e.created_at > t ? e.created_at : t), "");
  const recent = events.filter((e) => e.created_at > lastResume);
  report.paused = pauseReason({
    sent: recent.filter((e) => e.kind === "sent_first" || e.kind === "sent_followup").length,
    bounced: recent.filter((e) => e.kind === "bounced").length,
    complained: recent.filter((e) => e.kind === "complained").length,
  });

  // 2. Claimed since last run.
  const claimed = new Set(members.map((m) => m.org_id));
  const justClaimed = outreach.filter((o) => (o.status === "sent" || o.status === "followed_up") && claimed.has(o.org_id));
  report.newlyClaimed = justClaimed.length;
  if (!dryRun && justClaimed.length) {
    await db.from("vendor_outreach").update({ status: "claimed", updated_at: now.toISOString() }).in("org_id", justClaimed.map((o) => o.org_id));
  }

  // 3. Plan.
  const sendDays = new Set(
    events.filter((e) => e.kind === "sent_first" || e.kind === "sent_followup").map((e) => e.created_at.slice(0, 10)),
  );
  const today = now.toISOString().slice(0, 10);
  sendDays.delete(today); // today's partial run (a retry) doesn't advance the warm-up
  report.sendDaysSoFar = sendDays.size;
  const sentToday = events.filter((e) => (e.kind === "sent_first" || e.kind === "sent_followup") && e.created_at.startsWith(today)).length;
  report.cap = Math.max(0, warmupCap(sendDays.size, config.dailyMax) - sentToday);

  const profileByOrg = new Map(profiles.map((p) => [p.org_id, p]));
  const contacted = new Set(outreach.map((o) => o.org_id));
  const blocked = new Set([...suppressions.map((s) => s.email.toLowerCase()), ...outreach.map((o) => o.email.toLowerCase())]);

  const candidates: Candidate[] = [];
  const claimByOrg = new Map<string, ClaimRow>();
  for (const c of claims) {
    claimByOrg.set(c.org_id, c);
    const p = profileByOrg.get(c.org_id);
    if (!p || !c.contact_email || c.claimed_at || claimed.has(c.org_id) || contacted.has(c.org_id)) continue;
    candidates.push({
      orgId: c.org_id,
      email: c.contact_email.trim(),
      businessName: p.business_name,
      category: p.category,
      city: p.city,
      published: p.status === "published",
    });
  }

  const followUps: FollowUpDue[] = outreach
    .filter((o) => o.status === "sent" && o.first_sent_at && !claimed.has(o.org_id))
    .map((o) => ({ orgId: o.org_id, email: o.email, firstSentAt: o.first_sent_at! }));

  // A follow-up goes to an address we already emailed, so only suppressions block it.
  const suppressed = new Set(suppressions.map((s) => s.email.toLowerCase()));
  const { followUps: due, firsts } = planToday({ candidates, followUps, blocked, suppressed, cap: report.cap, now });

  report.planned = { followUps: due.length, firsts: firsts.length };
  report.remaining = Math.max(0, new Set(candidates.map((c) => c.email.toLowerCase())).size - firsts.length);
  report.preview = [
    ...due.map((f) => ({ orgId: f.orgId, business: profileByOrg.get(f.orgId)?.business_name ?? "?", email: f.email, kind: "followup" as const })),
    ...firsts.map((c) => ({ orgId: c.orgId, business: c.businessName, email: c.email, kind: "first" as const })),
  ];

  if (dryRun || report.paused) {
    if (report.paused && !dryRun) await alertPaused(db, config, report.paused, now);
    return report;
  }

  // 4. Send.
  const settings = { senderName: config.senderName, mailingAddress: config.mailingAddress, offerPro: config.offerPro };
  const deliver = async (v: VendorForEmail, kind: "first" | "followup"): Promise<SendResult> => {
    const links = { claimUrl: claimUrl(config.secret, v.orgId), unsubscribeUrl: unsubscribePageUrl(config.secret, v.orgId) };
    const email = kind === "first" ? firstEmail(v, links, settings) : followUpEmail(v, links, settings);
    return send({
      apiKey: config.resendApiKey,
      from: config.from,
      replyTo: config.replyTo,
      to: v.email,
      email,
      oneClickUnsubscribeUrl: unsubscribeOneClickUrl(config.secret, v.orgId),
      idempotencyKey: `vendor-claim-${kind}-${v.orgId}`,
    });
  };

  for (const f of due) {
    const p = profileByOrg.get(f.orgId);
    if (!p) continue;
    const v: VendorForEmail = { orgId: f.orgId, email: f.email, businessName: p.business_name, category: p.category, city: p.city, published: p.status === "published" };
    // Same link as the first email: it opened a 60-day window a week ago.
    const result = await deliver(v, "followup");
    if (result.ok) {
      report.sent.followUps++;
      await db.from("vendor_outreach").update({ status: "followed_up", followup_sent_at: now.toISOString(), last_message_id: result.messageId, updated_at: now.toISOString() }).eq("org_id", f.orgId);
      await db.from("outreach_events").insert({ org_id: f.orgId, email: f.email, kind: "sent_followup", message_id: result.messageId });
    } else {
      report.failures.push({ orgId: f.orgId, error: result.error });
      await db.from("outreach_events").insert({ org_id: f.orgId, email: f.email, kind: "send_failed", detail: { error: result.error, kind: "followup" } });
    }
  }

  for (const c of firsts) {
    if (!(await acceptsMail(c.email))) {
      report.skippedInvalid.push(c.email);
      await db.from("vendor_outreach").insert({ org_id: c.orgId, email: c.email, status: "invalid", detail: "Domain has no mail servers (MX)", updated_at: now.toISOString() });
      await db.from("outreach_events").insert({ org_id: c.orgId, email: c.email, kind: "invalid_address" });
      continue;
    }

    // Make the derived claim link the listing's working link, valid for 60
    // days from today (never shortening a longer window).
    const claim = claimByOrg.get(c.orgId)!;
    const windowEnd = new Date(Math.max(new Date(claim.expires_at).getTime(), now.getTime() + CLAIM_WINDOW_DAYS * DAY_MS));
    const { error: claimErr } = await db
      .from("vendor_claims")
      .update({ token_hash: tokenHash(claimToken(config.secret, c.orgId)), expires_at: windowEnd.toISOString() })
      .eq("id", claim.id)
      .is("claimed_at", null);
    if (claimErr) {
      report.failures.push({ orgId: c.orgId, error: `claim link: ${claimErr.message}` });
      continue;
    }

    if (config.offerPro) {
      // The founding-vendor offer: Pro for a year from the first email.
      await db
        .from("organizations")
        .update({ comp_plan: "pro", comp_expires_at: new Date(now.getTime() + 365 * DAY_MS).toISOString(), comp_note: "Founding vendor (email campaign)" })
        .eq("id", c.orgId)
        .is("comp_plan", null);
    }

    const result = await deliver(c, "first");
    if (result.ok) {
      report.sent.firsts++;
      await db.from("vendor_outreach").insert({ org_id: c.orgId, email: c.email, status: "sent", first_sent_at: now.toISOString(), last_message_id: result.messageId, updated_at: now.toISOString() });
      await db.from("outreach_events").insert({ org_id: c.orgId, email: c.email, kind: "sent_first", message_id: result.messageId });
    } else {
      report.failures.push({ orgId: c.orgId, error: result.error });
      await db.from("outreach_events").insert({ org_id: c.orgId, email: c.email, kind: "send_failed", detail: { error: result.error, kind: "first" } });
      // A rate limit or outage: stop for today rather than burn through the list.
      if (result.retryable) break;
    }
  }

  return report;
}

/** Emails OUTREACH_ALERT_TO once per day while the campaign is paused. */
async function alertPaused(db: SupabaseClient, config: OutreachConfig, reason: string, now: Date) {
  const today = now.toISOString().slice(0, 10);
  const { count } = await db.from("outreach_events").select("id", { count: "exact", head: true }).eq("kind", "paused").gte("created_at", `${today}T00:00:00Z`);
  if ((count ?? 0) > 0) return;
  await db.from("outreach_events").insert({ kind: "paused", detail: { reason } });
  if (config.alertTo) {
    await sendEmail({
      to: config.alertTo,
      subject: "Bridal Team vendor emails paused",
      html: `<p>The vendor claim campaign stopped itself and sent nothing today.</p><p>${reason.replace(/</g, "&lt;")}</p><p>It stays paused until you resume it (see VENDOR-OUTREACH.md, \"Automated email campaign\").</p>`,
    });
  }
}
