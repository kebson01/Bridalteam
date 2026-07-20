import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/components/page-hero";
import { POSTS, POSTS_BY_DATE, getPost, type Block } from "@/lib/blog";
import { SITE_URL } from "@/lib/site";

// Pre-render every article at build time.
export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      publishedTime: post.date,
    },
  };
}

function formatDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const more = POSTS_BY_DATE.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <PageHero eyebrow={post.category} title={post.title} />

      <article className="mx-auto max-w-2xl px-5 py-14">
        <p className="text-sm text-ink-soft/60">
          {formatDate(post.date)} · {post.readMinutes} min read
        </p>

        <div className="mt-6">
          {post.body.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-brand to-brand-dark p-8 text-center text-white">
          <h2 className="text-xl font-light uppercase tracking-wide">
            Put this into a real plan
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/85">
            Tell the AI planner about your day and get a timeline, budget and
            checklist built around it.
          </p>
          <Link
            href="/planner"
            className="mt-5 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark transition-transform hover:-translate-y-0.5"
          >
            Try the AI planner
          </Link>
        </div>
      </article>

      <section className="border-t border-stone-2 bg-stone-4 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
            Keep reading
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {more.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-dark">
                  {p.category}
                </span>
                <h3 className="mt-2 text-base font-medium leading-snug text-ink">{p.title}</h3>
                <span className="mt-3 text-sm font-semibold text-brand-dark">Read more →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
