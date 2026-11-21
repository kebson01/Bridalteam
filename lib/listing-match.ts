import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Finding the listing we already made for a vendor who is signing up.
 *
 * The vendor campaign emails a listing's public contact address, but vendors
 * often sign up with a different one, so the by-email claim prompt on
 * /onboarding never fires and they build a second listing for the same
 * business. Four did exactly that in November 2026. Matching on the business
 * name catches them before the duplicate exists.
 *
 * A name match is only ever a hint, never a credential: anyone can type any
 * business's name. Claiming still goes through the listing's own inbox (a
 * claim link emailed to its contact address; see sendClaimLinkToListing).
 */

/** "Fire Water Bars", "fire-water bars!" and "FireWaterBars" all become "firewaterbars". */
export function normalizeBusinessName(name: string | null | undefined): string {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** "info@sunrise-photo.com" → "in•••@sunrise-photo.com": enough to recognise, not enough to harvest. */
export function maskEmail(email: string): string {
  const [local, domain] = email.trim().split("@");
  if (!local || !domain) return "the address on file";
  return `${local.slice(0, Math.min(2, local.length))}•••@${domain}`;
}

export interface ListingMatch {
  orgId: string;
  businessName: string;
  category: string | null;
  city: string | null;
  maskedEmail: string;
}

/**
 * An unclaimed listing with the same business name and a contact address to
 * send the claim link to, or null. Needs the service-role client: draft
 * listings and contact addresses aren't readable by the signed-in vendor, and
 * only the masked address leaves this function.
 */
export async function findUnclaimedListing(admin: SupabaseClient, businessName: string): Promise<ListingMatch | null> {
  const key = normalizeBusinessName(businessName);
  if (key.length < 4) return null; // too short to mean anything

  // Characters in order with anything between: a superset of the exact
  // normalized match, narrowed below. Only [a-z0-9] reach the pattern, so
  // there's nothing to escape.
  const pattern = `%${key.split("").join("%")}%`;
  const { data: profiles, error } = await admin
    .from("vendor_profiles")
    .select("org_id, business_name, category, city")
    .ilike("business_name", pattern)
    .limit(50);
  if (error || !profiles?.length) return null;

  const same = profiles.filter((p) => normalizeBusinessName(p.business_name) === key);
  if (!same.length) return null;

  const ids = same.map((p) => p.org_id as string);
  const [{ data: claims }, { data: members }] = await Promise.all([
    admin.from("vendor_claims").select("org_id, contact_email, claimed_at").in("org_id", ids),
    admin.from("org_members").select("org_id").in("org_id", ids),
  ]);
  const owned = new Set((members ?? []).map((m) => m.org_id as string));

  for (const p of same) {
    if (owned.has(p.org_id as string)) continue;
    const claim = (claims ?? []).find((c) => c.org_id === p.org_id && !c.claimed_at && c.contact_email);
    if (!claim) continue;
    return {
      orgId: p.org_id as string,
      businessName: p.business_name as string,
      category: (p.category as string | null) ?? null,
      city: (p.city as string | null) ?? null,
      maskedEmail: maskEmail(claim.contact_email as string),
    };
  }
  return null;
}
