import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import VendorDirectoryList, { type DirectoryVendor } from "@/components/vendor-directory-list";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  alternates: { canonical: "/vendors" },
  title: "Find Wedding Vendors",
  description:
    "Browse photographers, venues, florists, DJs and more — see their work, save what you love, and reach out.",
};

export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const supabase = await supabaseServer();

  // Only published vendor profiles are visible (RLS enforces this too). We pull
  // the org's plan so Featured vendors can be surfaced first.
  const { data: vendors } = await supabase
    .from("vendor_profiles")
    .select("org_id, business_name, category, description, city, region, logo_url, cover_url, organizations(plan)")
    .eq("status", "published")
    .order("business_name");

  const list: DirectoryVendor[] = (vendors ?? [])
    .map((v) => ({
      ...v,
      featured: (v.organizations as unknown as { plan?: string } | null)?.plan === "featured",
    }))
    // Featured first, then alphabetical (already ordered by name).
    .sort((a, b) => Number(b.featured) - Number(a.featured)) as DirectoryVendor[];

  return (
    <>
      <PageHero
        eyebrow="Smart vendor matching"
        title="Find your dream team"
        subtitle="Browse vendors, see their work, and save your favorites. Or tell the AI planner your style and let it suggest who to book first."
      />

      <section className="mx-auto max-w-6xl px-5 py-12">
        {list.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-2 bg-white p-12 text-center">
            <h2 className="text-lg font-medium text-ink">Vendors are joining now</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
              We&rsquo;re building the directory with real, bookable vendors. In the
              meantime, let the AI planner suggest what to book and when.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/planner" className="inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white">
                Ask the AI planner
              </Link>
              <Link href="/for-vendors" className="inline-flex rounded-full border border-stone-2 px-6 py-3 text-sm font-semibold text-ink-soft hover:border-brand">
                Are you a vendor? List your business
              </Link>
            </div>
          </div>
        ) : (
          <VendorDirectoryList vendors={list} />
        )}
      </section>
    </>
  );
}
