/** The top of /vendors, shared with local previews. */
export default function VendorDirectoryHeader({ count }: { count: number }) {
  return (
    <header className="max-w-2xl">
      {count > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
          Florida wedding directory · {count} vendors
        </span>
      )}
      <h1 className="mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
        Find your <span className="text-brand-text">dream wedding</span> team
      </h1>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-soft/80">
        Browse venues, photographers, florists, DJs and more across Florida. See their work and packages, save your
        favorites, and reach out.
      </p>
    </header>
  );
}
