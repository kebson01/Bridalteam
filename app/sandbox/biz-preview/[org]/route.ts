import { buildVendorSiteData, injectVendorRuntime, type VendorSitePayload } from "@/lib/vendor-site/runtime";
import { sandboxedHtmlResponse, sandboxedNotFound } from "@/lib/custom-site/serve";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * A vendor's DRAFT website (or one saved version, ?v=<id>), for the preview in
 * the website builder. Team members only: every read goes through RLS and
 * vendor_site_payload() as the signed-in user. Served sandboxed like the live
 * site, so a draft with a bad script can't reach the dashboard around it.
 */
export async function GET(req: Request, { params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  if (!UUID.test(org)) return sandboxedNotFound();
  const version = new URL(req.url).searchParams.get("v");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sandboxedNotFound();

  const [{ data: payload }, siteRes] = await Promise.all([
    supabase.rpc("vendor_site_payload", { p_org: org }),
    version && UUID.test(version)
      ? supabase.from("vendor_site_versions").select("html").eq("id", version).eq("org_id", org).maybeSingle()
      : supabase.from("vendor_sites").select("html:draft_html").eq("org_id", org).maybeSingle(),
  ]);
  const html = (siteRes.data as { html?: string | null } | null)?.html;
  if (!payload || !html) return sandboxedNotFound();

  return sandboxedHtmlResponse(injectVendorRuntime(html, buildVendorSiteData(payload as VendorSitePayload)));
}
