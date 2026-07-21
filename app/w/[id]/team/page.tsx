import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import WeddingNav from "@/components/wedding-nav";
import ConnectCodePanel from "@/components/connect-code-panel";
import InvitePanel from "@/components/invite-panel";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Team",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  couple: "Couple",
  partner: "Partner",
  planner: "Wedding planner",
  planner_staff: "Planner's team",
  maid_of_honor: "Maid of Honor",
  matron_of_honor: "Matron of Honor",
  best_man: "Best Man",
  mother_of_bride: "Mother of the Bride",
  father_of_bride: "Father of the Bride",
  mother_of_groom: "Mother of the Groom",
  father_of_groom: "Father of the Groom",
  groomsman: "Groomsman",
  bridesmaid: "Bridesmaid",
  usher: "Usher",
  junior_bridesmaid: "Junior Bridesmaid",
  flower_girl: "Flower Girl",
  ring_bearer: "Ring Bearer",
  helper: "Helper",
};

export default async function TeamPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/team`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const { data: members } = await supabase
    .from("wedding_members")
    .select("id, role, user_id")
    .eq("wedding_id", id);

  // The connect code is only readable by managers (RLS); non-managers get null.
  const { data: codeRow } = await supabase
    .from("wedding_connect_codes")
    .select("code")
    .eq("wedding_id", id)
    .maybeSingle();

  // Pending (unaccepted) invites — managers only, via RLS.
  const { data: invites } = await supabase
    .from("wedding_invites")
    .select("id, email, role")
    .eq("wedding_id", id)
    .is("accepted_at", null)
    .order("created_at", { ascending: false });

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");
  const memberList = members ?? [];
  const pending = invites ?? [];

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-4xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-dark hover:text-brand-deep">
            ← Back to plan
          </Link>
          <h1 className="mt-3 text-3xl font-light uppercase tracking-wide text-ink">Team</h1>
          {names && <p className="mt-1 text-sm text-ink-soft/70">{names}</p>}
          <WeddingNav weddingId={id} active="team" />
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-8 px-5 py-10">
        <InvitePanel weddingId={id} />

        <ConnectCodePanel weddingId={id} initialCode={codeRow?.code ?? null} />

        <section>
          <h2 className="text-lg font-medium text-ink">Who&rsquo;s on this wedding</h2>
          <div className="mt-4 space-y-2">
            {memberList.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-stone-2 bg-white px-5 py-3 shadow-card"
              >
                <span className="text-sm text-ink">
                  {ROLE_LABEL[m.role] ?? m.role}
                  {m.user_id === user.id && (
                    <span className="ml-2 text-xs text-ink-soft/50">(you)</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-soft/50">
                Pending invites
              </h3>
              <div className="mt-3 space-y-2">
                {pending.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between rounded-xl border border-dashed border-stone-2 bg-stone-4 px-5 py-3"
                  >
                    <span className="text-sm text-ink-soft">
                      {inv.email}
                      <span className="ml-2 text-xs text-ink-soft/50">
                        {ROLE_LABEL[inv.role] ?? inv.role}
                      </span>
                    </span>
                    <span className="text-xs text-ink-soft/50">Invited</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
