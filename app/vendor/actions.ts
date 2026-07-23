"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { youtubePoster } from "@/lib/media";
import { moderateImage } from "@/lib/moderation";

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
  // we need a separate visual (poster/cover). Prefer a supplied poster, then a
  // derived one (e.g. a YouTube thumbnail). Never fall back to the raw video URL
  // — an <img> pointed at a watch/file link renders as a broken tile.
  const poster = str(formData.get("poster"), 500);
  let imageUrl: string;
  if (mediaType === "photo") {
    imageUrl = url;
  } else {
    const derived = poster ?? youtubePoster(url);
    if (!derived) {
      return {
        error:
          "Add a cover image URL for this " +
          mediaType +
          " so it shows a preview (YouTube links supply their own).",
        added: false,
      };
    }
    imageUrl = derived;
  }
  const mediaUrl = mediaType === "photo" ? null : url;

  // AI safety check on the image (the photo itself, or a video/audio poster)
  // before it can appear in the public gallery. Blocks explicit/inappropriate
  // content; fails open if moderation is unavailable.
  const moderation = await moderateImage(imageUrl);
  if (!moderation.allowed) {
    return {
      error:
        "That image looks inappropriate for the gallery and wasn't added." +
        (moderation.reason ? ` (${moderation.reason})` : "") +
        " If you believe this is a mistake, contact support.",
      added: false,
    };
  }

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

/**
 * Confirms the signed-in user belongs to this vendor org and returns it.
 * Guards the account lifecycle actions below. Returns null if not authorized.
 */
async function ownedVendorOrg(orgId: string) {
  if (!orgId) return null;
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("org_members")
    .select("organizations(id, type, stripe_subscription_id)")
    .eq("org_id", orgId)
    .maybeSingle();
  const org = data?.organizations as unknown as
    | { id: string; type: string; stripe_subscription_id: string | null }
    | undefined;
  if (!org || org.type !== "vendor") return null;
  return { supabase, org };
}

/**
 * Deactivate the account: hide the public listing and stop the subscription
 * from renewing (kept until the end of the paid period — no refund for the
 * remainder). Reversible: publish again / resume anytime.
 */
export async function deactivateVendorAccount(orgId: string) {
  const ctx = await ownedVendorOrg(orgId);
  if (!ctx) redirect("/vendor");

  await ctx.supabase.from("vendor_profiles").update({ status: "draft" }).eq("org_id", orgId);

  if (stripe && ctx.org.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(ctx.org.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      await ctx.supabase
        .from("organizations")
        .update({ cancel_at_period_end: true })
        .eq("id", orgId);
    } catch (err) {
      console.error("deactivate: cancel renewal failed:", err);
    }
  }

  redirect("/vendor?account=deactivated");
}

/**
 * Permanently close the vendor account: cancel any subscription immediately,
 * remove the vendor's gallery media, and delete the organization (which cascades
 * to its membership and profile). Payments already made are non-refundable.
 *
 * Uses the service role for the delete because RLS intentionally doesn't let a
 * member delete their whole org — but only after verifying, above, that the
 * caller owns this vendor org.
 */
export async function closeVendorAccount(orgId: string) {
  const ctx = await ownedVendorOrg(orgId);
  if (!ctx) redirect("/vendor");

  if (stripe && ctx.org.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(ctx.org.stripe_subscription_id);
    } catch (err) {
      console.error("close: cancel subscription failed:", err);
    }
  }

  const admin = supabaseAdmin();
  if (admin) {
    await admin.from("inspiration_images").delete().eq("vendor_id", orgId);
    // Cascades to org_members and vendor_profiles (see FK ON DELETE CASCADE).
    const { error } = await admin.from("organizations").delete().eq("id", orgId);
    if (error) console.error("close: delete org failed:", error.message);
  } else {
    // No service role available — at least take the listing down.
    await ctx.supabase.from("vendor_profiles").update({ status: "draft" }).eq("org_id", orgId);
  }

  await ctx.supabase.auth.signOut();
  redirect("/?account=closed");
}
