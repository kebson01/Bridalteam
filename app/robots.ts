import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";

export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin/", "/api/"];

  // Keep crawlers off the directory while it's hidden; /vendors 404s anyway,
  // but this avoids burning crawl budget and indexing a dead URL.
  if (!SHOW_VENDOR_DIRECTORY) disallow.push("/vendors");

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
