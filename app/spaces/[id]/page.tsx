import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import SpaceEditor, { type Product } from "@/components/spaces/space-editor";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";
import type { SpaceItem } from "@/app/spaces/actions";

export const metadata: Metadata = {
  title: "Space",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SpacePage({ params }: { params: Promise<{ id: string }> }) {
  if (!SHOW_PLANNER_APP) notFound();
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS returns the space only if the viewer owns it or it's public.
  const { data: space } = await supabase
    .from("spaces")
    .select("id, owner_id, title, base_image_url, base_type, is_public")
    .eq("id", id)
    .maybeSingle();
  if (!space) notFound();

  const isOwner = !!user && user.id === space.owner_id;

  const { data: itemRows } = await supabase
    .from("space_items")
    .select("id, source_image_url, label, x, y, scale, rotation, z")
    .eq("space_id", id)
    .order("z", { ascending: true });
  const items = (itemRows ?? []) as SpaceItem[];

  // Products to place — the shared gallery. Only needed for the owner/editor.
  let products: Product[] = [];
  if (isOwner) {
    const { data: media } = await supabase
      .from("inspiration_images")
      .select("image_url, title")
      .eq("in_feed", true)
      .order("created_at", { ascending: false })
      .limit(80);
    products = (media ?? []) as Product[];
  }

  return (
    <>
      <PageHero eyebrow={isOwner ? "Your space" : "Shared space"} title={space.title} />
      <section className="mx-auto max-w-3xl px-5 py-10">
        <SpaceEditor
          spaceId={space.id}
          baseImageUrl={space.base_image_url}
          initialItems={items}
          products={products}
          isPublic={space.is_public}
          readOnly={!isOwner}
        />
      </section>
    </>
  );
}
