import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import VendorBadgeCard from "@/components/vendor/badge-card";
import { type VendorProfile } from "@/components/vendor-profile-form";
import VendorWorkspace, { type WorkspaceTab } from "@/components/vendor/vendor-workspace";
import VendorMediaManager, { type VendorMedia } from "@/components/vendor-media-manager";
import VendorBilling from "@/components/vendor-billing";
import VendorAccountActions from "@/components/vendor-account-actions";
import VendorInquiries from "@/components/vendor/vendor-inquiries";
import VendorStats from "@/components/vendor/vendor-stats";
import { listVendorInquiries } from "@/app/vendor/inquiry-actions";
import { getVendorStats } from "@/app/vendor/stats-actions";
import { supabaseServer } from "@/lib/supabase/server";
import { proConfigured, featuredConfigured } from "@/lib/stripe";
import { entitlements, planGrant, normalizePlan, PLAN_COLUMNS } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Your Vendor Account",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function VendorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ billing?: string; account?: string; tab?: string }>;
}) {
  const { billing, account, tab } = await searchParams;

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
    .select(`id, subscription_status, cancel_at_period_end, ${PLAN_COLUMNS}`)
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
    .select("org_id, business_name, category, description, city, region, website, email, phone, social_links, price_tier, highlights, packages, faqs, status")
    .eq("org_id", org.id)
    .maybeSingle();

  if (!profile) notFound();

  const { data: media } = await supabase
    .from("inspiration_images")
    .select("id, image_url, title, media_type, like_count")
    .eq("vendor_id", org.id)
    .order("created_at", { ascending: false });

  const grant = planGrant(org);
  const ent = entitlements(grant.plan);
  const inquiries = ent.canReceiveInquiries ? await listVendorInquiries(org.id) : [];
  const stats = ent.hasStats ? await getVendorStats(org.id) : null;

  // Coming back from Stripe (?billing=...) lands on the plan tab, where the result is shown.
  const initialTab = (billing ? "plan" : tab ?? "profile") as WorkspaceTab;

  return (
    <VendorWorkspace
      profile={profile as VendorProfile}
      mediaCount={media?.length ?? 0}
      initialTab={initialTab}
      notice={
        account === "deactivated" ? (
          <p className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your account is deactivated — your listing is hidden and your subscription
            won&rsquo;t renew. Publish your listing again to reactivate.
          </p>
        ) : null
      }
      panels={{
        media: (
          <VendorMediaManager
            orgId={org.id}
            media={(media ?? []) as VendorMedia[]}
            inFeed={ent.canPostInspiration}
            galleryLimit={ent.galleryLimit}
          />
        ),
        insights:
          stats || ent.canReceiveInquiries ? (
            <>
              {stats && <VendorStats stats={stats} />}
              {ent.canReceiveInquiries && <VendorInquiries initial={inquiries} />}
            </>
          ) : null,
        marketing: (
          <VendorBadgeCard
            orgId={org.id}
            businessName={profile.business_name}
            published={profile.status === "published"}
          />
        ),
        plan: (
          <>
            <VendorBilling
              plan={org.plan}
              status={org.subscription_status}
              proConfigured={proConfigured()}
              featuredConfigured={featuredConfigured()}
              flash={billing ?? null}
              cancelAtPeriodEnd={Boolean(org.cancel_at_period_end)}
              granted={
                grant.source !== "paid" && grant.plan !== normalizePlan(org.plan)
                  ? { plan: grant.plan, source: grant.source, expiresAt: grant.expiresAt }
                  : null
              }
            />
            <VendorAccountActions orgId={org.id} />
          </>
        ),
      }}
    />
  );
}
