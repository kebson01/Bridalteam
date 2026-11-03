import Link from "next/link";
import PageHero from "@/components/page-hero";
import InspirationGallery, { type InspirationImage } from "@/components/inspiration-gallery";
import { supabaseServer } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/site";
import { arrangeFeed } from "@/lib/seed-content";
import { hasPublishedRealWeddings } from "@/lib/real-weddings";

export const metadata = pageMetadata({
  path: "/inspiration",
  title: "Wedding Inspiration",
  description:
    "Browse wedding looks by theme and color, save your favorites to your wedding, and share them with your party.",
});

export const dynamic = "force-dynamic";

export default async function InspirationPage() {
  const supabase = await supabaseServer();
  const feedQuery = (columns: string) =>
    supabase
      .from("inspiration_images")
      .select(columns)
      // Only curated media and paid vendors' media appear in the public feed.
      .eq("in_feed", true)
      .order("created_at", { ascending: false });
  const BASE = "id, image_url, title, theme, colors, media_type, media_url, like_count, source";

  const [feed, { data: { user } }, showRealWeddings] = await Promise.all([
    feedQuery(`${BASE}, is_seed, retired_at`),
    supabase.auth.getUser(),
    hasPublishedRealWeddings(supabase),
  ]);
  // Until the seed-content migration is applied, is_seed/retired_at don't
  // exist; fall back to the old columns rather than showing an empty feed.
  let rows = feed.data as unknown as InspirationImage[] | null;
  if (feed.error) {
    const fallback = await feedQuery(BASE);
    rows = ((fallback.data ?? []) as unknown as InspirationImage[]).map((r) => ({ ...r, is_seed: r.source === "curated" }));
  }
  const images = arrangeFeed(rows ?? []).items;

  // Which of these has the current user liked?
  let likedIds: string[] = [];
  if (user && images && images.length > 0) {
    const { data: likes } = await supabase
      .from("inspiration_likes")
      .select("image_id")
      .eq("user_id", user.id);
    likedIds = (likes ?? []).map((l) => l.image_id);
  }

  return (
    <>
      <PageHero
        eyebrow="Ideas & inspiration"
        title="Find looks you'll love"
        subtitle="Filter by theme and color, tap any look to see it up close, and save your favorites to your wedding."
      />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <InspirationGallery
          images={images}
          signedIn={Boolean(user)}
          userId={user?.id ?? null}
          likedIds={likedIds}
        />

        {showRealWeddings && (
          <Link
            href="/real-weddings"
            className="mt-14 flex flex-col items-start gap-1 rounded-3xl border border-stone-2 bg-white p-8 shadow-card transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              <span className="block text-xl font-medium text-ink">Real weddings</span>
              <span className="block text-sm text-ink-soft/70">True stories from Florida couples, told with their blessing.</span>
            </span>
            <span className="text-sm font-semibold text-brand-text">Read their stories →</span>
          </Link>
        )}

        <div className="mt-14 rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-10 text-center text-white">
          <h2 className="text-2xl font-light uppercase tracking-wide sm:text-3xl">
            Want a mood board for your day?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Save the looks you love, then tell the AI planner your vibe — it will
            pull them into a board with a matching palette and vendor ideas.
          </p>
          <Link
            href="/planner"
            className="mt-6 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-text transition-transform hover:-translate-y-0.5"
          >
            Generate my ideas
          </Link>
        </div>
      </section>
    </>
  );
}
