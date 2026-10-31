import { getPublicRegistry, getPublicWedding } from "@/app/wedding/actions";
import { buildSiteData, injectRuntime } from "@/lib/custom-site/runtime";
import { sandboxedHtmlResponse, sandboxedNotFound } from "@/lib/custom-site/serve";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * A couple's live custom site, as the raw document /wedding/[slug] frames.
 * Served sandboxed (opaque origin) — see lib/custom-site/serve.ts.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!/^[a-z0-9-]{1,80}$/i.test(slug)) return sandboxedNotFound();

  const supabase = await supabaseServer();
  const { data: html, error } = await supabase.rpc("get_public_custom_site", { p_slug: slug });
  if (error) console.error("get_public_custom_site failed:", error.message);
  if (typeof html !== "string" || !html) return sandboxedNotFound();

  const [wedding, registry] = await Promise.all([getPublicWedding(slug), getPublicRegistry(slug)]);
  if (!wedding) return sandboxedNotFound();

  return sandboxedHtmlResponse(injectRuntime(html, buildSiteData({ ...wedding, registry })), { cache: true });
}
