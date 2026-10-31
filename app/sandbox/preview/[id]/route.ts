import { buildSiteData, injectRuntime } from "@/lib/custom-site/runtime";
import { sandboxedHtmlResponse, sandboxedNotFound } from "@/lib/custom-site/serve";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

/**
 * The couple's DRAFT custom site (or one saved version, ?v=<id>), for the
 * preview pane in the site builder. Members only: every read goes through RLS
 * as the signed-in user. Served sandboxed like the live page, so a draft with
 * a bad script can't reach the dashboard it's previewed in.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return sandboxedNotFound();
  const version = new URL(req.url).searchParams.get("v");

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return sandboxedNotFound();

  const [{ data: wedding }, { data: registry }, siteRes] = await Promise.all([
    supabase
      .from("weddings")
      .select("partner_one, partner_two, event_date, venue, city, region, welcome_message, cover_image_url")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("registry_links")
      .select("label, url")
      .eq("wedding_id", id)
      .order("position", { ascending: true })
      .order("created_at", { ascending: true }),
    version && UUID.test(version)
      ? supabase.from("wedding_site_versions").select("html").eq("id", version).eq("wedding_id", id).maybeSingle()
      : supabase.from("wedding_custom_sites").select("html:draft_html").eq("wedding_id", id).maybeSingle(),
  ]);
  const html = (siteRes.data as { html?: string | null } | null)?.html;
  if (!wedding || !html) return sandboxedNotFound();

  return sandboxedHtmlResponse(injectRuntime(html, buildSiteData({ ...wedding, registry: registry ?? [] })));
}
