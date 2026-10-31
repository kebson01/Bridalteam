import { supabasePublic } from "@/lib/supabase";
import { effectivePlan, entitlements, PLAN_COLUMNS, type PlanSource } from "@/lib/tiers";
import type { DirectoryVendor, VendorDetail, VendorReview, VendorSource } from "@/lib/mcp/tools";

/**
 * The MCP server's view of the vendor directory: the same rows /vendors and
 * /v/[id] render, read with the public anon key so RLS limits it to published
 * profiles. No cookies and no user session; MCP calls are anonymous.
 *
 * Errors are logged and read as "nothing found" rather than thrown, so a
 * database hiccup gives the assistant an empty result instead of a 500.
 */
export function supabaseVendorSource(): VendorSource {
  const db = supabasePublic();

  return {
    async listPublished(): Promise<DirectoryVendor[]> {
      const { data, error } = await db
        .from("vendor_profiles")
        .select(`org_id, business_name, category, description, city, region, organizations(${PLAN_COLUMNS})`)
        .eq("status", "published");
      if (error) {
        console.error("mcp listPublished failed:", error.code, error.message);
        return [];
      }
      return (data ?? []).map((v) => ({
        org_id: v.org_id,
        business_name: v.business_name,
        category: v.category,
        description: v.description,
        city: v.city,
        region: v.region,
        featured: effectivePlan(v.organizations as unknown as PlanSource | null) === "featured",
      }));
    },

    async getPublished(orgId: string): Promise<VendorDetail | null> {
      const { data: v, error } = await db
        .from("vendor_profiles")
        .select(
          `org_id, business_name, category, description, city, region, website, logo_url, cover_url, organizations(${PLAN_COLUMNS})`,
        )
        .eq("org_id", orgId)
        .eq("status", "published")
        .maybeSingle();
      if (error) console.error("mcp getPublished failed:", error.code, error.message);
      if (!v) return null;
      const plan = effectivePlan(v.organizations as unknown as PlanSource | null);
      return {
        org_id: v.org_id,
        business_name: v.business_name,
        category: v.category,
        description: v.description,
        city: v.city,
        region: v.region,
        featured: plan === "featured",
        // Same rule as the profile page: only show the link the plan allows.
        website: entitlements(plan).canLinkSite ? v.website : null,
        logo_url: v.logo_url,
        cover_url: v.cover_url,
      };
    },

    async reviews(orgId: string): Promise<VendorReview[]> {
      // Author names and reviewer ids are left out: the assistant needs what
      // was said, not who said it, and this text ends up in third-party chats.
      const { data, error } = await db
        .from("vendor_reviews")
        .select("rating, body, created_at")
        .eq("vendor_org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) {
        console.error("mcp reviews failed:", error.code, error.message);
        return [];
      }
      return (data ?? []) as VendorReview[];
    },
  };
}
