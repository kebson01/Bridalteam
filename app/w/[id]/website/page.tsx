import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import WeddingNav from "@/components/wedding-nav";
import WebsiteManager from "@/components/wedding/website-manager";
import RegistryManager from "@/components/wedding/registry-manager";
import CoverPhoto from "@/components/wedding/cover-photo";
import SiteBuilder from "@/components/wedding/site-builder";
import { listSiteKeys, listSiteVersions } from "@/app/w/[id]/website/site-actions";
import { mcpEnabled } from "@/lib/flags";
import { listRegistryLinks } from "@/app/wedding/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Guest website",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
// The AI designer writes a whole page in one call; give its server action room.
export const maxDuration = 180;

export default async function WeddingWebsitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/website`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, public_slug, website_published, welcome_message, cover_image_url, cover_position, site_mode")
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
      <PageHero eyebrow={names} title="Guest website" />

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <WeddingNav weddingId={id} active="website" />

        <div className="mt-6 space-y-6">
          <WebsiteManager
            weddingId={id}
            initialPublished={Boolean(wedding.website_published)}
            initialWelcome={wedding.welcome_message ?? ""}
            initialSlug={wedding.public_slug ?? null}
            siteUrl={SITE_URL}
          />

          <CoverPhoto
            weddingId={id}
            initialUrl={wedding.cover_image_url ?? null}
            initialPosition={wedding.cover_position ?? 50}
          />

          <SiteBuilder
            weddingId={id}
            siteUrl={SITE_URL}
            mcpOn={mcpEnabled()}
            aiOn={Boolean(process.env.ANTHROPIC_API_KEY)}
            websitePublished={Boolean(wedding.website_published)}
            slug={wedding.public_slug ?? null}
            initialMode={wedding.site_mode === "custom" ? "custom" : "standard"}
            initialDraft={site?.draft_html ?? null}
            initialDraftSource={site?.draft_source ?? null}
            initialDraftAt={site?.draft_updated_at ?? null}
            initialLiveAt={site?.live_updated_at ?? null}
            initialVersions={versions}
            initialKeys={keys}
          />

          {/* Registry links show on the standard page and wherever a custom
              site uses data-bt="registry", so they're managed once, here. */}
          <RegistryManager weddingId={id} initialLinks={registry} />

          {/* RSVPs live on the Guests tab now.
              Replies used to arrive through an open form on the public page and
              landed in `rsvps`. RSVP is invite-only since the guest list
              shipped: each household replies through its own link and the
              answer is stored against their row. Listing the old table here
              would show an empty box forever, so this points at the real one
              rather than duplicating it. */}
          <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold text-ink">RSVPs</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
              Replies come in through each household&rsquo;s private invitation link. Your guest
              list shows who&rsquo;s been invited, who&rsquo;s replied and who you&rsquo;re still
              waiting on.
            </p>
            <Link
              href={`/w/${id}/guests`}
              className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
            >
              Open your guest list
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
