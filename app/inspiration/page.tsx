import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageHero from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Wedding Inspiration",
  description:
    "Browse real wedding inspiration and let AI spin up mood boards, palettes and ideas tailored to your style, season and budget.",
};

const GALLERY = [
  { img: "/brand/highlight1.jpg", title: "Rustic & warm", tag: "Amber tones · candlelight" },
  { img: "/brand/highlight2.jpg", title: "Modern minimal", tag: "Clean lines · statement florals" },
  { img: "/brand/highlight3.jpg", title: "Garden romance", tag: "Greenery · natural light" },
  { img: "/brand/hero.jpg", title: "Coastal & airy", tag: "Neutrals · sea breeze" },
  { img: "/brand/highlight1.jpg", title: "Autumn vineyard", tag: "Dried florals · string lights" },
  { img: "/brand/highlight2.jpg", title: "City chic", tag: "Rooftop · golden hour" },
];

export default function InspirationPage() {
  return (
    <>
      <PageHero
        eyebrow="AI content & inspiration"
        title="Find ideas you'll love"
        subtitle="Real looks to spark your vision — then describe your dream day and let AI build a matching mood board and palette."
      />

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((g, i) => (
            <figure
              key={`${g.title}-${i}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card"
            >
              <Image
                src={g.img}
                alt={g.title}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-lg font-medium">{g.title}</p>
                <p className="text-sm text-white/75">{g.tag}</p>
              </figcaption>
            </figure>
          ))}
        </div>

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
