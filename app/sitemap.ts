import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";

/**
 * Public marketing pages only.
 *
 * Deliberately excluded:
 *   /admin/*, /api/*  — private
 *   /login, /signup   — transactional, and accounts aren't wired up yet
 *   /vendors          — hidden until the directory holds real listings
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const routes: Array<{ path: string; priority: number }> = [
    { path: "/", priority: 1 },
    { path: "/planner", priority: 0.9 },
    { path: "/inspiration", priority: 0.7 },
    { path: "/pricing", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/blog", priority: 0.6 },
    { path: "/for-vendors", priority: 0.6 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ];

  if (SHOW_VENDOR_DIRECTORY) {
    routes.splice(2, 0, { path: "/vendors", priority: 0.8 });
  }

  return routes.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority,
  }));
}
