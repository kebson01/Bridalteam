import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import WeddingNav from "@/components/wedding-nav";
import SavedBoard, { type SavedItem } from "@/components/saved-board";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Ideas",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function IdeasPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/ideas`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const { data: saved } = await supabase
    .from("saved_inspiration")
    .select("image_id, inspiration_images(id, image_url, title, theme, colors)")
    .eq("wedding_id", id)
    .order("created_at", { ascending: false });

  const items: SavedItem[] = (saved ?? [])
    .map((s) => s.inspiration_images as unknown as SavedItem)
    .filter(Boolean);

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-dark hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Saved ideas</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="ideas" />
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-2 bg-white p-12 text-center">
            <h2 className="text-lg font-medium text-ink">No saved ideas yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
              Browse inspiration and tap the ♥ to save looks here. Everyone on your
              wedding can see the board.
            </p>
            <Link
              href="/inspiration"
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
            >
              Browse inspiration
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-ink-soft/70">
              {items.length} saved {items.length === 1 ? "look" : "looks"} · everyone
              on your wedding can see these.
            </p>
            <SavedBoard items={items} weddingId={id} />
          </>
        )}
      </div>
    </div>
  );
}
