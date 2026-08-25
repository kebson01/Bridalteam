import Link from "next/link";
import PlannerChat from "./planner-chat";

const QUICK_PROMPTS = [
  "Build me a 12-month planning timeline",
  "Estimate a budget for 120 guests in Austin",
  "What vendors should I book first?",
  "Ideas for a rustic autumn vibe",
];

export default function AIPlanner() {
  return (
    <section id="planner" className="relative overflow-hidden bg-ink py-24">
      <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-dark/25 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-brand/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-amber">
            Live AI demo
          </p>
          <h2 className="mt-3 text-3xl font-light uppercase tracking-wide sm:text-4xl">
            Meet your AI planning assistant
          </h2>
          <p className="mt-4 max-w-md text-white/70">
            This is the heart of the new Bridal Team. Ask anything about your
            wedding and get real, tailored guidance — timelines, budgets,
            checklists and vendor picks — in seconds.
          </p>
          <Link
            href="/planner"
            className="mt-8 inline-flex rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-text shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Open the full planner
          </Link>
        </div>

        <div className="rounded-3xl bg-white/5 p-2">
          <PlannerChat quickPrompts={QUICK_PROMPTS} />
        </div>
      </div>
    </section>
  );
}
