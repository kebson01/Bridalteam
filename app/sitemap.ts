import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";
import { supabasePublic } from "@/lib/supabase";

/**
 * Public marketing pages, plus every published vendor listing.
 *
 * Deliberately excluded:
 *   /admin/*, /api/*   — private
 *   /signup, /auth/*   — transactional; /signup redirects to /auth/signup
 *   /dashboard, /w/*   — behind auth
 *
 * /vendors and /community are both public and linked from the primary nav, so
 * they belong here regardless of how much content they hold today.
 */

/**
 * Re-generate hourly. The vendor listings below change whenever a vendor
 * publishes or unpublishes, which a build-time-only sitemap would miss until
 * the next deploy — and deploys are not what should gate a vendor's page
 * reaching Google.
 */
export const revalidate = 3600;

/**
 * Published vendor listings.
 *
 * This is the one thing a *free* listing actually buys a vendor — an indexed
 * page they control — and until now it was the one thing the sitemap never
 * mentioned. `/v/[id]` already sets real per-vendor metadata and robots.ts
 * allows it; the page was simply never submitted.
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
      .select("org_id, updated_at")
      .eq("status", "published");
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return (data ?? []).map((v) => ({
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
  const lastModified = new Date();

  const routes: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1 },
    { path: "/planner", priority: 0.9 },
    { path: "/guides", priority: 0.8 },
    { path: "/vendors", priority: 0.8 },
    { path: "/inspiration", priority: 0.7 },
    { path: "/pricing", priority: 0.7 },
    { path: "/community", priority: 0.6 },
    { path: "/about", priority: 0.6 },
    { path: "/blog", priority: 0.6 },
    { path: "/for-vendors", priority: 0.6 },
    { path: "/contact", priority: 0.4 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  const staticRoutes = routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
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
