import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import BudgetTable, { type BudgetItem } from "@/components/budget-table";
import WeddingNav from "@/components/wedding-nav";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";
import { BUDGET_CATEGORY_ORDER } from "@/lib/budget-template";
import { seedBudget } from "./actions";

export const metadata: Metadata = {
  title: "Budget",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">{label}</p>
      <p className={`mt-2 text-2xl font-light ${tone ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

export default async function BudgetPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/budget`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, budget_cents")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const { data: items } = await supabase
    .from("budget_items")
    .select("id, category, label, estimated_cents, paid_cents, overlooked")
    .eq("wedding_id", id)
    .order("position");

  const rows = (items ?? []) as BudgetItem[];
  const totalEst = rows.reduce((s, r) => s + r.estimated_cents, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paid_cents, 0);
  const total = wedding.budget_cents ?? 0;
  const overEstimate = total > 0 && totalEst > total;
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  async function doSeed() {
    "use server";
    await seedBudget(id);
  }

  return (
    <div className="bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Budget</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="budget" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Total budget" value={total > 0 ? money(total) : "—"} />
          <Stat
            label="Estimated"
            value={money(totalEst)}
            tone={overEstimate ? "text-red-600" : "text-ink"}
          />
          <Stat label="Paid so far" value={money(totalPaid)} />
          {/* Unallocated, not "remaining to pay". Total minus payments just
              repeats the Total tile until money starts moving; what a couple
              needs while planning is how much budget they haven't committed.
              Goes red once estimates exceed the total, matching the warning
              below, which already keys off estimates rather than payments.
              Falls back to a payment view when no total is set, since
              "unallocated" is meaningless without one. */}
          <Stat
            label={total > 0 ? "Unallocated" : "Not yet paid"}
            value={total > 0 ? money(total - totalEst) : money(totalEst - totalPaid)}
            tone={overEstimate ? "text-red-600" : undefined}
          />
        </div>

        {overEstimate && (
          <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            Your estimates are <strong>{money(totalEst - total)}</strong> over your total budget.
            Trim a category, or raise your budget on the plan page.
          </p>
        )}

        {rows.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
            <div className="max-w-xl">
              <h2 className="text-2xl font-light">Start with a realistic budget</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                We&rsquo;ll break {total > 0 ? money(total) : "your budget"} into the
                usual categories and pre-list the costs first-timers forget —
                tips, alterations, delivery fees, the marriage license and more.
                Adjust everything after.
              </p>
              <form action={doSeed} className="mt-5">
                <button
                  type="submit"
                  className="rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-text transition-transform hover:-translate-y-0.5"
                >
                  Build my starter budget
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <BudgetTable items={rows} weddingId={id} categoryOrder={BUDGET_CATEGORY_ORDER} />
          </div>
        )}
      </div>
    </div>
  );
}
