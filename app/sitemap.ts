import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";
import { supabasePublic } from "@/lib/supabase";
import { SHOW_COMMUNITY, SHOW_VENDOR_DIRECTORY } from "@/lib/flags";
import { hasIndexableContent } from "@/lib/vendor-content";

/**
 * Public marketing pages, plus every published vendor listing.
 *
 * Deliberately excluded:
 *   /admin/*, /api/*   — private
 *   /signup, /auth/*   — transactional; /signup redirects to /auth/signup
 *   /dashboard, /w/*   — behind auth
 *
 * /vendors and /community are included only when their flags are on. Both
 * pages stay reachable either way — this is not a block, and robots.ts still
 * allows them — but submitting an empty directory and an empty feed to Google
 * asks it to index, and then to rank us for, two pages whose entire content is
 * "nobody is here yet". Hiding the tabs while still handing the same pages to
 * a crawler would be doing half the job.
 *
 * The flags are the right switch rather than a row count because they already
 * mean "there is content worth sending someone to": SHOW_VENDOR_DIRECTORY
 * gates the homepage teaser and the footer link, SHOW_COMMUNITY the nav tab.
 * Flip either one and its page joins the sitemap on the next build.
 */

/**
 * Re-generate hourly. The vendor listings below change whenever a vendor
 * publishes or unpublishes, which a build-time-only sitemap would miss until
 * the next deploy — and deploys are not what should gate a vendor's page
 * reaching Google.
 */
export const revalidate = 3600;

/**
 * Published vendor listings that have content of their own.
 *
 * An indexed page they control is what a free listing buys a vendor, but only
 * once there's something on it: a listing with no description and no picture
 * is left out here and marked noindex on the page itself (see
 * lib/vendor-content.ts for why). The day a vendor fills theirs in, it joins
 * on the next hourly revalidation.
 *
 * Gallery photos also make a page indexable (the page checks them), but aren't
 * looked up here, to keep this to one query. A vendor with photos and no
 * description or logo is rare, and Google still reaches that page through
 * /vendors.
 *
 * Reads with the publishable key, and RLS only exposes `status = 'published'`,
 * so this cannot leak a draft listing even if the filter below were dropped.
 *
 * **It must never fail the build.** `.github/workflows/ci.yml` builds on pull
 * requests from forks with no secrets and no guarantee of network egress, and
 * that property is deliberate. So a failure here returns no vendor rows rather
 * than throwing: the sitemap ships with its static routes, and the next
 * revalidation on a server that *can* reach Supabase fills the rest in.
 */
async function vendorRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const { data, error } = await supabasePublic()
      .from("vendor_profiles")
      .select("org_id, updated_at, description, logo_url, cover_url")
      .eq("status", "published");
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return (data ?? []).filter((v) => hasIndexableContent(v)).map((v) => ({
      url: `${SITE_URL}/v/${v.org_id}`,
      lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch (err) {
    console.error("sitemap: vendor listings unavailable, omitting them:", err);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1 },
    { path: "/planner", priority: 0.9 },
    { path: "/wedding-website", priority: 0.9 },
    { path: "/wedding-budget-calculator", priority: 0.9 },
    { path: "/wedding-rsvp", priority: 0.9 },
    { path: "/wedding-seating-chart", priority: 0.9 },
    { path: "/wedding-checklist", priority: 0.9 },
    { path: "/guides", priority: 0.8 },
    ...(SHOW_VENDOR_DIRECTORY ? [{ path: "/vendors", priority: 0.8 }] : []),
    { path: "/inspiration", priority: 0.7 },
    { path: "/pricing", priority: 0.7 },
    ...(SHOW_COMMUNITY ? [{ path: "/community", priority: 0.6 }] : []),
    { path: "/about", priority: 0.6 },
    { path: "/blog", priority: 0.6 },
    { path: "/for-vendors", priority: 0.6 },
    { path: "/contact", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  // No lastModified on these. It used to be "now", and with the hourly
  // revalidation that told Google every page changed every hour. Google stops
  // trusting a sitemap's dates once they're shown to be wrong, which would
  // also cost the guides and posts below their real ones.
  const staticRoutes = routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
    priority,
  }));

  const blogRoutes = POSTS.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: new Date(`${post.date}T00:00:00`),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  const guideRoutes = GUIDES.map((guide) => ({
    url: `${SITE_URL}/guides/${guide.slug}`,
    lastModified: new Date(`${guide.updated}T00:00:00`),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...guideRoutes, ...blogRoutes, ...(await vendorRoutes())];
}
