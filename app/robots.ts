import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // /vendors used to be disallowed here, from back when the page 404'd behind
  // SHOW_VENDOR_DIRECTORY. It no longer reads that flag: it is a public page
  // with an honest empty state, and it sits in the primary navigation as "Find
  // Vendors". Blocking a linked, indexable page was the odd one out, so it is
  // allowed again. SHOW_VENDOR_DIRECTORY now only controls the homepage teaser.
  const disallow = ["/admin", "/api/"];

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
