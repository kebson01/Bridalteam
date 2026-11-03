import Link from "next/link";

/** The parts of /inspiration around the gallery, shared with local previews. */

export function InspirationHeader({ count }: { count: number }) {
  return (
    <header className="mx-auto max-w-2xl text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
        ✦ Ideas &amp; inspiration
      </span>
      <h1 className="mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
        Find looks you&apos;ll <span className="text-brand-text">love</span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft/80">
        Filter by theme and color, tap any look to see it up close, and save your favorites to your wedding.
      </p>
      {count > 0 && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-stone-4 px-3 py-1 text-xs font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" /> {count} looks curated
        </p>
      )}
    </header>
  );
}

/** The mood board call to action, placed inside the gallery grid. */
export function MoodBoardPromo() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-deep px-6 py-9 text-center text-white shadow-card sm:px-10">
      <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
        </svg>
      </span>
      <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">AI wedding planner</p>
      <h2 className="mx-auto mt-2 max-w-lg text-2xl font-medium leading-snug sm:text-3xl">Want a mood board for your day?</h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-white/85">
        Save the looks you love, then tell the AI planner your vibe. It pulls them into a board with a matching
        palette and vendor ideas.
      </p>
      <Link
        href="/planner"
        className="mt-6 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-text shadow transition-transform hover:-translate-y-0.5"
      >
        ✦ Generate my ideas
      </Link>
      <p className="mt-3 text-xs text-white/70">Free to try</p>
    </div>
  
  );
}
