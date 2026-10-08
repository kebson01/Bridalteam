export default function PageHero({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-brand-soft">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-brand-amber/10 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-5 py-20 text-center text-ink">
        {eyebrow && (
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b34a04]">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-3 text-4xl font-light uppercase tracking-wide sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-5 max-w-2xl text-lg font-light text-ink-soft">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
