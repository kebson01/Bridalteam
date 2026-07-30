import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { entitlements } from "@/lib/tiers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Outbound link tracker: records a "link_click" for a vendor, then redirects to
 * their website. Only works for vendors whose plan allows an outbound link
 * (Pro+), matching what the public profile renders.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const org = url.searchParams.get("org") ?? "";
  if (!org) return NextResponse.redirect(new URL("/vendors", req.url));

  const supabase = await supabaseServer();
  const { data: vendor } = await supabase
    .from("vendor_profiles")
    .select("website, organizations(plan)")
    .eq("org_id", org)
    .eq("status", "published")
    .maybeSingle();

  const plan = (vendor?.organizations as unknown as { plan?: string } | null)?.plan ?? "free";
  const website = vendor?.website ?? "";
  if (!website || !entitlements(plan).canLinkSite) {
    return NextResponse.redirect(new URL(`/v/${org}`, req.url));
  }

  const admin = supabaseAdmin();
  if (admin) {
    try {
      await admin.from("vendor_events").insert({ vendor_org_id: org, kind: "link_click" });
    } catch {
      // best-effort
    }
  }

  const target = /^https?:\/\//i.test(website) ? website : `https://${website}`;
  return NextResponse.redirect(target);
}
