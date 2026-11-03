import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listVendorReviews } from "@/app/vendor/review-actions";
import VendorProfileView from "@/components/vendor/profile-view";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { hasIndexableContent } from "@/lib/vendor-content";
import { entitlements, effectivePlan, PLAN_COLUMNS, type PlanSource } from "@/lib/tiers";

export const dynamic = "force-dynamic";

async function getVendor(id: string) {
  const supabase = await supabaseServer();
  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select(
      `org_id, business_name, category, description, city, region, website, email, phone, social_links, price_tier, highlights, packages, faqs, logo_url, cover_url, organizations(${PLAN_COLUMNS})`,
    )
    .eq("org_id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!vendor) return { vendor: null, media: [], plan: "free" as string };
  const plan = effectivePlan(vendor.organizations as unknown as PlanSource | null);
  const { data: media } = await supabase
    .from("inspiration_images")
    .select("id, image_url, title, media_type")
    .eq("vendor_id", id)
    .order("created_at", { ascending: false });
  return { vendor, media: media ?? [], plan };
}

/**
 * Published Real Weddings stories that credit this vendor with a link to
 * their profile. Stories are few, so they are filtered here rather than with
 * a JSON query.
 */
async function realWeddingsFeaturing(id: string) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("real_weddings")
    .select("slug, title, city, venue, cover_url, vendors")
    .eq("status", "published")
    .order("wedding_date", { ascending: false });
  if (error) return [];
  return (data ?? []).filter((r) =>
    Array.isArray(r.vendors) &&
    (r.vendors as { url?: string }[]).some((v) => typeof v?.url === "string" && v.url.includes(`/v/${id}`)),
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { vendor, media } = await getVendor(id);
  if (!vendor) return { title: "Vendor" };
  return {
    title: `${vendor.business_name} — Wedding Vendor`,
    // An unclaimed shell stays browsable but isn't offered to Google until it
    // has something of its own (lib/vendor-content.ts). "follow" keeps links
    // from it counting.
    ...(hasIndexableContent(vendor, media.length) ? {} : { robots: { index: false, follow: true } }),
    description: vendor.description ?? `${vendor.category ?? "Wedding vendor"} on Bridal Team.`,
    openGraph: { title: vendor.business_name, url: `${SITE_URL}/v/${vendor.org_id}` },
  };
}

export default async function VendorPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { vendor, media, plan } = await getVendor(id);
  if (!vendor) notFound();

  const ent = entitlements(plan);

  const supabase = await supabaseServer();
  const [
    {
      data: { user },
    },
    reviews,
    stories,
  ] = await Promise.all([supabase.auth.getUser(), listVendorReviews(id), realWeddingsFeaturing(id)]);

  return (
    <VendorProfileView
      vendor={vendor}
      media={media}
      stories={stories}
      reviews={reviews}
      ent={ent}
      user={user}
    />
  );
}
