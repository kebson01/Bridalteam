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
import { SHOW_PLANNER_APP } from "@/lib/flags";
import { SITE_URL } from "@/lib/site";

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
  if (!SHOW_PLANNER_APP) notFound();
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/website`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, public_slug, website_published, welcome_message, cover_image_url, cover_position")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const registry = await listRegistryLinks(id);
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
