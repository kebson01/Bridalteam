import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import InspirationGallery, { type InspirationImage } from "@/components/inspiration-gallery";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Wedding Inspiration",
  description:
    "Browse wedding looks by theme and color, save your favorites to your wedding, and share them with your party.",
};

export const dynamic = "force-dynamic";

export default async function InspirationPage() {
  const supabase = await supabaseServer();
  const [{ data: images }, { data: { user } }] = await Promise.all([
    supabase
      .from("inspiration_images")
      .select("id, image_url, title, theme, colors, media_type, media_url")
      .order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <PageHero
        eyebrow="Ideas & inspiration"
        title="Find looks you'll love"
        subtitle="Filter by theme and color, tap any look to see it up close, and save your favorites to your wedding."
      />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <InspirationGallery
          images={(images ?? []) as InspirationImage[]}
          signedIn={Boolean(user)}
        />

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
            className="mt-6 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-brand-dark transition-transform hover:-translate-y-0.5"
          >
            Generate my ideas
          </Link>
        </div>
      </section>
    </>
  );
}
