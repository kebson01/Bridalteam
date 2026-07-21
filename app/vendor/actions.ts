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

const MEDIA_TYPES = new Set(["photo", "video", "audio"]);

export type MediaState = { error: string | null; added: boolean };

/**
 * Adds a piece of media to the inspiration gallery, attributed to this vendor.
 * Video/audio are links (YouTube/Vimeo/SoundCloud/direct) — kept off Storage;
 * photos are an image URL (file upload lands here too, later). RLS ("Vendors add
 * their media") enforces the vendor can only attribute media to their own org.
 */
export async function addVendorMedia(
  _prev: MediaState,
  formData: FormData,
): Promise<MediaState> {
  const orgId = String(formData.get("org_id") ?? "");
  const mediaType = String(formData.get("media_type") ?? "");
  const title = str(formData.get("title"), 160);
  const url = str(formData.get("url"), 500);
  const theme = str(formData.get("theme"), 60);

  if (!orgId) return { error: "Missing account.", added: false };
  if (!MEDIA_TYPES.has(mediaType)) return { error: "Pick a media type.", added: false };
  if (!title) return { error: "Give it a title.", added: false };
  if (!url) return { error: mediaType === "photo" ? "Add an image URL." : "Add the link.", added: false };

  // For a photo the URL is the visual; for video/audio the URL is the source and
  // we need a separate visual (poster/cover) — accept one, else reuse the URL.
  const poster = str(formData.get("poster"), 500);
  const imageUrl = mediaType === "photo" ? url : poster ?? url;
  const mediaUrl = mediaType === "photo" ? null : url;

  const supabase = await supabaseServer();
  const { error } = await supabase.from("inspiration_images").insert({
    image_url: imageUrl,
    title,
    theme,
    colors: [],
    source: "vendor",
    vendor_id: orgId,
    media_type: mediaType,
    media_url: mediaUrl,
  });

  if (error) {
    console.error("addVendorMedia failed:", error.code, error.message);
    return { error: "Couldn't add that. Please try again.", added: false };
  }

  revalidatePath("/vendor");
  return { error: null, added: true };
}

export async function deleteVendorMedia(imageId: string) {
  if (!imageId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("inspiration_images").delete().eq("id", imageId);
  if (error) console.error("deleteVendorMedia failed:", error.code, error.message);
  revalidatePath("/vendor");
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
