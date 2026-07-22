import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import VendorProfileForm, { type VendorProfile } from "@/components/vendor-profile-form";
import VendorMediaManager, { type VendorMedia } from "@/components/vendor-media-manager";
import VendorBilling from "@/components/vendor-billing";
import VendorAccountActions from "@/components/vendor-account-actions";
import { supabaseServer } from "@/lib/supabase/server";
import { billingConfigured } from "@/lib/stripe";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Your Vendor Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; account?: string }>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { billing, account } = await searchParams;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/vendor");

  // Which org is this user in, and is it a vendor?
  const { data: memberships } = await supabase
    .from("org_members")
    .select("organizations(id, type, plan, subscription_status, cancel_at_period_end)")
    .limit(1);
  const org = memberships?.[0]?.organizations as unknown as
    | {
        id: string;
        type: string;
        plan: string;
        subscription_status: string | null;
        cancel_at_period_end: boolean | null;
      }
    | undefined;

  if (!org) redirect("/onboarding");
  if (org.type !== "vendor") redirect("/dashboard"); // couple/planner → their dashboard

  const { data: profile } = await supabase
    .from("vendor_profiles")
    .select("org_id, business_name, category, description, city, region, website, email, phone, status")
    .eq("org_id", org.id)
    .maybeSingle();

  if (!profile) notFound();

  const { data: media } = await supabase
    .from("inspiration_images")
    .select("id, image_url, title, media_type, like_count")
    .eq("vendor_id", org.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHero eyebrow="Vendor account" title={profile.business_name} />
      <section className="mx-auto max-w-3xl space-y-10 px-5 py-12">
        {account === "deactivated" && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is deactivated — your listing is hidden and your subscription
            won&rsquo;t renew. Publish your listing again to reactivate.
          </p>
        )}
        <VendorBilling
          plan={org.plan}
          status={org.subscription_status}
          configured={billingConfigured()}
          flash={billing ?? null}
          cancelAtPeriodEnd={Boolean(org.cancel_at_period_end)}
        />
        <VendorProfileForm profile={profile as VendorProfile} />
        <VendorMediaManager orgId={org.id} media={(media ?? []) as VendorMedia[]} />
        <VendorAccountActions orgId={org.id} />
      </section>
    </>
  );
}
