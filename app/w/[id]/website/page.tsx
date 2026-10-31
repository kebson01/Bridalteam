import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import WeddingNav from "@/components/wedding-nav";
import WebsiteManager from "@/components/wedding/website-manager";
import RegistryManager from "@/components/wedding/registry-manager";
import CoverPhoto from "@/components/wedding/cover-photo";
import { listRegistryLinks } from "@/app/wedding/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { retentionNote } from "@/lib/custom-site/retention";
import { namesSlug } from "@/lib/custom-site/slug";

export const metadata: Metadata = {
  title: "Guest website",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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
    .select("id, partner_one, partner_two, public_slug, website_published, welcome_message, cover_image_url, cover_position, site_mode, event_date, created_at, website_ended_at")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const [registry, { data: site }] = await Promise.all([
    listRegistryLinks(id),
    supabase
      .from("wedding_custom_sites")
      .select("draft_updated_at, live_updated_at")
      .eq("wedding_id", id)
      .maybeSingle(),
  ]);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";
  const customLive = wedding.site_mode === "custom" && Boolean(site?.live_updated_at);
  const draftAt = site?.draft_updated_at ?? null;
  const liveAt = site?.live_updated_at ?? null;
  const draftAhead = draftAt !== null && (liveAt === null || Date.parse(draftAt) > Date.parse(liveAt));

  return (
    <>
      <PageHero eyebrow={names} title="Guest website" />

      <section className="mx-auto max-w-3xl px-5 pb-16">
        <WeddingNav weddingId={id} active="website" />

        <p className="mt-4 rounded-lg bg-stone-4 px-3 py-2 text-xs text-ink-soft/80">
          {wedding.website_ended_at
            ? "Your guest website came down after your wedding. Turn it on again to publish a new one."
            : retentionNote(wedding.event_date ?? null, wedding.created_at)}
        </p>

        <div className="mt-6 space-y-6">
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

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-2 border-brand bg-brand-wash p-6 shadow-card">
            <div className="min-w-0 flex-[1_1_18rem]">
              <h2 className="font-display text-lg font-semibold text-ink">Design your own site</h2>
              <p className="mt-1 max-w-md text-sm leading-relaxed text-ink-soft/80">
                Pick a theme, describe it to our AI, paste your own code, or connect Claude or ChatGPT.
              </p>
              <p className="mt-2 text-xs text-ink-soft/70">
                Guests see: <span className="font-semibold text-ink">{customLive ? "Custom site" : "Standard page"}</span>
                {draftAhead ? " · unpublished draft waiting" : ""}
              </p>
            </div>
            <Link
              href={`/w/${id}/builder`}
              className="flex-none rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white"
            >
              Open Website builder →
            </Link>
          </div>

          {/* Registry links show on the standard page and wherever a custom
              site uses data-bt="registry", so they're managed once, here. */}
          <div id="registry" className="scroll-mt-24">
            <RegistryManager weddingId={id} initialLinks={registry} />
          </div>

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
