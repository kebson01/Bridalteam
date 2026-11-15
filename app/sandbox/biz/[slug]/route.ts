import { getPublicVendorSite } from "@/lib/vendor-site/public";
import { buildVendorSiteData, injectVendorRuntime } from "@/lib/vendor-site/runtime";
import { sandboxedHtmlResponse, sandboxedNotFound } from "@/lib/custom-site/serve";

export const dynamic = "force-dynamic";

/**
 * A vendor's live website, as the raw document /biz/[slug] frames. Served
 * sandboxed (opaque origin), exactly like couples' sites: see
 * lib/custom-site/serve.ts.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getPublicVendorSite(slug);
  if (!site) return sandboxedNotFound();
  return sandboxedHtmlResponse(injectVendorRuntime(site.html, buildVendorSiteData(site.listing)), { cache: true });
}
