import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import WeddingNav from "@/components/wedding-nav";
import SiteBuilder from "@/components/wedding/site-builder";
import { listSiteKeys, listSiteVersions } from "@/app/w/[id]/builder/site-actions";
import { mcpEnabled } from "@/lib/flags";
import { listRegistryLinks } from "@/app/wedding/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Website builder",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
// The AI designer writes a whole page in one call; give its server action room.
export const maxDuration = 180;

/**
 * The Website builder tab: the couple's custom guest site, built from a theme,
 * with the Bridal Team AI, from pasted code, or by their own AI over MCP.
 * The Guest website tab keeps the basics (on/off, welcome, cover, registry).
 */
export default async function WebsiteBuilderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/builder`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, public_slug, website_published, site_mode, enabled_tools")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const [registry, { data: site }, versions, keys] = await Promise.all([
    listRegistryLinks(id),
    supabase
      .from("wedding_custom_sites")
      .select("draft_html, draft_source, draft_updated_at, live_updated_at")
      .eq("wedding_id", id)
      .maybeSingle(),
    listSiteVersions(id),
    listSiteKeys(id),
  ]);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";

  return (
    <>
      <PageHero eyebrow={names} title="Website builder" />

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <WeddingNav weddingId={id} active="builder" enabled={(wedding.enabled_tools as string[] | null) ?? null} />

        <div className="mt-6">
          <SiteBuilder
            weddingId={id}
            siteUrl={SITE_URL}
            mcpOn={mcpEnabled()}
            aiOn={Boolean(process.env.ANTHROPIC_API_KEY)}
            websitePublished={Boolean(wedding.website_published)}
            slug={wedding.public_slug ?? null}
            registryCount={registry.length}
            initialMode={wedding.site_mode === "custom" ? "custom" : "standard"}
            initialDraft={site?.draft_html ?? null}
            initialDraftSource={site?.draft_source ?? null}
            initialDraftAt={site?.draft_updated_at ?? null}
            initialLiveAt={site?.live_updated_at ?? null}
            initialVersions={versions}
            initialKeys={keys}
          />
        </div>
      </section>
    </>
  );
}
