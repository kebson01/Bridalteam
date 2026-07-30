"use server";

import { supabaseServer } from "@/lib/supabase/server";

export type VendorStats = { views30: number; clicks30: number; viewsTotal: number };

/**
 * Basic view/click stats for a vendor's dashboard (Pro+). RLS restricts
 * vendor_events reads to the vendor's own team, so the counts are scoped to
 * this org automatically.
 */
export async function getVendorStats(orgId: string): Promise<VendorStats> {
  const empty: VendorStats = { views30: 0, clicks30: 0, viewsTotal: 0 };
  if (!orgId) return empty;
  const supabase = await supabaseServer();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: views30 }, { count: clicks30 }, { count: viewsTotal }] = await Promise.all([
    supabase
      .from("vendor_events")
      .select("*", { count: "exact", head: true })
      .eq("vendor_org_id", orgId)
      .eq("kind", "view")
      .gte("created_at", since),
    supabase
      .from("vendor_events")
      .select("*", { count: "exact", head: true })
      .eq("vendor_org_id", orgId)
      .eq("kind", "link_click")
      .gte("created_at", since),
    supabase
      .from("vendor_events")
      .select("*", { count: "exact", head: true })
      .eq("vendor_org_id", orgId)
      .eq("kind", "view"),
  ]);

  return {
    views30: views30 ?? 0,
    clicks30: clicks30 ?? 0,
    viewsTotal: viewsTotal ?? 0,
  };
}
