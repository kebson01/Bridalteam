"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

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
