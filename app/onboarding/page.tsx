import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import OnboardingForm from "@/components/onboarding-form";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Set Up Your Plan",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/onboarding");

  // Already set up? Don't make them do it twice.
  const { data: existing } = await supabase.from("org_members").select("org_id").limit(1);
  if (existing && existing.length > 0) redirect("/dashboard");

  return (
    <>
      <PageHero
        eyebrow="Almost there"
        title="Tell us about your day"
        subtitle="A few details and we'll build your plan. You can change any of this later."
      />
      <section className="mx-auto max-w-2xl px-5 py-16">
        <OnboardingForm />
      </section>
    </>
  );
}
