import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MediaPlayer, type InspirationImage } from "@/components/inspiration-gallery";
import LikeButton from "@/components/like-button";
import ShareButton from "@/components/share-button";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

async function getImage(id: string) {
  const supabase = await supabaseServer();
  const [{ data: image }, { data: { user } }] = await Promise.all([
    supabase
      .from("inspiration_images")
      .select("id, image_url, title, theme, colors, media_type, media_url, like_count, vendor_id")
      .eq("id", id)
      .maybeSingle(),
    supabase.auth.getUser(),
  ]);
  let liked = false;
  if (image && user) {
    const { data: like } = await supabase
      .from("inspiration_likes")
      .select("image_id")
      .eq("image_id", id)
      .eq("user_id", user.id)
      .maybeSingle();
    liked = Boolean(like);
  }
  return { image, user, liked };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { image } = await getImage(id);
  if (!image) return { title: "Inspiration" };
  return {
    title: `${image.title} — Wedding Inspiration`,
    description: `A ${image.theme ?? "wedding"} idea on Bridal Team.`,
    openGraph: { images: [image.image_url], title: image.title, url: `${SITE_URL}/i/${image.id}` },
  };
}

export default async function SingleInspirationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { image, user, liked } = await getImage(id);
  if (!image) notFound();

  // Vendor attribution (published only).
  let vendor: { org_id: string; business_name: string } | null = null;
  if (image.vendor_id) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("vendor_profiles")
      .select("org_id, business_name")
      .eq("org_id", image.vendor_id)
      .eq("status", "published")
      .maybeSingle();
    vendor = data;
  }

  const item = image as unknown as InspirationImage;
  const shareUrl = `${SITE_URL}/i/${image.id}`;

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/inspiration" className="text-sm font-semibold text-brand-text hover:text-brand-deep">
        ← All inspiration
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl bg-stone-4 shadow-card">
        <div className="relative flex max-h-[70vh] items-center justify-center bg-black">
          <MediaPlayer item={item} />
        </div>
        <div className="bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-medium text-ink">{image.title}</h1>
              <p className="mt-1 text-sm text-ink-soft/70">
                {[image.theme, image.colors?.join(", ")].filter(Boolean).join(" · ")}
              </p>
              {vendor && (
                <p className="mt-1 text-sm text-ink-soft/60">
                  by <span className="font-medium text-brand-text">{vendor.business_name}</span>
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <LikeButton imageId={image.id} initialLiked={liked} initialCount={image.like_count} signedIn={Boolean(user)} />
              <ShareButton url={shareUrl} title={image.title} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
