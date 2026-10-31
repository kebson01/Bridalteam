import { supabasePublic } from "@/lib/supabase";
import { hasIndexableContent } from "@/lib/vendor-content";
import { buildLlmsTxt, type LlmsVendor } from "@/lib/llms";

/**
 * Serves /llms.txt — see lib/llms.ts for what it is and why.
 *
 * Same hourly cadence as the sitemap, for the same reason: a vendor who
 * publishes should reach AI assistants without waiting for a deploy.
 */
export const revalidate = 3600;

/**
 * Same rules as the sitemap: published listings only (RLS enforces that too),
 * only ones with content of their own, and a Supabase failure must never fail
 * the build — it yields a file without the vendor list, filled in on the next
 * revalidation.
 */
async function publishedVendors(): Promise<LlmsVendor[]> {
  try {
    const { data, error } = await supabasePublic()
      .from("vendor_profiles")
      .select("org_id, business_name, category, city, region, description, logo_url, cover_url")
      .eq("status", "published");
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return (data ?? []).filter((v) => hasIndexableContent(v));
  } catch (err) {
    console.error("llms.txt: vendor listings unavailable, omitting them:", err);
    return [];
  }
}

export async function GET() {
  return new Response(buildLlmsTxt(await publishedVendors()), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
