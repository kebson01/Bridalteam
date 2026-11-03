import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { entitlements, effectivePlan, PLAN_COLUMNS, type PlanSource } from "@/lib/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Outbound link: redirects to a vendor's website, for vendors whose plan allows
 * the link, matching what the public profile renders.
 *
 * It does not count clicks. Anything that loads this URL would count: search
 * crawlers that ignore robots.txt, link-preview bots, and AI assistants given
 * the link by the MCP vendor tools. That once put a day at 445 clicks against
 * 2 profile views. Real clicks are counted on the profile page instead
 * (components/vendor/website-link.tsx, through /api/vendor/track).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const org = url.searchParams.get("org") ?? "";
  if (!org) return NextResponse.redirect(new URL("/vendors", req.url));

  const supabase = await supabaseServer();
  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select(`website, organizations(${PLAN_COLUMNS})`)
    .eq("org_id", org)
    .eq("status", "published")
    .maybeSingle();

  const plan = effectivePlan(vendor?.organizations as unknown as PlanSource | null);
  const website = vendor?.website ?? "";
  if (!website || !entitlements(plan).canLinkSite) {
    return NextResponse.redirect(new URL(`/v/${org}`, req.url));
  }

  const target = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  return NextResponse.redirect(target);
}
