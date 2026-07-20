import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TaskList, { type GroupedPlan, type TaskRow } from "@/components/task-list";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Your Plan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function countdown(date: string | null) {
  if (!date) return null;
  const days = Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "Congratulations!";
  if (days === 0) return "Today!";
  return `${days} ${days === 1 ? "day" : "days"} to go`;
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
    .select("id, partner_one, partner_two, event_date, city")
    .eq("id", id)
    .maybeSingle();

  if (!wedding) notFound();

  const [{ data: milestones }, { data: deliverables }, { data: tasks }] = await Promise.all([
    supabase
      .from("milestones")
      .select("id, name, target_date, position")
      .eq("wedding_id", id)
      .order("position"),
    supabase
      .from("deliverables")
      .select("id, name, milestone_id, position")
      .eq("wedding_id", id)
      .order("position"),
    supabase
      .from("tasks")
      .select("id, title, due_date, completed_at, deliverable_id, position")
      .eq("wedding_id", id)
      .is("deleted_at", null)
      .order("position"),
  ]);

  const allTasks = (tasks ?? []) as TaskRow[];

  // Group tasks under their deliverable and milestone. Anything unassigned
  // falls into a trailing bucket rather than disappearing.
  const plan: GroupedPlan[] = (milestones ?? []).map((m) => ({
    milestone: m,
    deliverables: (deliverables ?? [])
      .filter((d) => d.milestone_id === m.id)
      .map((d) => ({
        id: d.id,
        name: d.name,
        tasks: allTasks.filter((t) => t.deliverable_id === d.id),
      }))
      .filter((d) => d.tasks.length > 0),
  })).filter((g) => g.deliverables.length > 0);

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
  const remaining = countdown(wedding.event_date);
  const done = allTasks.filter((t) => t.completed_at).length;
  const pct = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;

  return (
    <section className="mx-auto max-w-3xl px-5 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-light uppercase tracking-wide text-ink">{names}</h1>
        {remaining && <p className="text-sm font-medium text-brand-dark">{remaining}</p>}
      </div>
      {wedding.city && <p className="mt-1 text-sm text-ink-soft/70">{wedding.city}</p>}

      {allTasks.length > 0 && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-ink-soft/70">
              {done} of {allTasks.length} done
            </span>
            <span className="font-medium text-brand-dark">{pct}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark transition-[width]"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-10">
        {allTasks.length === 0 && (
          <div className="mb-8 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-10 text-center">
            <h2 className="text-lg font-medium text-ink">Your plan is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
              Add tasks below, or let AI build a timeline tailored to your date,
              budget and guest count.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-soft/50">
              AI plan generation — coming next
            </p>
          </div>
        )}
        <TaskList plan={plan} weddingId={id} />
      </div>

      <p className="mt-10 text-center text-sm text-ink-soft/60">
        <Link href="/dashboard" className="font-semibold text-brand-dark">
          ← All weddings
        </Link>
      </p>
    </section>
  );
}
