import { createHmac, timingSafeEqual } from "node:crypto";
import { promises as dns } from "node:dns";
import type { RenderedEmail } from "@/lib/outreach/templates";

/**
 * Talking to the outside world: Resend for sending and its webhooks, and DNS
 * for a cheap "does this domain take mail at all" check before the first send.
 */

export interface SendRequest {
  apiKey: string;
  from: string;
  replyTo: string;
  to: string;
  email: RenderedEmail;
  oneClickUnsubscribeUrl: string;
  /** Same key on a retry = Resend won't send twice (it remembers keys for 24 hours). */
  idempotencyKey: string;
}

/**
 * Why a send failed, which decides what the run does next:
 *  - "setup": Resend refused the request itself (401/403: bad key, unverified
 *    domain). Every other send would fail the same way, so stop for the day
 *    and leave the vendors to be tried again once it's fixed.
 *  - "temporary": rate limit, Resend outage or network error. Stop for the
 *    day; tomorrow's run tries again.
 *  - "address": this message was rejected (another 4xx, e.g. an address
 *    Resend won't accept). Skip that vendor for good and carry on.
 */
export type FailureScope = "setup" | "temporary" | "address";

export type SendResult = { ok: true; messageId: string } | { ok: false; error: string; scope: FailureScope };

export function failureScope(status: number): FailureScope {
  if (status === 401 || status === 403) return "setup";
  if (status === 429 || status >= 500) return "temporary";
  return "address";
}

export async function sendViaResend(r: SendRequest, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  try {
    const res = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${r.apiKey}`,
        "content-type": "application/json",
        "idempotency-key": r.idempotencyKey,
      },
      body: JSON.stringify({
        from: r.from,
        to: [r.to],
        reply_to: r.replyTo,
        subject: r.email.subject,
        text: r.email.text,
        html: r.email.html,
        // RFC 8058: Gmail and Yahoo show their own "Unsubscribe" button for
        // these, and require them from bulk senders.
        headers: {
          "List-Unsubscribe": `<${r.oneClickUnsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
        tags: [{ name: "campaign", value: "vendor_claim" }],
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (res.ok && body.id) return { ok: true, messageId: body.id };
    return {
      ok: false,
      error: `Resend ${res.status}: ${body.message ?? body.name ?? "unknown error"}`.slice(0, 300),
      scope: failureScope(res.status),
    };
  } catch (err) {
    return { ok: false, error: `Resend request failed: ${String(err)}`.slice(0, 300), scope: "temporary" };
  }
}

/**
 * True when the address's domain has mail servers. A domain with none is
 * certain to bounce, and a bounce costs the sending domain reputation, so
 * those are skipped without sending. A DNS error that isn't a clear "no such
 * domain / no records" counts as true: an outage shouldn't mark good
 * addresses invalid.
 */
export async function domainAcceptsMail(email: string, resolveMx: typeof dns.resolveMx = dns.resolveMx): Promise<boolean> {
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain) return false;
  try {
    const records = await resolveMx(domain);
    return records.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    const code = (err as { code?: string }).code;
    return !(code === "ENOTFOUND" || code === "ENODATA" || code === "NXDOMAIN");
  }
}

/**
 * Verifies a Resend webhook. Resend signs with Svix: HMAC-SHA256 over
 * "<svix-id>.<svix-timestamp>.<raw body>" keyed with the base64 part of the
 * "whsec_..." secret, sent as one or more "v1,<base64>" values. Timestamps
 * older or newer than five minutes are rejected so a captured request can't
 * be replayed later.
 */
export function verifyResendWebhook(
  secret: string,
  headers: { id: string | null; timestamp: string | null; signature: string | null },
  rawBody: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  const { id, timestamp, signature } = headers;
  if (!secret || !id || !timestamp || !signature) return false;
  const ts = Number.parseInt(timestamp, 10);
  if (!Number.isFinite(ts) || Math.abs(nowSeconds - ts) > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${rawBody}`).digest();
  return signature
    .split(" ")
    .map((part) => part.split(",")[1])
    .filter(Boolean)
    .some((sig) => {
      const given = Buffer.from(sig, "base64");
      return given.length === expected.length && timingSafeEqual(given, expected);
    });
}

export type WebhookOutcome =
  | { kind: "delivered" | "opened" | "clicked" | "soft_bounced" }
  | { kind: "bounced" | "complained"; suppress: true }
  | null;

/** What a Resend event means for the campaign, or null to ignore it. */
export function classifyResendEvent(event: { type?: string; data?: { bounce?: { type?: string } } }): WebhookOutcome {
  switch (event.type) {
    case "email.delivered":
      return { kind: "delivered" };
    case "email.opened":
      return { kind: "opened" };
    case "email.clicked":
      return { kind: "clicked" };
    case "email.complained":
      return { kind: "complained", suppress: true };
    case "email.bounced": {
      // Only a temporary bounce (full mailbox, greylisting) is spared;
      // anything else, including an unlabelled one, is treated as permanent.
      const t = (event.data?.bounce?.type ?? "").toLowerCase();
      return t === "transient" || t === "temporary" ? { kind: "soft_bounced" } : { kind: "bounced", suppress: true };
    }
    default:
      return null;
  }
}
