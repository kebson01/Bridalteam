import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DetailsForm, { type WeddingDetails } from "@/components/wedding/details-form";
import WeddingNav from "@/components/wedding-nav";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Wedding Details",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function DetailsPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/details`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select(
      "id, partner_one, partner_two, event_date, city, region, venue, guest_count, budget_cents, style, notes",
    )
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  // Only dated tasks can be shifted, so this is the number the form should offer
  // to move if the wedding date changes.
  const { count: datedTaskCount } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("wedding_id", id)
    .not("due_date", "is", null);

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Wedding details</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="details" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-soft/80">
          These are the details your plan, budget and AI suggestions are built from. Change anything
          here and it flows through the rest of your workspace.
        </p>
        <DetailsForm wedding={wedding as WeddingDetails} datedTaskCount={datedTaskCount ?? 0} />
      </div>
    </div>
  );
}
