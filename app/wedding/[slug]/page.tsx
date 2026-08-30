import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
        className="relative flex min-h-[26rem] flex-col justify-center overflow-hidden px-5 py-20 text-center text-white sm:min-h-[32rem] sm:py-28"
        style={{
          background:
            "radial-gradient(120% 130% at 80% 10%, rgba(243,103,5,0.35), transparent 55%), linear-gradient(160deg, #2f2622, #1c1512)",
        }}
      >
        {/* The couple's photo sits behind the gradient rather than replacing
            it, so white text stays readable whatever they upload. */}
        {w.cover_image_url && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={w.cover_image_url}
              alt=""
              aria-hidden="true"
              style={{ objectPosition: `center ${w.cover_position ?? 50}%` }}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-ink/70 via-ink/60 to-ink/80" />
          </>
        )}
        <div className="relative">
        <p className="font-display text-xs font-semibold tracking-[0.32em] text-brand">TOGETHER WITH THEIR FAMILIES</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-balance font-display text-5xl font-semibold tracking-wide sm:text-6xl">
          {names}
        </h1>
        {date && <p className="mt-5 text-lg text-white/80">{date}</p>}
        {location && <p className="mt-1 text-sm uppercase tracking-[0.15em] text-white/55">{location}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-xl px-5 py-14">
        {w.welcome_message && (
          <p className="mb-10 whitespace-pre-wrap text-center text-[15px] leading-relaxed text-ink-soft/85">
            {w.welcome_message}
          </p>
        )}
        {/* RSVP is invite-only: replies come through each household's personal
            link, so this shared page no longer carries an open form. The
            database agrees — submit_rsvp's EXECUTE grant was revoked, so an
            open form here could only ever fail. */}
        <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
          <h2 className="text-xl font-medium text-ink">RSVP</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
            Each invitation has its own private link. Please reply using the link in your
            invitation &mdash; if you can&rsquo;t find it, just ask us and we&rsquo;ll send it
            again.
          </p>
        </div>

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
                  className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
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
