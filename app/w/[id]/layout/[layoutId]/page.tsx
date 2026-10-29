import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LayoutEditor from "@/components/layout/layout-editor";
import FlashBanner from "@/components/flash-banner";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import { sanitizeItems } from "@/lib/venue-layout";
import { getLayout, seatedByTable } from "../actions";

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
  const flash = flashFrom(await searchParams);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/layout/${layoutId}`);

  const [layout, seated, { data: guests }] = await Promise.all([
    getLayout(id, layoutId),
    seatedByTable(id),
    supabase.from("wedding_guests").select("seats").eq("wedding_id", id),
  ]);
  if (!layout) notFound();

  // Invited seats, not RSVPs: the room has to fit everyone who might say yes.
  const invited = (guests ?? []).reduce((s, g) => s + ((g.seats as number) ?? 0), 0);

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <Link href={`/w/${id}/layout`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
          ← All layouts
        </Link>
        <div className="mt-4">
          <FlashBanner message={flash} />
          <LayoutEditor
            weddingId={id}
            layoutId={layout.id}
            initialName={layout.name}
            initialImageUrl={layout.base_image_url}
            initialWidth={layout.width_ft}
            initialLength={layout.length_ft}
            initialItems={sanitizeItems(layout.items, layout.width_ft, layout.length_ft)}
            seatedByTable={seated ?? {}}
            invitedSeats={invited}
          />
        </div>
      </div>
    </div>
  );
}
