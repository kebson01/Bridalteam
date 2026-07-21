import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Wedding Invitation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Redeems an emailed wedding invite. If the visitor isn't signed in yet, we send
 * them to sign up / log in first, preserving the invite link as `next` so they
 * land right back here and are joined automatically.
 */
export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { token } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/auth/signup?next=/invite/${token}`);
  }

  const { data: weddingId, error } = await supabase.rpc("accept_wedding_invite", {
    p_token: token,
  });

  if (error || !weddingId) {
    return (
      <>
        <PageHero eyebrow="Invitation" title="This invite isn't valid" />
        <section className="mx-auto max-w-md px-5 py-16 text-center text-ink-soft/75">
          <p>
            This invitation link is invalid or has expired. Ask the couple to send
            you a fresh one.
          </p>
        </section>
      </>
    );
  }

  redirect(`/w/${weddingId}`);
}
