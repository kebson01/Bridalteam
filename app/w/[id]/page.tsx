import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Your Plan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function countdown(date: string | null) {
  if (!date) return null;
  const days = Math.ceil(
    (new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000,
  );
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
    .select("id, partner_one, partner_two, event_date, city, guest_count, budget_cents, style")
    .eq("id", id)
    .maybeSingle();

  if (!wedding) notFound();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("id, title, due_date, completed_at")
    .eq("wedding_id", id)
    .is("deleted_at", null)
    .order("position", { ascending: true })
    .limit(50);

  const names =
    [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") ||
    "Your wedding";
  const remaining = countdown(wedding.event_date);
  const done = tasks?.filter((t) => t.completed_at).length ?? 0;

  return (
    <section className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-light uppercase tracking-wide text-ink">{names}</h1>
        {remaining && <p className="text-sm font-medium text-brand-dark">{remaining}</p>}
      </div>
      {wedding.city && <p className="mt-1 text-sm text-ink-soft/70">{wedding.city}</p>}

      <div className="mt-10 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-12 text-center">
        {!tasks || tasks.length === 0 ? (
          <>
            <h2 className="text-lg font-medium text-ink">Your plan is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
              Next we&rsquo;ll generate a timeline tailored to your date, budget
              and guest count — then you can edit anything you like.
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-ink-soft/50">
              AI plan generation — coming next
            </p>
          </>
        ) : (
          <p className="text-ink">
            {tasks.length} tasks · {done} complete
          </p>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-ink-soft/60">
        <Link href="/dashboard" className="font-semibold text-brand-dark">
          ← All weddings
        </Link>
      </p>
    </section>
  );
}
