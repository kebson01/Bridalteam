const PILLARS = [
  {
    tag: "Plan",
    title: "AI wedding planner",
    body: "Your own planning assistant builds timelines, checklists and to-dos from a few details — and keeps your whole team in sync.",
    icon: (
      <path d="M7 3v3M17 3v3M4 9h16M5 7h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm3 6 2 2 4-4" />
    ),
  },
  {
    tag: "Discover",
    title: "Know who to book, and when",
    body: "Tell the AI planner your style, budget and city and it tells you which vendors to book first, what to ask them, and what a fair price looks like.",
    icon: <path d="m21 21-4.3-4.3M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />,
  },
  {
    tag: "Create",
    title: "Ideas & mood boards",
    body: "Browse real wedding photography by theme and colour, then save the looks you love to a mood board your whole wedding party can see.",
    icon: (
      <path d="M12 3v4m0 10v4M5 12H1m22 0h-4M6.3 6.3 4 4m16 16-2.3-2.3M6.3 17.7 4 20M20 4l-2.3 2.3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
    ),
  },
  {
    tag: "Budget",
    title: "Budget & RSVPs",
    body: "Turn your total into a realistic category breakdown — including the costs first-timers forget — then track what you actually spend and collect RSVPs on your wedding website.",
    icon: (
      <path d="M3 6h18v12H3zM3 10h18M7 15h4M12 3a3 3 0 0 1 0 6 3 3 0 0 1 0-6Z" />
    ),
  },
];

export default function Pillars() {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-text">
          One place. A whole team.
        </p>
        <h2 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink sm:text-4xl">
          Everything you need to plan — now with AI
        </h2>
        <p className="mt-4 text-ink-soft/80">
          The same simple, collaborative Bridal Team you loved, rebuilt for
          today and powered by an AI team that never sleeps.
        </p>
      </div>

      <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <article
            key={p.title}
            className="group rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-dark text-white">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {p.icon}
              </svg>
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-brand-text">
              {p.tag}
            </p>
            <h3 className="mt-1 text-lg font-medium text-ink">{p.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">
              {p.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
