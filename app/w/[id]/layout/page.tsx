import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import WeddingNav from "@/components/wedding-nav";
import FlashBanner from "@/components/flash-banner";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import { isApproximate, sanitizeItems, seatTotal, tableCount } from "@/lib/venue-layout";
import { createLayout, listLayouts } from "./actions";

export const metadata: Metadata = {
  title: "Venue layout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LayoutsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const flash = flashFrom(await searchParams);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/layout`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const layouts = await listLayouts(id);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Venue layout</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="layout" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <FlashBanner message={flash} />
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-soft/80">
          See the room from above before anything is booked. Upload your venue&rsquo;s floor plan
          &mdash; or a photo of the room &mdash; set its size, and drag tables, the dance floor and
          the bar into place. Everyone on your team can open it, including your planner.
        </p>

        {layouts === null ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Couldn&rsquo;t load your layouts. Please refresh the page.
          </p>
        ) : (
          <>
            {layouts.length > 0 && (
              <ul className="mb-8 grid gap-4 sm:grid-cols-2">
                {layouts.map((l) => {
                  const items = sanitizeItems(l.items, l.width_ft, l.length_ft);
                  return (
                    <li key={l.id}>
                      <Link
                        href={`/w/${id}/layout/${l.id}`}
                        className="block overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card transition-colors hover:border-brand"
                      >
                        <div className="aspect-[3/2] bg-stone-4">
                          {l.base_image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={l.base_image_url} alt="" className="h-full w-full object-cover" />
                          )}
                        </div>
                        <div className="p-4">
                          <p className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                            {l.name}
                            {isApproximate(l.floor_source) && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 font-body text-xs font-semibold text-amber-800">
                                Approximate
                              </span>
                            )}
                          </p>
                          <p className="mt-1 text-sm text-ink-soft/70">
                            {l.width_ft} × {l.length_ft} ft · {tableCount(items)} tables ·{" "}
                            {seatTotal(items)} seats
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <form
              action={createLayout.bind(null, id)}
              className="flex flex-col gap-3 rounded-2xl border border-stone-2 bg-white p-6 shadow-card sm:flex-row sm:items-end"
            >
              <label className="block flex-1">
                <span className="text-sm font-medium text-ink-soft">
                  {layouts.length ? "Add another space" : "Start your first layout"}
                </span>
                <input
                  name="name"
                  maxLength={80}
                  placeholder={layouts.length ? "Ceremony, Cocktail hour…" : "Reception"}
                  className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
                />
              </label>
              <button className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep">
                Create layout
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
