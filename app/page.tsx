import AIPlanner from "@/components/ai-planner";
import GetTheApp from "@/components/get-the-app";
import { HomeHero, HomeVendors, HowItWorks, RealWeddings, WholeTeam } from "@/components/home-sections";
import { summarizeVendors, type HomeVendorSummary } from "@/lib/home-vendors";
import { supabasePublic } from "@/lib/supabase";
import { publicPlan, PUBLIC_PLAN_COLUMN } from "@/lib/tiers";
import { lowestPrice, readPackages } from "@/lib/vendor-extras";
import type { Metadata } from "next";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import JsonLd from "@/components/json-ld";
import { webApplicationSchema } from "@/lib/structured-data";
import { arrangeFeed, type FeedItem } from "@/lib/seed-content";
import { momentsPool, type FeedPhotoRow, type Moment } from "@/lib/home-moments";

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
      .select(`org_id, business_name, category, city, region, description, logo_url, cover_url, packages, ${PUBLIC_PLAN_COLUMN}`)
      .eq("status", "published")
      .order("business_name");
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return summarizeVendors(
      (data ?? []).map(({ packages, vendor_plan, ...v }) => ({
        ...v,
        featured: publicPlan({ vendor_plan }) === "featured",
        packages_from: lowestPrice(readPackages(packages)),
      })),
    );
  } catch (err) {
    console.error("home: vendor listings unavailable, omitting them:", err);
    return { count: 0, types: [], picks: [] };
  }
}

/**
 * Photos for the "Moments worth planning for" mosaic to rotate through: the
 * same public feed /inspiration shows (same visibility rule, same retirement
 * of seed pieces), photos only. A failure leaves the mosaic on its hand-picked
 * set rather than failing the page.
 */
async function homeMoments(): Promise<Moment[]> {
  const feed = (columns: string) =>
    supabasePublic()
      .from("inspiration_images")
      .select(columns)
      .eq("feed_visible", true)
      .eq("media_type", "photo")
      .order("created_at", { ascending: false });
  const BASE = "id, image_url, title, media_type, like_count, is_seed, retired_at";
  try {
    // Photos marked people-free. If has_people isn't in the database yet
    // (its migration not applied), fall back to every feed photo and let
    // momentsPool's hand-checked list decide.
    let { data, error } = await feed(`${BASE}, has_people`).eq("has_people", false);
    if (error) ({ data, error } = await feed(BASE));
    if (error) throw new Error(`${error.code}: ${error.message}`);
    const rows = (data ?? []) as unknown as (FeedPhotoRow & FeedItem)[];
    return momentsPool(arrangeFeed(rows).items);
  } catch (err) {
    console.error("home: inspiration photos unavailable, mosaic stays static:", err);
    return [];
  }
}

export default async function Home() {
  const [vendors, moments] = await Promise.all([homeVendors(), homeMoments()]);
  return (
    <>
      <JsonLd data={webApplicationSchema()} />
      <HomeHero vendorCount={vendors.count} showVendors={SHOW_VENDOR_DIRECTORY} />
      <HowItWorks />
      <AIPlanner />
      <WholeTeam />
      <RealWeddings pool={moments} />
      {SHOW_VENDOR_DIRECTORY && <HomeVendors summary={vendors} />}
      <div className="pt-16">
        <GetTheApp />
      </div>
    </>
  );
}
