import Image from "next/image";

const BLOCKS = [
  {
    img: "/brand/highlight1.jpg",
    tag: "Organize",
    title: "Every detail, in one place",
    body: "Timelines, checklists, budgets and documents live together — no more scattered spreadsheets and screenshots. Your AI assistant keeps it all current as plans change.",
  },
  {
    img: "/brand/highlight2.jpg",
    tag: "Collaborate",
    title: "Plan with your whole team",
    body: "Invite your partner, family and vendors. Everyone sees the same plan, gets the right to-dos, and stays in sync from engagement to 'I do'.",
  },
  {
    img: "/brand/highlight3.jpg",
    tag: "Inspire",
    title: "Find ideas you'll love",
    body: "Describe your dream day and let AI spin up mood boards, palettes and real vendor ideas that match your style, season and budget.",
  },
];

export default function Highlights() {
  return (
    <section id="inspiration" className="bg-stone-4 py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-16 px-5">
        {BLOCKS.map((b, i) => (
          <div
            key={b.title}
            className={`grid items-center gap-8 lg:grid-cols-2 ${
              i % 2 === 1 ? "lg:[&>figure]:order-2" : ""
            }`}
          >
            <figure className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-card">
              <Image
                src={b.img}
                alt={b.title}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/25 to-transparent" />
            </figure>
            <div className={i % 2 === 1 ? "lg:pr-8" : "lg:pl-8"}>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-dark">
                {b.tag}
              </p>
              <h3 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">
                {b.title}
              </h3>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft/80">
                {b.body}
              </p>
              <a
                href="#planner"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-dark transition-colors hover:text-brand-deep"
              >
                Try it with AI
                <span aria-hidden>→</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
