import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import GuestList from "@/components/wedding/guest-list";
import WeddingNav from "@/components/wedding-nav";
import { listGuests } from "./actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Guests",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function GuestsPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/guests`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const guests = await listGuests(id);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Guests</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="guests" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-5 py-10">
        <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-soft/80">
          Everyone you&rsquo;re inviting, and who&rsquo;s replied. Each household gets its own
          private link — only people you invite can RSVP.
        </p>
        <GuestList
          weddingId={id}
          initialGuests={guests ?? []}
          loadFailed={guests === null}
          siteUrl={SITE_URL}
        />
      </div>
    </div>
  );
}
