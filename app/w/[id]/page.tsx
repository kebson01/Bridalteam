import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TaskList, { type GroupedPlan, type TaskRow } from "@/components/task-list";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";
import { TEMPLATE_TASK_COUNT } from "@/lib/plan-template";
import { seedExpertPlan } from "./actions";
import GeneratePlanButton from "@/components/generate-plan-button";

export const metadata: Metadata = {
  title: "Your Plan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000);
}

function longDate(date: string | null) {
  if (!date) return "Date not set";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function money(cents: number | null, currency: string) {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function Stat({
  label,
  value,
  sub,
  href,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-light text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft/60">{sub}</p>}
    </>
  );
  const cls = "rounded-2xl border border-stone-2 bg-white p-5 shadow-card";
  if (href) {
    return (
      <Link href={href} className={`${cls} block transition-transform hover:-translate-y-0.5`}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export default async function WeddingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}`);

  // RLS decides this: no row means no access, which is the same as not existing.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, venue, guest_count, budget_cents, currency, style")
    .eq("id", id)
    .maybeSingle();

  if (!wedding) notFound();

  const [{ data: milestones }, { data: deliverables }, { data: tasks }] = await Promise.all([
    supabase.from("milestones").select("id, name, target_date, position").eq("wedding_id", id).order("position"),
    supabase.from("deliverables").select("id, name, milestone_id, position").eq("wedding_id", id).order("position"),
    supabase
      .from("tasks")
      .select("id, title, due_date, completed_at, deliverable_id, position")
      .eq("wedding_id", id)
      .is("deleted_at", null)
      .order("position"),
  ]);

  const allTasks = (tasks ?? []) as TaskRow[];

  const plan: GroupedPlan[] = (milestones ?? [])
    .map((m) => ({
      milestone: m,
      deliverables: (deliverables ?? [])
        .filter((d) => d.milestone_id === m.id)
        .map((d) => ({
          id: d.id,
          name: d.name,
          tasks: allTasks.filter((t) => t.deliverable_id === d.id),
        }))
        .filter((d) => d.tasks.length > 0),
    }))
    .filter((g) => g.deliverables.length > 0);

  const groupedIds = new Set(
    plan.flatMap((g) => g.deliverables.flatMap((d) => d.tasks.map((t) => t.id))),
  );
  const loose = allTasks.filter((t) => !groupedIds.has(t.id));
  if (loose.length > 0) {
    plan.push({
      milestone: plan.length > 0 ? { id: "other", name: "Everything else", target_date: null } : null,
      deliverables: [{ id: null, name: null, tasks: loose }],
    });
  }

  const names =
    [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";
  const days = daysUntil(wedding.event_date);
  const done = allTasks.filter((t) => t.completed_at).length;
  const pct = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
  const budget = money(wedding.budget_cents, wedding.currency ?? "USD");
  const locationLine = [wedding.venue, wedding.city].filter(Boolean).join(" · ");

  const countdownValue =
    days == null ? "—" : days < 0 ? "🎉" : days === 0 ? "Today" : String(days);
  const countdownSub =
    days == null ? "Add your date" : days < 0 ? "Congratulations!" : days === 0 ? "It's the day!" : "days to go";

  return (
    <div className="bg-stone-4/40">
      {/* Header band */}
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-5xl px-5 py-8">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-dark hover:text-brand-deep">
            ← All weddings
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-light uppercase tracking-wide text-ink sm:text-4xl">
                {names}
              </h1>
              <p className="mt-1 text-sm text-ink-soft/70">{longDate(wedding.event_date)}</p>
              {locationLine && (
                <p className="text-sm text-ink-soft/70">{locationLine}</p>
              )}
            </div>
            {wedding.style && (
              <span className="rounded-full bg-brand/10 px-4 py-1.5 text-sm font-medium text-brand-dark">
                {wedding.style}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-10">
        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Countdown" value={countdownValue} sub={countdownSub} />
          <Stat
            label="Progress"
            value={`${pct}%`}
            sub={allTasks.length > 0 ? `${done} of ${allTasks.length} done` : "No tasks yet"}
          />
          <Stat
            label="Guests"
            value={wedding.guest_count != null ? String(wedding.guest_count) : "—"}
            sub={wedding.guest_count != null ? "expected" : "Not set"}
          />
          <Stat
            label="Budget"
            value={budget ?? "—"}
            sub={budget ? "manage →" : "set it up →"}
            href={`/w/${id}/budget`}
          />
        </div>

        {/* Progress bar */}
        {allTasks.length > 0 && (
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-stone-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}

        {/* Kickstart CTA — the fastest ways to fill an empty plan */}
        {allTasks.length < 3 && (
          <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Start your plan
              </p>
              <h2 className="mt-2 text-2xl font-light">
                Not sure where to begin? We&rsquo;ll set it up for you.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Get a complete, expert wedding plan — every stage from “just
                engaged” to the big day, the events around it, and the details
                first-timers miss — with deadlines built from your date.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <GeneratePlanButton
                  weddingId={id}
                  className="w-full rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-dark transition-transform hover:-translate-y-0.5 disabled:opacity-70 sm:w-auto"
                >
                  ✨ Build my plan with AI
                </GeneratePlanButton>
                <form action={seedExpertPlan}>
                  <input type="hidden" name="wedding_id" value={id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                  >
                    Or use the expert checklist ({TEMPLATE_TASK_COUNT} steps)
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tasks */}
        <div className="mt-10">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-lg font-medium text-ink">Your checklist</h2>
            {allTasks.length > 0 && (
              <span className="text-sm text-ink-soft/60">
                {allTasks.length - done} left
              </span>
            )}
          </div>
          <TaskList plan={plan} weddingId={id} />
        </div>
      </div>
    </div>
  );
}
