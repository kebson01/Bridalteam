import { supabasePublic } from "@/lib/supabase";
import { hasIndexableContent } from "@/lib/vendor-content";
import { buildLlmsTxt, type LlmsRealWedding, type LlmsVendor } from "@/lib/llms";
import { mcpEnabled } from "@/lib/flags";

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

/** Published Real Weddings stories, the same set the sitemap lists. */
async function publishedRealWeddings(): Promise<LlmsRealWedding[]> {
  try {
    const { data, error } = await supabasePublic()
      .from("real_weddings")
      .select("slug, title, city, summary")
      .eq("status", "published")
      .order("wedding_date", { ascending: false });
    if (error) throw new Error(`${error.code}: ${error.message}`);
    return data ?? [];
  } catch (err) {
    console.error("llms.txt: real weddings unavailable, omitting them:", err);
    return [];
  }
}

export async function GET() {
  const [vendors, realWeddings] = await Promise.all([publishedVendors(), publishedRealWeddings()]);
  return new Response(buildLlmsTxt({ vendors, realWeddings, mcpEnabled: mcpEnabled() }), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}
