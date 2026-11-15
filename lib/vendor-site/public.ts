import { cache } from "react";
import { supabaseServer } from "@/lib/supabase/server";
import type { VendorSitePayload } from "@/lib/vendor-site/runtime";

export interface PublicVendorSite {
  org_id: string;
  html: string;
  listing: VendorSitePayload;
}

/**
 * A vendor's live website and listing details, or null when there is none to
 * show: not published, taken down, or their plan doesn't include a website
 * right now (get_public_vendor_site in migration 20261115190000_vendor_websites.sql).
 * Cached per request: /biz/[slug] reads it for metadata and for the page.
 */
export const getPublicVendorSite = cache(async (slug: string): Promise<PublicVendorSite | null> => {
  if (!/^[a-z0-9-]{3,40}$/i.test(slug)) return null;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("get_public_vendor_site", { p_slug: slug.toLowerCase() });
  if (error) {
    console.error("get_public_vendor_site failed:", error.code, error.message);
    return null;
  }
  const site = data as PublicVendorSite | null;
  return site && typeof site.html === "string" && site.listing ? site : null;
});
