import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { POSTS } from "@/lib/blog";
import { GUIDES } from "@/lib/guides";

/**
 * Public marketing pages only.
 *
 * Deliberately excluded:
 *   /admin/*, /api/*   — private
 *   /signup, /auth/*   — transactional; /signup redirects to /auth/signup
 *   /dashboard, /w/*   — behind auth
 *
 * /vendors and /community are both public and linked from the primary nav, so
 * they belong here regardless of how much content they hold today.
 */
export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticRoutes, ...guideRoutes, ...blogRoutes];
}
