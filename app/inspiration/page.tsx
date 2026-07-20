import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import InspirationGallery from "@/components/inspiration-gallery";

export const metadata: Metadata = {
  title: "Wedding Inspiration",
  description:
    "Browse wedding looks by theme and color, then let AI spin up mood boards, palettes and ideas tailored to your style, season and budget.",
};

export default function InspirationPage() {
  return (
    <>
      <PageHero
        eyebrow="Ideas & inspiration"
        title="Find looks you'll love"
        subtitle="Filter by theme and color to shape your vision — then describe your dream day and let AI build a matching mood board and palette."
      />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <InspirationGallery />

        <div className="mt-14 rounded-3xl bg-gradient-to-r from-brand to-brand-dark p-10 text-center text-white">
          <h2 className="text-2xl font-light uppercase tracking-wide sm:text-3xl">
            Want a mood board for your day?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Tell the AI planner your vibe, colors and season — it will generate a
            board, a palette and matching vendor ideas in seconds.
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
