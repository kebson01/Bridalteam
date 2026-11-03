import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { supabasePublic } from "@/lib/supabase";
import { pageMetadata } from "@/lib/site";
import { formatWeddingDate, getRealWedding, photographerCredit, storyParagraphs, type RealWeddingVendor } from "@/lib/real-weddings";

function VendorName({ vendor }: { vendor: RealWeddingVendor }) {
  if (!vendor.url || !/^https?:\/\//i.test(vendor.url)) return <>{vendor.name}</>;
  return (
    <a href={vendor.url} className="text-brand-text hover:text-brand-deep" rel="noopener">
      {vendor.name}
    </a>
  );
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await getRealWedding(supabasePublic(), slug);
  if (!story) return { title: "Real Weddings" };
  return pageMetadata({
    path: `/real-weddings/${story.slug}`,
    title: story.title,
    description:
      story.summary ??
      `${story.couple_names} were married on ${formatWeddingDate(story.wedding_date)} in ${story.city}.`,
    images: story.cover_url ? [story.cover_url] : undefined,
  });
}

export default async function RealWeddingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await getRealWedding(supabasePublic(), slug);
  if (!story) notFound();

  const place = [story.venue, story.city].filter(Boolean).join(", ");
  const { credit, otherVendors } = photographerCredit(story);

  return (
    <article className="mx-auto max-w-3xl px-5 py-12">
      <Link href="/real-weddings" className="text-sm font-semibold text-brand-text hover:text-brand-deep">
        ← All real weddings
      </Link>

      <header className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
          {formatWeddingDate(story.wedding_date)} · {place}
        </p>
        <h1 className="mt-2 text-3xl font-light text-ink sm:text-4xl">{story.title}</h1>
        <p className="mt-2 text-ink-soft/70">{story.couple_names}</p>
      </header>

      {story.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.cover_url} alt={story.title} className="mt-8 w-full rounded-3xl object-cover shadow-card" />
      )}

      <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-soft">
        {storyParagraphs(story.story).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {story.photos.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {story.photos.map((photo) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={photo.url}
              src={photo.url}
              alt={photo.alt}
              loading="lazy"
              className="w-full rounded-2xl object-cover shadow-card"
            />
          ))}
        </div>
      )}

      {(otherVendors.length > 0 || credit) && (
        <section className="mt-12 rounded-3xl border border-stone-2 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft/60">The team behind the day</h2>
          <ul className="mt-3 space-y-1.5 text-ink-soft">
            {credit && (
              <li>
                <span className="font-medium text-ink">Photography:</span> <VendorName vendor={credit} />
              </li>
            )}
            {otherVendors.map((v) => (
              <li key={`${v.role}-${v.name}`}>
                <span className="font-medium text-ink">{v.role}:</span> <VendorName vendor={v} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-10 text-sm text-ink-soft/60">
        Shared with the couple&apos;s permission. Photos by{" "}
        {credit ? <VendorName vendor={credit} /> : "the couple's photographer"}.
      </p>
    </article>
  );
}
