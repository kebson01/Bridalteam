import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";

/**
 * Links in campaign emails.
 *
 * Claim links. vendor_claims stores only the SHA-256 of a claim token, and the
 * tokens minted when the listings were imported were never kept, so the
 * campaign mints its own. It derives each one from OUTREACH_SECRET and the
 * listing's id instead of generating it randomly, for one reason: the
 * follow-up a week later has to carry the same link as the first email (a new
 * random token would replace the stored hash and break the first email's
 * link), and deriving it means the raw token never has to be stored anywhere.
 * The database still holds only the hash, so a database read alone can't
 * produce a working link; it takes the secret too, which lives only in the
 * server's environment, like the service-role key.
 *
 * Unsubscribe links are signed the same way, so nobody can unsubscribe or
 * unlist someone else's listing by editing the URL.
 */

const b64url = (buf: Buffer) => buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const hmac = (secret: string, message: string) => createHmac("sha256", secret).update(message).digest();

/** The claim token for a listing. 43 url-safe characters, same alphabet as create_claimable_listing's. */
export function claimToken(secret: string, orgId: string): string {
  return b64url(hmac(secret, `claim:${orgId}`));
}

/** What vendor_claims.token_hash must hold for `token` to work: hex SHA-256, as the SQL computes it. */
export function tokenHash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function claimUrl(secret: string, orgId: string): string {
  return `${SITE_URL}/claim/${claimToken(secret, orgId)}`;
}

export function unsubscribeSignature(secret: string, orgId: string): string {
  return b64url(hmac(secret, `unsub:${orgId}`));
}

export function verifyUnsubscribe(secret: string, orgId: string, signature: string): boolean {
  if (!secret || !orgId || !signature) return false;
  const expected = Buffer.from(unsubscribeSignature(secret, orgId));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** The page a person opens from the footer link. */
export function unsubscribePageUrl(secret: string, orgId: string): string {
  return `${SITE_URL}/unsubscribe?o=${orgId}&s=${unsubscribeSignature(secret, orgId)}`;
}

/** The RFC 8058 one-click endpoint mail clients POST to from their own "Unsubscribe" button. */
export function unsubscribeOneClickUrl(secret: string, orgId: string): string {
  return `${SITE_URL}/api/outreach/unsubscribe?o=${orgId}&s=${unsubscribeSignature(secret, orgId)}`;
}

/** Constant-time check of the run endpoint's Bearer token. */
export function bearerMatches(header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const given = Buffer.from(header.replace(/^Bearer\s+/i, ""));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
