import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import OnboardingInvites from "@/components/onboarding-invites";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Invite your team",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Step two of signup, between creating the plan and seeing it.
 *
 * createWorkspace() sends couples here instead of straight to the workspace.
 * Everything a couple needs already existed — wedding_invites, the invite
 * action, /invite/<token> — but it lived on a tab inside the workspace, so the
 * invite loop only turned for couples who went looking for it.
 *
 * Reachable on its own, and harmless if it is: without a wedding there is
 * nothing to invite anyone to, so it sends them back rather than rendering an
 * empty form.
 */
export default async function OnboardingInvitePage() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/onboarding/invite");

  // RLS scopes this to weddings the caller belongs to. Newest first, because
  // the one they just created in the previous step is the one they mean.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // No wedding: either a planner-company account, or someone who reached this
  // URL before finishing setup. /dashboard routes both correctly.
  if (!wedding) redirect("/dashboard");

  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  return (
    <>
      <PageHero
        eyebrow="One more thing"
        title="Who's helping you plan?"
        subtitle={
          names
            ? `Invite the people closest to ${names} — they'll be able to see the plan, take on tasks and add ideas.`
            : "Invite the people closest to you — they'll be able to see the plan, take on tasks and add ideas."
        }
      />
      <section className="mx-auto max-w-xl px-5 py-12">
        <OnboardingInvites weddingId={wedding.id} skipHref={`/w/${wedding.id}`} />
        <p className="mt-6 text-center text-xs leading-relaxed text-ink-soft/60">
          They&rsquo;ll get an email with a link to join. You can add or remove
          anyone later from the Team tab, and nobody sees your wedding until
          they accept.
        </p>
      </section>
    </>
  );
}
