import type { Metadata } from "next";
import { notFound } from "next/navigation";
import RsvpForm from "@/components/wedding/rsvp-form";
import { getPublicWedding, getPublicRegistry } from "@/app/wedding/actions";

export const dynamic = "force-dynamic";

function coupleNames(a: string | null, b: string | null): string {
  return [a, b].filter(Boolean).join(" & ") || "Our Wedding";
}

function formatDate(d: string | null): string | null {
  if (!d) return null;
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const w = await getPublicWedding(slug);
  const names = w ? coupleNames(w.partner_one, w.partner_two) : "Wedding";
  return {
    title: `${names} — You're Invited`,
    description: w?.welcome_message ?? `Celebrate with ${names}. RSVP today.`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicWeddingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const w = await getPublicWedding(slug);
  if (!w) notFound();

  const registry = await getPublicRegistry(slug);
  const names = coupleNames(w.partner_one, w.partner_two);
  const date = formatDate(w.event_date);
  const location = [w.venue, w.city, w.region].filter(Boolean).join(" · ");

  return (
    <>
      {/* Hero */}
      <section
        className="px-5 py-20 text-center text-white sm:py-28"
        style={{
          background:
            "radial-gradient(120% 130% at 80% 10%, rgba(243,103,5,0.35), transparent 55%), linear-gradient(160deg, #2f2622, #1c1512)",
        }}
      >
        <p className="font-display text-xs font-semibold tracking-[0.32em] text-brand">TOGETHER WITH THEIR FAMILIES</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-balance font-display text-5xl font-semibold tracking-wide sm:text-6xl">
          {names}
        </h1>
        {date && <p className="mt-5 text-lg text-white/80">{date}</p>}
        {location && <p className="mt-1 text-sm uppercase tracking-[0.15em] text-white/55">{location}</p>}
      </section>

      <section className="mx-auto max-w-xl px-5 py-14">
        {w.welcome_message && (
          <p className="mb-10 whitespace-pre-wrap text-center text-[15px] leading-relaxed text-ink-soft/85">
            {w.welcome_message}
          </p>
        )}
        <RsvpForm slug={slug} />

        {registry.length > 0 && (
          <div className="mt-12 text-center">
            <h2 className="font-display text-2xl font-semibold text-ink">Registry</h2>
            <p className="mt-1 text-sm text-ink-soft/70">Your presence is the gift — but if you'd like to celebrate with us:</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {registry.map((r) => (
                <a
                  key={r.id}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
                >
                  {r.label}
                </a>
              ))}
            </div>
          </div>
        )}

        <p className="mt-12 text-center text-xs text-ink-soft/40">
          Powered by Bridal Team
        </p>
      </section>
    </>
  );
}
