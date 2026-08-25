import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import JsonLd from "@/components/json-ld";
import {
  guideArticleSchema,
  faqSchema,
  breadcrumbSchema,
} from "@/lib/structured-data";
import { GUIDES, getGuide } from "@/lib/guides";
import type { Block } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return { title: "Not found" };

  return {
    title: guide.title,
    description: guide.excerpt,
    keywords: guide.keywords,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.title,
      description: guide.excerpt,
      url: `${SITE_URL}/guides/${guide.slug}`,
      publishedTime: guide.updated,
      modifiedTime: guide.updated,
    },
  };
}

function BlockView({ block }: { block: Block }) {
  if ("h2" in block) {
    return <h2 className="mt-10 text-xl font-medium text-ink">{block.h2}</h2>;
  }
  if ("ul" in block) {
    return (
      <ul className="mt-4 space-y-2">
        {block.ul.map((item, i) => (
          <li key={i} className="flex gap-3 text-ink-soft/85">
            <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-brand" />
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  return <p className="mt-4 leading-relaxed text-ink-soft/85">{block.p}</p>;
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();

  const more = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);

  return (
    <>
      <JsonLd data={guideArticleSchema(guide)} />
      <JsonLd data={faqSchema(guide.faqs)} />
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ])}
      />

      <PageHero eyebrow={guide.category} title={guide.title} />

      <article className="mx-auto max-w-2xl px-5 py-14">
        <p className="text-sm text-ink-soft/60">{guide.readMinutes} min read</p>
        <p className="mt-6 text-lg leading-relaxed text-ink-soft/90">{guide.intro}</p>

        <div className="mt-2">
          {guide.body.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>

        {guide.faqs.length > 0 && (
          <div className="mt-12 border-t border-stone-2 pt-10">
            <h2 className="text-xl font-medium text-ink">Frequently asked questions</h2>
            <dl className="mt-6 space-y-6">
              {guide.faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium text-ink">{f.q}</dt>
                  <dd className="mt-2 leading-relaxed text-ink-soft/85">{f.a}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-8 text-center text-white">
          <h2 className="text-xl font-light uppercase tracking-wide">
            Turn this into your plan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            Tell the AI planner about your wedding and get a timeline, budget and
            checklist built around it.
          </p>
          <Link
            href="/planner"
            className="mt-5 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-text transition-transform hover:-translate-y-0.5"
          >
            Try the AI planner
          </Link>
        </div>
      </article>

      <section className="border-t border-stone-2 bg-stone-4 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
            More guides
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {more.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-text">
                  {g.category}
                </span>
                <h3 className="mt-2 text-base font-medium leading-snug text-ink">{g.title}</h3>
                <span className="mt-3 text-sm font-semibold text-brand-text">Read more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
