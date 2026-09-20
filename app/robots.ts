import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // /vendors used to be disallowed here, from back when the page 404'd behind
  // SHOW_VENDOR_DIRECTORY. It no longer reads that flag: it is a public page
  // with an honest empty state, and it sits in the primary navigation as "Find
  // Vendors". Blocking a linked, indexable page was the odd one out, so it is
  // allowed again. SHOW_VENDOR_DIRECTORY now only controls the homepage teaser.
  // /claim/<token> carries its own credential in the URL: a claim link in a
  // search result is a claim link anyone can use. The pages also set
  // robots: { index: false }, but that only helps once a crawler has already
  // fetched the URL, which is exactly what we would rather it never did.
  const disallow = ["/admin", "/api/", "/claim"];

  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
