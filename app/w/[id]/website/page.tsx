import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import WeddingNav from "@/components/wedding-nav";
import WebsiteManager from "@/components/wedding/website-manager";
import { listRsvps } from "@/app/wedding/actions";
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
    .select("id, partner_one, partner_two, public_slug, website_published, welcome_message")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const rsvps = await listRsvps(id);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";
  const attending = rsvps.filter((r) => r.attending);
  const declined = rsvps.filter((r) => !r.attending);
  const headcount = attending.reduce((s, r) => s + r.party_size, 0);

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

          {/* RSVP responses */}
          <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-ink">RSVPs</h2>
              <div className="flex gap-4 text-sm">
                <span className="text-brand-dark">
                  <b>{attending.length}</b> attending
                </span>
                <span className="text-ink-soft/60">
                  <b>{headcount}</b> total guests
                </span>
                <span className="text-ink-soft/60">
                  <b>{declined.length}</b> declined
                </span>
              </div>
            </div>

            {rsvps.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-stone-2 bg-stone-4 p-6 text-center text-sm text-ink-soft/60">
                No RSVPs yet. Publish your site and share the link to start collecting responses.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-stone-2">
                {rsvps.map((r) => (
                  <li key={r.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {r.guest_name}
                        {r.attending && r.party_size > 1 && (
                          <span className="font-normal text-ink-soft/60"> +{r.party_size - 1}</span>
                        )}
                      </p>
                      {r.meal && <p className="text-xs text-ink-soft/60">Meal: {r.meal}</p>}
                      {r.note && <p className="mt-0.5 text-xs italic text-ink-soft/70">“{r.note}”</p>}
                    </div>
                    <span
                      className={`flex-none rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        r.attending ? "bg-brand/10 text-brand-dark" : "bg-stone-4 text-ink-soft/60"
                      }`}
                    >
                      {r.attending ? "Attending" : "Declined"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
