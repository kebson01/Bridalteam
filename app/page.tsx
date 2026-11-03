import AIPlanner from "@/components/ai-planner";
import GetTheApp from "@/components/get-the-app";
import { HomeHero, HomeVendors, HowItWorks, RealWeddings, WholeTeam } from "@/components/home-sections";
import { summarizeVendors, type HomeVendorSummary } from "@/lib/home-vendors";
import { supabasePublic } from "@/lib/supabase";
import { effectivePlan, PLAN_COLUMNS, type PlanSource } from "@/lib/tiers";
import { lowestPrice, readPackages } from "@/lib/vendor-extras";
import type { Metadata } from "next";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import JsonLd from "@/components/json-ld";
import { webApplicationSchema } from "@/lib/structured-data";

// Self-canonical for the homepage. og:url has to be stated here rather than
// inherited: the root layout deliberately no longer carries a page-specific url
// (that inheritance is what canonicalised the whole site to "/"), so a page that
// doesn't declare its own gets none. Title/description still fall through to the
// root layout defaults.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: "Bridal Team — Fun, Simple, AI-Powered Wedding Planning",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
};

// Vendor numbers come from the database; refresh hourly like the sitemap.
export const revalidate = 3600;

/**
 * Published listings for the homepage's count, type chips and vendor cards.
 * Like the sitemap, a database failure must never fail the build or the page:
 * it renders without the vendor section and fills in on the next refresh.
 */
async function homeVendors(): Promise<HomeVendorSummary> {
  if (!SHOW_VENDOR_DIRECTORY) return { count: 0, types: [], picks: [] };
  try {
    const { data, error } = await supabasePublic()
      .from("vendor_profiles")
      .select(`org_id, business_name, category, city, region, description, logo_url, cover_url, packages, organizations(${PLAN_COLUMNS})`)
      .eq("status", "published")
      .order("business_name");
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return summarizeVendors(
      (data ?? []).map(({ packages, organizations, ...v }) => ({
        ...v,
        featured: effectivePlan(organizations as unknown as PlanSource | null) === "featured",
        packages_from: lowestPrice(readPackages(packages)),
      })),
    );
  } catch (err) {
    console.error("home: vendor listings unavailable, omitting them:", err);
    return { count: 0, types: [], picks: [] };
  }
}

export default async function Home() {
  const vendors = await homeVendors();
  return (
    <>
      <JsonLd data={webApplicationSchema()} />
      <HomeHero vendorCount={vendors.count} showVendors={SHOW_VENDOR_DIRECTORY} />
      <HowItWorks />
      <AIPlanner />
      <WholeTeam />
      <RealWeddings />
      {SHOW_VENDOR_DIRECTORY && <HomeVendors summary={vendors} />}
      <div className="pt-16">
        <GetTheApp />
      </div>
    </>
  );
}
