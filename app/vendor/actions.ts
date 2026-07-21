"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

// RLS ("Vendor team edits its profile") enforces that the caller belongs to the
// vendor org, so we update by org_id without an extra permission check.

function str(v: FormDataEntryValue | null, max: number) {
  const s = typeof v === "string" ? v.trim() : "";
  return s ? s.slice(0, max) : null;
}

export type ProfileState = { error: string | null; saved: boolean };

export async function updateVendorProfile(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const orgId = String(formData.get("org_id") ?? "");
  const businessName = str(formData.get("business_name"), 160);
  if (!orgId) return { error: "Missing account.", saved: false };
  if (!businessName) return { error: "A business name is required.", saved: false };

  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("vendor_profiles")
    .update({
      business_name: businessName,
      category: str(formData.get("category"), 80),
      description: str(formData.get("description"), 2000),
      city: str(formData.get("city"), 100),
      region: str(formData.get("region"), 100),
      website: str(formData.get("website"), 200),
      email: str(formData.get("email"), 200),
      phone: str(formData.get("phone"), 40),
    })
    .eq("org_id", orgId);

  if (error) {
    console.error("updateVendorProfile failed:", error.code, error.message);
    return { error: "Couldn't save your profile. Please try again.", saved: false };
  }

  revalidatePath("/vendor");
  return { error: null, saved: true };
}

/** Publish or unpublish the listing (whether it shows in the couples' directory). */
export async function setVendorPublished(orgId: string, published: boolean) {
  if (!orgId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("vendor_profiles")
    .update({ status: published ? "published" : "draft" })
    .eq("org_id", orgId);
  if (error) console.error("setVendorPublished failed:", error.code, error.message);
  revalidatePath("/vendor");
}
