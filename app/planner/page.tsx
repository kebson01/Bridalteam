import PageHero from "@/components/page-hero";
import PlannerChat from "@/components/planner-chat";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/planner",
  title: "AI Wedding Planner",
  description:
    "Chat with your AI planning assistant for timelines, budgets, checklists and vendor ideas tailored to your wedding.",
});

const FEATURES = [
  ["Timelines", "A month-by-month plan tuned to your date."],
  ["Budgets", "Realistic estimates and category breakdowns."],
  ["Checklists", "The right to-dos, shared with your team."],
  ["Vendor ideas", "Who to book first and what to ask."],
  ["Adds it for you", "Signed in, it can add the checklist, budget, vendors or guests it suggests — one tap, nothing saved without you."],
];

const PROMPTS = [
  "Build me a checklist for the next 3 months",
  "Estimate a budget for 150 guests in Miami",
  "What should I book first?",
  "Ideas for a modern minimalist wedding",
  "Help me write a day-of schedule",
];

export default function PlannerPage() {
  return (
    <>
      <PageHero
        eyebrow="Your AI planning team"
        title="AI Wedding Planner"
        subtitle="Ask anything about your big day and get real, tailored guidance in seconds — timelines, budgets, checklists and what to book first."
      />

      <section className="mx-auto max-w-4xl px-5 py-16">
        <PlannerChat quickPrompts={PROMPTS} heightClass="h-[30rem]" />
      </section>

      <section className="border-t border-stone-2 bg-stone-4 py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center text-2xl font-light uppercase tracking-wide text-ink">
            What it can do
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {FEATURES.map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card"
              >
                <h3 className="text-lg font-medium text-brand-text">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
