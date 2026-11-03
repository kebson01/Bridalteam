import PlannerChat from "@/components/planner-chat";
import PlannerFeatures, { PlannerHeader } from "@/components/planner-features";
import PlannerWeddingCard, { type PlannerWedding } from "@/components/planner-wedding-card";
import { supabaseServer } from "@/lib/supabase/server";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/planner",
  title: "AI Wedding Planner",
  description:
    "Chat with your AI planning assistant for timelines, budgets, checklists and vendor ideas tailored to your wedding.",
});

// Reads the visitor's session to show their wedding above the chat.
export const dynamic = "force-dynamic";

const PROMPTS = [
  "Build a checklist for the next 3 months",
  "Estimate a budget for 150 guests in Miami",
  "What should I book first?",
  "Ideas for a modern minimalist wedding",
  "Help me write a day-of schedule",
];

/**
 * The wedding the chat will work on: the ?w= one, or the caller's soonest,
 * picked exactly as /api/plan picks it. RLS limits both reads to weddings the
 * visitor belongs to, so a forged id finds nothing.
 */
async function plannerWedding(requested: string | null): Promise<{ signedIn: boolean; wedding: PlannerWedding | null }> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { signedIn: false, wedding: null };

  let query = supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, region, venue, guest_count");
  query = requested ? query.eq("id", requested) : query.order("event_date", { ascending: true, nullsFirst: false });
  const { data: w } = await query.limit(1).maybeSingle();
  if (!w) return { signedIn: true, wedding: null };

  const { data: tasks } = await supabase
    .from("tasks")
    .select("completed_at")
    .eq("wedding_id", w.id)
    .is("deleted_at", null);
  const list = tasks ?? [];
  return {
    signedIn: true,
    wedding: { ...w, tasksTotal: list.length, tasksDone: list.filter((t) => t.completed_at).length },
  };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlannerPage({ searchParams }: { searchParams: Promise<{ w?: string }> }) {
  const { w } = await searchParams;
  const { signedIn, wedding } = await plannerWedding(w && UUID.test(w) ? w : null);

  return (
    <>
      <section className="mx-auto max-w-4xl px-5 pb-12 pt-10 sm:pt-14">
        <PlannerHeader />
        <div className="mt-8">
          <PlannerWeddingCard wedding={wedding} signedIn={signedIn} />
        </div>
        <div className="mt-6">
          <PlannerChat quickPrompts={PROMPTS} heightClass="h-[32rem]" />
        </div>
      </section>
      <PlannerFeatures />
    </>
  );
}

