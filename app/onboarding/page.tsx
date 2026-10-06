import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import OnboardingForm from "@/components/onboarding-form";
import ResumePendingNext from "@/components/resume-pending-next";
import ClaimableListingPrompt from "@/components/claimable-listing-prompt";
import { listClaimableForMe } from "@/app/onboarding/claim-actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Set Up Your Plan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { type } = await searchParams;
  const initialType =
    type === "vendor" ? "vendor" : type === "planner" ? "planner_company" : "couple";

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/onboarding");

  // Already set up? Don't make them do it twice.
  const { data: existing } = await supabase.from("org_members").select("org_id").limit(1);
  if (existing && existing.length > 0) redirect("/dashboard");

  // A vendor recruited by phone has a listing waiting on their email address.
  // Offering it here, above the form, is what stops them building a second one
  // — which is exactly what happened the first time this flow was walked.
  const claimable = await listClaimableForMe();

  return (
    <>
      {/*
        Before the form, because someone who arrived here by the auth routes
        losing `next` is meant to leave again rather than fill this in. It
        renders nothing unless a destination was stored.
      */}
      <ResumePendingNext />
      <PageHero
        eyebrow="Almost there"
        title="Tell us about your day"
        subtitle="A few details and we'll build your plan. You can change any of this later."
      />
      <section className="mx-auto max-w-2xl px-5 py-16">
        <ClaimableListingPrompt listings={claimable} />
        <OnboardingForm initialType={initialType} />
      </section>
    </>
  );
}
