import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import VendorProfileForm, { type VendorProfile } from "@/components/vendor-profile-form";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Your Vendor Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VendorDashboard() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/vendor");

  // Which org is this user in, and is it a vendor?
  const { data: memberships } = await supabase
    .from("org_members")
    .select("organizations(id, type)")
    .limit(1);
  const org = memberships?.[0]?.organizations as unknown as { id: string; type: string } | undefined;

  if (!org) redirect("/onboarding");
  if (org.type !== "vendor") redirect("/dashboard"); // couple/planner → their dashboard

  const { data: profile } = await supabase
    .from("vendor_profiles")
    .select("org_id, business_name, category, description, city, region, website, email, phone, status")
    .eq("org_id", org.id)
    .maybeSingle();

  if (!profile) notFound();

  return (
    <>
      <PageHero eyebrow="Vendor account" title={profile.business_name} />
      <section className="mx-auto max-w-3xl px-5 py-12">
        <VendorProfileForm profile={profile as VendorProfile} />

        <div className="mt-8 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-6 text-center">
          <p className="text-sm font-medium text-ink-soft">Coming to your account soon</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-ink-soft/60">
            Upload your photos, videos and audio to the inspiration gallery, and
            choose a subscription to reach couples planning right now.
          </p>
        </div>
      </section>
    </>
  );
}
