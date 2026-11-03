/** "What your AI planner can do", under the /planner chat. */

const FEATURES: { title: string; body: string; icon: string }[] = [
  {
    title: "Tailored timelines",
    body: "A month-by-month plan tuned to your date, from the first deposit to the final fitting.",
    icon: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4M8 14h3",
  },
  {
    title: "Realistic budgets",
    body: "Estimates and category splits for your city and guest count, so nothing surprises you later.",
    icon: "M12 3v18M16.5 7.5c0-1.7-2-3-4.5-3s-4.5 1.3-4.5 3S9.5 10 12 10.5s4.5 1.3 4.5 3.5-2 3.5-4.5 3.5-4.5-1.3-4.5-3",
  },
  {
    title: "Shared checklists",
    body: "The right to-dos at the right time, shared with your partner and the people helping you.",
    icon: "M9 6h11M9 12h11M9 18h11M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2",
  },
  {
    title: "Vendor strategy",
    body: "Who to book first, what to ask each vendor, and what to check before you sign.",
    icon: "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M17 11a2.5 2.5 0 1 0 0-5M16 14.5c2.8.2 5 2.5 5 5.5",
  },
];

export default function PlannerFeatures() {
  return (
    <section className="mx-auto max-w-4xl px-5 pb-20 pt-4">
      <div className="text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">Your planning team</p>
        <h2 className="mt-2 text-3xl font-medium text-ink sm:text-4xl">What your AI planner can do</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft/75">
          Everything you need to plan a calm, well-run wedding, without the overwhelm.
        </p>
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {FEATURES.map((f) => (
          <li key={f.title} className="flex gap-4 rounded-2xl border border-stone-2 bg-white p-5 shadow-sm">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand-text">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"
                strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <path d={f.icon} />
              </svg>
            </span>
            <div>
              <h3 className="text-lg font-medium text-ink">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">{f.body}</p>
            </div>
          </li>
        ))}
        <li className="flex gap-4 rounded-2xl bg-gradient-to-br from-brand-dark to-brand-deep p-5 text-white shadow-card sm:col-span-2">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <path d="M12 3l1.9 5.6L19.5 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z" />
            </svg>
          </span>
          <div>
            <h3 className="text-lg font-medium">Adds it directly for you</h3>
            <p className="mt-1 text-sm leading-relaxed text-white/90">
              Signed in, one tap adds the checklist, budget, vendors or guests it suggests to your wedding. Nothing is
              saved without you.
            </p>
          </div>
        </li>
      </ul>
    </section>
  );
}

export function PlannerHeader() {
  return (
    <header className="text-center">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
        ✦ Your AI planning team<span className="hidden sm:inline"> · Guidance any time</span>
      </span>
      <h1 className="mt-4 text-4xl font-medium leading-tight text-ink sm:text-5xl">
        AI Wedding <span className="text-brand-text">Planner</span>
      </h1>
      <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-ink-soft/80">
        Ask anything about your big day and get real, tailored guidance in seconds: timelines, budgets, checklists and
        what to book first.
      </p>
    </header>
  );
}
