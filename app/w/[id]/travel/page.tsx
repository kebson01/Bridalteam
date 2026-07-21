import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import TravelManager, { type TravelItem } from "@/components/travel-manager";
import WeddingNav from "@/components/wedding-nav";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Travel & Lodging",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function TravelPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/travel`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, city")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const { data: items } = await supabase
    .from("travel_items")
    .select("id, kind, title, location, url, code, reserve_by, rate_cents, detail")
    .eq("wedding_id", id)
    .order("position");

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-dark hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Travel &amp; lodging</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="travel" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <TravelManager items={(items ?? []) as TravelItem[]} weddingId={id} />
      </div>
    </div>
  );
}
