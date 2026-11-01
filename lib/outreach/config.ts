/**
 * Settings for the automated claim-your-listing email campaign.
 *
 * Everything comes from the environment, so nothing is sent until each piece
 * is deliberately set. A run with any required value missing sends nothing
 * and says which value is missing.
 *
 *   OUTREACH_ENABLED=true         master switch. Off = /api/outreach/run only does dry runs.
 *   OUTREACH_SECRET               long random string. Authorises the daily run
 *                                 (Bearer token) and signs claim and unsubscribe
 *                                 links. Changing it invalidates links already sent.
 *   OUTREACH_FROM                 e.g. "Kebson at Bridal Team <kebson@outreach.bridalteam.com>".
 *                                 Must be on a domain verified in Resend. Use a
 *                                 subdomain, never bridalteam.com itself, so the
 *                                 campaign can't hurt signup and password emails.
 *   OUTREACH_REPLY_TO             where vendor replies land, e.g. vendors@bridalteam.com.
 *   OUTREACH_MAILING_ADDRESS      the physical postal address CAN-SPAM requires in
 *                                 every message. One line.
 *   OUTREACH_SENDER_NAME          first name used to sign the emails (default "The Bridal Team").
 *   OUTREACH_RESEND_API_KEY       optional; falls back to RESEND_API_KEY.
 *   RESEND_WEBHOOK_SECRET         "whsec_..." from the Resend webhook, for bounces and complaints.
 *   OUTREACH_OFFER_PRO=true       optional: offer founding vendors a free year of Pro,
 *                                 and grant it on the first email.
 *   OUTREACH_DAILY_MAX            optional ceiling under the warm-up schedule (default 50).
 *   OUTREACH_ALERT_TO             optional address to email if the campaign pauses itself.
 */

export interface OutreachConfig {
  enabled: boolean;
  secret: string;
  from: string;
  replyTo: string;
  mailingAddress: string;
  senderName: string;
  resendApiKey: string;
  webhookSecret: string | null;
  offerPro: boolean;
  dailyMax: number;
  alertTo: string | null;
}

const env = (k: string) => process.env[k]?.trim() || "";

/** The config, plus the names of required settings that are missing. */
export function readOutreachConfig(): { config: OutreachConfig; missing: string[] } {
  const config: OutreachConfig = {
    enabled: env("OUTREACH_ENABLED") === "true",
    secret: env("OUTREACH_SECRET"),
    from: env("OUTREACH_FROM"),
    replyTo: env("OUTREACH_REPLY_TO"),
    mailingAddress: env("OUTREACH_MAILING_ADDRESS"),
    senderName: env("OUTREACH_SENDER_NAME") || "The Bridal Team",
    resendApiKey: env("OUTREACH_RESEND_API_KEY") || env("RESEND_API_KEY"),
    webhookSecret: env("RESEND_WEBHOOK_SECRET") || null,
    offerPro: env("OUTREACH_OFFER_PRO") === "true",
    dailyMax: Math.max(1, Math.min(200, Number.parseInt(env("OUTREACH_DAILY_MAX") || "50", 10) || 50)),
    alertTo: env("OUTREACH_ALERT_TO") || null,
  };
  const missing: string[] = [];
  if (config.secret.length < 32) missing.push("OUTREACH_SECRET (at least 32 characters)");
  if (!config.from) missing.push("OUTREACH_FROM");
  if (!config.replyTo) missing.push("OUTREACH_REPLY_TO");
  if (!config.mailingAddress) missing.push("OUTREACH_MAILING_ADDRESS");
  if (!config.resendApiKey) missing.push("OUTREACH_RESEND_API_KEY or RESEND_API_KEY");
  return { config, missing };
}
