import Link from "next/link";
import PlannerChat from "./planner-chat";
import { LAUNCH_CITY } from "@/lib/site";

// The one example city a visitor sees on the homepage. It reads as a signal of
// who the site is for, so it tracks the launch market rather than being
// hard-coded — see LAUNCH_CITY in lib/site.ts.
const QUICK_PROMPTS = [
  "Build me a 12-month planning timeline",
  `Estimate a budget for 120 guests in ${LAUNCH_CITY}`,
  "What vendors should I book first?",
  "Ideas for a rustic autumn vibe",
];

export default function AIPlanner() {
  return (
    <section id="planner" className="scroll-mt-24 py-16">
      <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-28">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand-wash px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-text">
            <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-brand" /> Live AI assistant
          </span>
          <h2 className="mt-4 text-3xl font-medium leading-tight text-ink sm:text-4xl">
            Meet your 24/7 <span className="text-brand-text">planning team</span>
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-ink-soft/80">
            Ask anything about your wedding and get real, tailored guidance in seconds: timelines, budgets, checklists
            and what to book first. Try it right here.
          </p>
          <Link
            href="/planner"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Open the full planner <span aria-hidden>→</span>
          </Link>
          {/* Couples can also plan with their own assistant over MCP: /connect-your-ai. */}
          <Link
            href="/connect-your-ai"
            className="mt-6 flex max-w-md items-start gap-3 rounded-2xl border border-stone-2 bg-white p-4 text-left shadow-sm transition-colors hover:border-brand/50"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-wash text-brand-text" aria-hidden>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M9 7V3M15 7V3M7 7h10v4a5 5 0 0 1-10 0V7zM12 16v5" />
              </svg>
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Prefer ChatGPT or Claude?</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-ink-soft/80">
                Connect your favorite AI to your wedding and plan by asking it.{" "}
                <span className="font-semibold text-brand-text">See how →</span>
              </span>
            </span>
          </Link>
        </div>

        {/* min-w-0: a grid item won't shrink below its content otherwise, and the
            one-line row of prompt chips would stretch the page past the screen. */}
        <div className="min-w-0">
          <PlannerChat quickPrompts={QUICK_PROMPTS} />
        </div>
      </div>
    </section>
  );
}
