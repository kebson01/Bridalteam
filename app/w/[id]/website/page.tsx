import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import WeddingNav from "@/components/wedding-nav";
import WebsiteManager from "@/components/wedding/website-manager";
import RegistryManager from "@/components/wedding/registry-manager";
import CoverPhoto from "@/components/wedding/cover-photo";
import SiteBuilder from "@/components/wedding/site-builder";
import { listSiteKeys, listSiteVersions } from "@/app/w/[id]/builder/site-actions";
import { listRegistryLinks } from "@/app/wedding/actions";
import { mcpEnabled } from "@/lib/flags";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { retentionNote } from "@/lib/custom-site/retention";
import { namesSlug } from "@/lib/custom-site/slug";

export const metadata: Metadata = {
  title: "Wedding website",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
// The Bridal Team AI designer writes a whole page in one server action, and
// server actions run under the page that calls them: give it room.
export const maxDuration = 180;

type Section = "design" | "settings";

/**
 * The Website tab: one place for the couple's guest website.
 *
 *   Design   — build the page (themes, Bridal Team AI, pasted code, their own
 *              AI over MCP), preview it and publish. Opens first.
 *   Settings — on/off, web address, welcome message, cover photo, registry.
 *
 * These used to be two nav tabs ("Website" and "Website builder"), which sent
 * couples back and forth: they published in one and had to switch the site
 * on in the other. /w/[id]/builder now redirects here.
 */
export default async function WeddingWebsitePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ section?: string }>;
}) {
  const { id } = await params;
  const section: Section = (await searchParams).section === "settings" ? "settings" : "design";

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/website`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select(
      "id, partner_one, partner_two, public_slug, website_published, welcome_message, cover_image_url, cover_position, site_mode, enabled_tools, event_date, created_at, website_ended_at, site_blocked_at, site_block_reason",
    )
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";
  const enabled = (wedding.enabled_tools as string[] | null) ?? null;
  const tab = (s: Section) => `/w/${id}/website${s === "settings" ? "?section=settings" : ""}`;
  const liveUrl = wedding.website_published && wedding.public_slug ? `${SITE_URL}/wedding/${wedding.public_slug}` : null;

  const sectionTabs = (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <nav className="flex rounded-full bg-stone-4 p-1" aria-label="Website sections">
        {(["design", "settings"] as const).map((s) => (
          <Link
            key={s}
            href={tab(s)}
            aria-current={section === s ? "page" : undefined}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              section === s ? "bg-white text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"
            }`}
          >
            {s === "design" ? "Design" : "Settings"}
          </Link>
        ))}
      </nav>
      <p className="text-sm text-ink-soft/80">
        {liveUrl ? (
          <>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-green-600 align-middle" aria-hidden="true" />
            Live at{" "}
            <a href={liveUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-text hover:underline">
              {liveUrl.replace(/^https?:\/\//, "")}
            </a>
          </>
        ) : (
          <>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-stone-2 align-middle" aria-hidden="true" />
            Not live yet — guests can&rsquo;t see your website
          </>
        )}
      </p>
    </div>
  );

  if (section === "design") {
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

    return (
      <>
        <PageHero eyebrow={names} title="Wedding website" />
        <section className="mx-auto max-w-7xl px-5 pb-16">
          <WeddingNav weddingId={id} active="website" enabled={enabled} />
          {sectionTabs}
          <div className="mt-4">
            <SiteBuilder
              weddingId={id}
              siteUrl={SITE_URL}
              mcpOn={mcpEnabled()}
              aiOn={Boolean(process.env.ANTHROPIC_API_KEY)}
              websitePublished={Boolean(wedding.website_published)}
              slug={wedding.public_slug ?? null}
              welcome={wedding.welcome_message ?? ""}
              registryCount={registry.length}
              eventDate={wedding.event_date ?? null}
              createdAt={wedding.created_at}
              blockedReason={wedding.site_blocked_at ? (wedding.site_block_reason ?? "Content rules") : null}
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

  const registry = await listRegistryLinks(id);

  return (
    <>
      <PageHero eyebrow={names} title="Wedding website" />

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <WeddingNav weddingId={id} active="website" enabled={enabled} />
        {sectionTabs}

        <div className="mx-auto mt-6 max-w-3xl space-y-6">
          {wedding.site_blocked_at && (
            <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-semibold">Bridal Team has taken your guest website down.</p>
              <p className="mt-1">Reason: {wedding.site_block_reason ?? "Content rules"}</p>
              <p className="mt-1 text-red-800/80">
                Update your site, then <Link href="/contact" className="font-semibold underline">contact us</Link> and
                we&rsquo;ll review it. Your planning is unaffected.
              </p>
            </div>
          )}

          <p className="rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/80">
            {wedding.website_ended_at
              ? "Your guest website came down after your wedding. Turn it on again to publish a new one."
              : retentionNote(wedding.event_date ?? null, wedding.created_at)}
          </p>

          <WebsiteManager
            weddingId={id}
            initialPublished={Boolean(wedding.website_published)}
            initialWelcome={wedding.welcome_message ?? ""}
            initialSlug={wedding.public_slug ?? null}
            suggestedSlug={namesSlug(wedding.partner_one, wedding.partner_two)}
            siteUrl={SITE_URL}
          />

          <CoverPhoto
            weddingId={id}
            initialUrl={wedding.cover_image_url ?? null}
            initialPosition={wedding.cover_position ?? 50}
          />

          {/* Registry links show on the standard page and wherever a custom
              site uses data-bt="registry", so they're managed once, here. */}
          <div id="registry" className="scroll-mt-24">
            <RegistryManager weddingId={id} initialLinks={registry} />
          </div>

          {/* RSVPs live on the Guests tab: each household replies through its
              own private link, stored against their row. */}
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
