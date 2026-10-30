import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LayoutEditor from "@/components/layout/layout-editor";
import FlashBanner from "@/components/flash-banner";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import { FLOOR_SOURCES, sanitizeItems, type FloorSource } from "@/lib/venue-layout";
import { getLayout, listSeatGuests } from "../actions";

export const metadata: Metadata = {
  title: "Venue layout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LayoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; layoutId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, layoutId } = await params;
  const sp = await searchParams;
  const flash = flashFrom(sp);
  const setup = typeof sp.setup === "string" && FLOOR_SOURCES.includes(sp.setup as FloorSource) ? (sp.setup as FloorSource) : null;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/layout/${layoutId}`);

  const [layout, guests, { data: households }, { data: wedding }] = await Promise.all([
    getLayout(id, layoutId),
    listSeatGuests(id),
    supabase.from("wedding_guests").select("seats").eq("wedding_id", id),
    supabase.from("weddings").select("partner_one, partner_two").eq("id", id).maybeSingle(),
  ]);
  if (!layout) notFound();

  // Invited seats, not RSVPs: the room has to fit everyone who might say yes.
  const invited = (households ?? []).reduce((s: number, g: { seats: number | null }) => s + (g.seats ?? 0), 0);
  const couple = [wedding?.partner_one, wedding?.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5">
        <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em]">
          <Link href={`/w/${id}/layout`} className="text-ink-soft/60 hover:text-brand-text">
            ← {couple || "Wedding"} · Spaces
          </Link>
          <span className="text-ink-soft/30" aria-hidden>
            /
          </span>
          <span className="text-brand-text">{layout.name}</span>
        </nav>
        <div className="mt-3">
          <FlashBanner message={flash} />
          <LayoutEditor
            weddingId={id}
            layoutId={layout.id}
            initialName={layout.name}
            initialImageUrl={layout.base_image_url}
            initialSource={layout.floor_source}
            initialWidth={layout.width_ft}
            initialLength={layout.length_ft}
            initialItems={sanitizeItems(layout.items, layout.width_ft, layout.length_ft)}
            guests={guests}
            invitedSeats={invited}
            initialSetup={setup}
          />
        </div>
      </div>
    </div>
  );
}
