import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import { MediaBadge } from "@/components/inspiration-gallery";
import VendorReviews from "@/components/vendor/vendor-reviews";
import { listVendorReviews } from "@/app/vendor/review-actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

async function getVendor(id: string) {
  const supabase = await supabaseServer();
  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select("org_id, business_name, category, description, city, region, website, email, phone, logo_url, cover_url")
    .eq("org_id", id)
    .eq("status", "published")
    .maybeSingle();
  if (!vendor) return { vendor: null, media: [] };
  const { data: media } = await supabase
    .from("inspiration_images")
    .select("id, image_url, title, media_type")
    .eq("vendor_id", id)
    .order("created_at", { ascending: false });
  return { vendor, media: media ?? [] };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { vendor } = await getVendor(id);
  if (!vendor) return { title: "Vendor" };
  return {
    title: `${vendor.business_name} — Wedding Vendor`,
    description: vendor.description ?? `${vendor.category ?? "Wedding vendor"} on Bridal Team.`,
    openGraph: { title: vendor.business_name, url: `${SITE_URL}/v/${vendor.org_id}` },
  };
}

export default async function VendorPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { vendor, media } = await getVendor(id);
  if (!vendor) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const reviews = await listVendorReviews(id);

  const location = [vendor.city, vendor.region].filter(Boolean).join(", ");

  return (
    <>
      <PageHero eyebrow={vendor.category ?? "Vendor"} title={vendor.business_name} />

      <section className="mx-auto max-w-5xl px-5 py-12">
        <Link href="/vendors" className="text-sm font-semibold text-brand-dark hover:text-brand-deep">
          ← All vendors
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_2fr]">
          {/* Info */}
          <aside className="space-y-4">
            {vendor.description && (
              <p className="text-sm leading-relaxed text-ink-soft/85">{vendor.description}</p>
            )}
            <dl className="space-y-2 text-sm">
              {location && (
                <div className="flex gap-2"><dt className="text-ink-soft/50">Location</dt><dd className="text-ink">{location}</dd></div>
              )}
              {vendor.website && (
                <div className="flex gap-2"><dt className="text-ink-soft/50">Website</dt>
                  <dd><a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-brand-dark hover:underline">Visit</a></dd></div>
              )}
              {vendor.email && (
                <div className="flex gap-2"><dt className="text-ink-soft/50">Email</dt>
                  <dd><a href={`mailto:${vendor.email}`} className="text-brand-dark hover:underline">{vendor.email}</a></dd></div>
              )}
              {vendor.phone && (
                <div className="flex gap-2"><dt className="text-ink-soft/50">Phone</dt><dd className="text-ink">{vendor.phone}</dd></div>
              )}
            </dl>
          </aside>

          {/* Their work */}
          <div>
            <h2 className="text-lg font-medium text-ink">Their work</h2>
            {media.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-8 text-center text-sm text-ink-soft/70">
                No media yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {media.map((m) => (
                  <Link key={m.id} href={`/i/${m.id}`} className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.image_url} alt={m.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                    <MediaBadge type={m.media_type} />
                    <span className="absolute inset-x-0 bottom-0 p-3 text-sm font-medium text-white">{m.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <VendorReviews vendorOrgId={id} viewerId={user?.id ?? null} initialReviews={reviews} />
      </section>
    </>
  );
}
