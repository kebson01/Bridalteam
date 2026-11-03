import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "@/components/page-hero";
import { supabasePublic } from "@/lib/supabase";
import { pageMetadata } from "@/lib/site";
import { formatWeddingDate, listRealWeddings } from "@/lib/real-weddings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const stories = await listRealWeddings(supabasePublic());
  return {
    ...pageMetadata({
      path: "/real-weddings",
      title: "Real Weddings",
      description: "True wedding stories from Florida couples: their venues, their vendors and the moments they remember.",
    }),
    // Nothing to index until the first story is published.
    ...(stories.length === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function RealWeddingsPage() {
  const stories = await listRealWeddings(supabasePublic());

  return (
    <>
      <PageHero
        eyebrow="Real weddings"
        title="Their day, in their words"
        subtitle="True stories from Florida couples, shared with their blessing and their photographers credited."
      />

      <section className="mx-auto max-w-6xl px-5 py-14">
        {stories.length === 0 ? (
          <p className="text-center text-ink-soft/70">
            The first stories are on their way.{" "}
            <Link href="/inspiration" className="font-semibold text-brand-text">
              Browse inspiration
            </Link>{" "}
            in the meantime.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2">
            {stories.map((s) => (
              <Link
                key={s.id}
                href={`/real-weddings/${s.slug}`}
                className="group overflow-hidden rounded-3xl bg-white shadow-card transition-transform hover:-translate-y-0.5"
              >
                {s.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.cover_url} alt={s.title} className="aspect-[4/3] w-full object-cover" loading="lazy" />
                )}
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">
                    {formatWeddingDate(s.wedding_date)} · {s.city}
                  </p>
                  <h2 className="mt-2 text-xl font-medium text-ink">{s.title}</h2>
                  {s.summary && <p className="mt-2 text-sm text-ink-soft/80">{s.summary}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
