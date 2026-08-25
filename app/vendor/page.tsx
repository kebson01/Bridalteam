import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import VendorProfileForm, { type VendorProfile } from "@/components/vendor-profile-form";
import VendorMediaManager, { type VendorMedia } from "@/components/vendor-media-manager";
import VendorBilling from "@/components/vendor-billing";
import VendorAccountActions from "@/components/vendor-account-actions";
import VendorInquiries from "@/components/vendor/vendor-inquiries";
import VendorStats from "@/components/vendor/vendor-stats";
import { listVendorInquiries } from "@/app/vendor/inquiry-actions";
import { getVendorStats } from "@/app/vendor/stats-actions";
import { supabaseServer } from "@/lib/supabase/server";
import { proConfigured, featuredConfigured } from "@/lib/stripe";
import { entitlements } from "@/lib/tiers";
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

  // Ask for this user's VENDOR org specifically, rather than reading whichever
  // org_members row happens to come back first. RLS ("Members read their org" =
  // is_org_member(id)) already scopes this to orgs they belong to. Taking the
  // first membership meant someone who is both a couple and a vendor — planning
  // their own wedding while listing their business — could be bounced to
  // /dashboard and never reach their vendor account, purely on row order.
  const { data: org } = await supabase
    .from("organizations")
    .select("id, plan, subscription_status, cancel_at_period_end")
    .eq("type", "vendor")
    .limit(1)
    .maybeSingle();

  if (!org) {
    // No vendor org. Distinguish "belongs to some other kind of org" (send them
    // to their own dashboard) from "belongs to none" (they still need onboarding).
    const { data: anyOrg } = await supabase.from("org_members").select("org_id").limit(1);
    redirect(anyOrg?.length ? "/dashboard" : "/onboarding");
  }

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

  const ent = entitlements(org.plan);
  const inquiries = ent.canReceiveInquiries ? await listVendorInquiries(org.id) : [];
  const stats = ent.hasStats ? await getVendorStats(org.id) : null;

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
          proConfigured={proConfigured()}
          featuredConfigured={featuredConfigured()}
          flash={billing ?? null}
          cancelAtPeriodEnd={Boolean(org.cancel_at_period_end)}
        />
        <VendorProfileForm profile={profile as VendorProfile} />
        {stats && <VendorStats stats={stats} />}
        {ent.canReceiveInquiries && <VendorInquiries initial={inquiries} />}
        <VendorMediaManager orgId={org.id} media={(media ?? []) as VendorMedia[]} />
        <VendorAccountActions orgId={org.id} />
      </section>
    </>
  );
}
