"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type VendorReview = {
  id: string;
  author_name: string;
  rating: number;
  body: string | null;
  reviewer_id: string;
  created_at: string;
};

function displayName(user: { email?: string; user_metadata?: { full_name?: string } }): string {
  return (
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "A couple"
  );
}

/** Reviews for a vendor (public). */
export async function listVendorReviews(vendorOrgId: string): Promise<VendorReview[]> {
  if (!vendorOrgId) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("vendor_reviews")
    .select("id, author_name, rating, body, reviewer_id, created_at")
    .eq("vendor_org_id", vendorOrgId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("listVendorReviews failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as VendorReview[];
}

/** Leave or update your review of a vendor (one per person). */
export async function submitVendorReview(input: {
  vendorOrgId: string;
  rating: number;
  body: string;
}): Promise<{ ok: boolean; review?: VendorReview; error?: string }> {
  const rating = Math.round(input.rating);
  if (!input.vendorOrgId) return { ok: false, error: "Something went wrong." };
  if (!(rating >= 1 && rating <= 5)) return { ok: false, error: "Pick a rating from 1 to 5 stars." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in" };

  const { data, error } = await supabase
    .from("vendor_reviews")
    .upsert(
      {
        vendor_org_id: input.vendorOrgId,
        reviewer_id: user.id,
        author_name: displayName(user),
        rating,
        body: input.body?.trim().slice(0, 1000) || null,
      },
      { onConflict: "vendor_org_id,reviewer_id" },
    )
    .select("id, author_name, rating, body, reviewer_id, created_at")
    .single();
  if (error || !data) {
    console.error("submitVendorReview failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't save your review. Please try again." };
  }
  revalidatePath(`/v/${input.vendorOrgId}`);
  return { ok: true, review: data as VendorReview };
}

/** Delete your own review. */
export async function deleteVendorReview(reviewId: string): Promise<{ ok: boolean }> {
  if (!reviewId) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("vendor_reviews").delete().eq("id", reviewId);
  if (error) {
    console.error("deleteVendorReview failed:", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}
