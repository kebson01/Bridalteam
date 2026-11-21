"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { maskEmail } from "@/lib/listing-match";
import { readOutreachConfig } from "@/lib/outreach/config";
import { claimToken, claimUrl, tokenHash } from "@/lib/outreach/tokens";

export type ClaimableListing = {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
};

/**
 * Listings this account may claim, because someone read this email address out
 * on a phone call and it was attached to their listing.
 *
 * Returns nothing unless the caller's email is *confirmed* — that check lives
 * in claimable_listings_for_me() and is the whole security model, so it is
 * deliberately not duplicated (or weakened) here. See
 * supabase/migrations/20261006210000_claim_listing_by_email.sql.
 */
export async function listClaimableForMe(): Promise<ClaimableListing[]> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("claimable_listings_for_me");
  if (error) {
    // Never block onboarding on this: the worst case is a vendor fills the form
    // and we merge it by hand, which is far better than a dead signup.
    console.error("claimable_listings_for_me failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as ClaimableListing[];
}

export type ClaimState = { error: string | null };

/** Claims one, then lands them on their vendor account. */
export async function claimListingByEmail(
  _prev: ClaimState,
  formData: FormData,
): Promise<ClaimState> {
  const orgId = String(formData.get("org_id") ?? "");
  if (!orgId) return { error: "Missing listing." };

  const supabase = await supabaseServer();
  const { error } = await supabase.rpc("claim_listing_by_email", { p_org_id: orgId });

  if (error) {
    console.error("claim_listing_by_email failed:", error.code, error.message);
    // The function's own messages are written for the vendor ("already
    // claimed", "confirm your email first"), so they are surfaced rather than
    // replaced with something vaguer.
    return { error: error.message || "We couldn't claim that listing." };
  }

  redirect("/vendor");
}

export type ClaimLinkState = { error: string | null; sentTo: string | null };

const DAY_MS = 86_400_000;
/** A link sent from here works for this long (never shortening a longer window). */
const CLAIM_LINK_DAYS = 30;

/**
 * Emails a claim link for a listing to that listing's own contact address.
 *
 * For a vendor who signed up with a different address than the one on their
 * listing (see lib/listing-match.ts). The inbox is still the credential: the
 * link goes only to the address already on the listing, never to the person
 * asking, so asking for someone else's listing just sends its owner an email
 * they can ignore. Limited to once a day per listing, and never to an address
 * that unsubscribed from our emails.
 */
export async function sendClaimLinkToListing(
  _prev: ClaimLinkState,
  formData: FormData,
): Promise<ClaimLinkState> {
  const orgId = String(formData.get("org_id") ?? "");
  if (!orgId) return { error: "Missing listing.", sentTo: null };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first.", sentTo: null };

  const admin = supabaseAdmin();
  const { config } = readOutreachConfig();
  if (!admin || config.secret.length < 32) {
    return { error: "We can't send claim links right now. Please contact us and we'll sort it out.", sentTo: null };
  }

  const [{ data: claim }, { count: members }] = await Promise.all([
    admin.from("vendor_claims").select("id, contact_email, claimed_at, expires_at").eq("org_id", orgId).is("claimed_at", null).not("contact_email", "is", null).limit(1).maybeSingle(),
    admin.from("org_members").select("org_id", { count: "exact", head: true }).eq("org_id", orgId),
  ]);
  if (!claim || members) return { error: "That listing has already been claimed.", sentTo: null };

  const email = String(claim.contact_email).trim().toLowerCase();
  const sentTo = maskEmail(email);

  const { count: suppressed } = await admin.from("outreach_suppressions").select("email", { count: "exact", head: true }).eq("email", email);
  if (suppressed) {
    return { error: `${sentTo} has opted out of our emails, so we can't send the link there. Contact us and we'll help you claim it.`, sentTo: null };
  }

  const since = new Date(Date.now() - DAY_MS).toISOString();
  const { count: recent } = await admin.from("outreach_events").select("id", { count: "exact", head: true }).eq("org_id", orgId).eq("kind", "claim_link_sent").gte("created_at", since);
  if (recent) return { error: null, sentTo }; // already on its way; don't send it twice in a day

  const now = Date.now();
  const expiresAt = new Date(Math.max(new Date(claim.expires_at as string).getTime(), now + CLAIM_LINK_DAYS * DAY_MS)).toISOString();
  const { error: claimErr } = await admin
    .from("vendor_claims")
    .update({ token_hash: tokenHash(claimToken(config.secret, orgId)), expires_at: expiresAt })
    .eq("id", claim.id)
    .is("claimed_at", null);
  if (claimErr) {
    console.error("sendClaimLinkToListing: claim update failed:", claimErr.code, claimErr.message);
    return { error: "We couldn't prepare the claim link. Please try again.", sentTo: null };
  }

  const { data: profile } = await admin.from("vendor_profiles").select("business_name").eq("org_id", orgId).maybeSingle();
  const name = (profile?.business_name as string | undefined) ?? "your business";
  const url = claimUrl(config.secret, orgId);
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const result = await sendEmail({
    to: email,
    subject: `Your link to claim ${name} on Bridal Team`,
    html:
      `<p>Someone setting up a vendor account on Bridal Team asked for the link to claim <strong>${esc(name)}</strong>'s page. ` +
      `It comes to this address because it's the contact address on the listing.</p>` +
      `<p><a href="${esc(url)}">Claim ${esc(name)}'s page</a></p>` +
      `<p>Open it while signed in to the account you just created. The link works for ${CLAIM_LINK_DAYS} days.</p>` +
      `<p>If this wasn't you, you can ignore this email; nothing changes unless the link is used.</p>`,
  });
  if (!result.sent) return { error: "We couldn't send the email just now. Please try again in a few minutes.", sentTo: null };

  await admin.from("outreach_events").insert({ org_id: orgId, email, kind: "claim_link_sent", detail: { requested_by: user.id } });
  return { error: null, sentTo };
}
