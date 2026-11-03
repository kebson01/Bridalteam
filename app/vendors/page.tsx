import Link from "next/link";
import VendorDirectoryHeader from "@/components/vendor-directory-header";
import RecommendVendor from "@/components/recommend-vendor";
import VendorDirectoryList, { type DirectoryVendor } from "@/components/vendor-directory-list";
import { supabaseServer } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/site";
import JsonLd from "@/components/json-ld";
import { vendorItemListSchema } from "@/lib/structured-data";
import { hasIndexableContent } from "@/lib/vendor-content";
import { effectivePlan, PLAN_COLUMNS, type PlanSource } from "@/lib/tiers";
import { lowestPrice, readHighlights, readPackages } from "@/lib/vendor-extras";

export const metadata = pageMetadata({
  path: "/vendors",
  title: "Find Wedding Vendors",
  description:
    "Browse photographers, venues, florists, DJs and more — see their work, save what you love, and reach out.",
});

export const dynamic = "force-dynamic";

export default async function VendorsPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const supabase = await supabaseServer();

  // Only published vendor profiles are visible (RLS enforces this too). We pull
  // the org's plan so Featured vendors can be surfaced first.
  const [{ data: vendors }, { data: auth }, { data: reviewRows }] = await Promise.all([
    supabase
      .from("vendor_profiles")
      .select(
        `org_id, business_name, category, description, city, region, logo_url, cover_url, price_tier, packages, highlights, organizations(${PLAN_COLUMNS})`,
      )
      .eq("status", "published")
      .order("business_name"),
    supabase.auth.getUser(),
    // Ratings for the cards. Reviews are public, as on each profile.
    supabase.from("vendor_reviews").select("vendor_org_id, rating"),
  ]);

  const ratings = new Map<string, { sum: number; count: number }>();
  for (const r of reviewRows ?? []) {
    if (!(r.rating >= 1 && r.rating <= 5)) continue;
    const t = ratings.get(r.vendor_org_id) ?? { sum: 0, count: 0 };
    t.sum += r.rating;
    t.count += 1;
    ratings.set(r.vendor_org_id, t);
  }

  const list: DirectoryVendor[] = (vendors ?? [])
    .map(({ packages, highlights, organizations, ...v }) => {
      const r = ratings.get(v.org_id);
      const top = readHighlights(highlights)[0];
      return {
        ...v,
        featured: effectivePlan(organizations as unknown as PlanSource | null) === "featured",
        packages_from: lowestPrice(readPackages(packages)),
        highlight: top ? top.title : null,
        rating: r ? { average: r.sum / r.count, count: r.count } : null,
      };
    })
    // Featured first, then alphabetical (already ordered by name).
    .sort((a, b) => Number(b.featured) - Number(a.featured)) as DirectoryVendor[];

  const indexable = list.filter((v) => hasIndexableContent(v));

  return (
    <>
      {/* Same listings the sitemap offers: an empty shell is noindex on its own page (lib/vendor-content.ts). */}
      {indexable.length > 0 && <JsonLd data={vendorItemListSchema(indexable)} />}
      <section className="mx-auto max-w-6xl px-5 pb-16 pt-10 sm:pt-14">
        <VendorDirectoryHeader count={list.length} />
        <div className="mt-8">
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
            <VendorDirectoryList vendors={list} initialCategory={typeof type === "string" ? type : null} />
          )}
        </div>

        <RecommendVendor signedIn={Boolean(auth.user)} />
      </section>
    </>
  );
}
