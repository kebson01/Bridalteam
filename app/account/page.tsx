import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import ProfilePanel from "@/components/account/profile-panel";
import ChangeEmailPanel from "@/components/account/change-email-panel";
import SignOutButton from "@/components/account/sign-out-button";
import DeleteAccount from "@/components/account/delete-account";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";
import { TIERS, PLANS, type Plan } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Account Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The signed-in user's vendor org, or null if they don't have one.
 *
 * Only vendors are ever billed — couples are free — so the Billing section
 * below is skipped entirely for everyone else rather than shown as an empty or
 * "not applicable" card.
 *
 * Queries `organizations` filtered to type='vendor' rather than reading the
 * caller's first org_members row the way /vendor does. RLS ("Members read their
 * org" = is_org_member(id)) already limits this to orgs they belong to, and
 * asking for the vendor org directly means someone who has both a couple org
 * and a vendor org still sees their billing — /vendor's first-membership lookup
 * would pick whichever row came back first and could miss it.
 *
 * A failed lookup returns null and simply hides the section: account settings
 * must not break because billing is unavailable.
 */
async function getVendorOrg(supabase: Awaited<ReturnType<typeof supabaseServer>>) {
  const { data: org, error } = await supabase
    .from("organizations")
    .select("id, plan, cancel_at_period_end")
    .eq("type", "vendor")
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("account: vendor org lookup failed:", error.code, error.message);
    return null;
  }
  if (!org) return null;
  // Guard the TIERS lookup: an unrecognised plan value falls back to free
  // rather than crashing the whole settings page on an undefined tier.
  const plan: Plan = PLANS.includes(org.plan as Plan) ? (org.plan as Plan) : "free";
  return { plan, cancelAtPeriodEnd: Boolean(org.cancel_at_period_end) };
}

/**
 * A shared account-settings home for every signed-in user — couples, planners
 * and vendors alike. Profile (photo + name), email, and password.
 */
export default async function AccountPage() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  const email = user.email ?? "";
  const name = (user.user_metadata?.full_name as string | undefined)?.trim() ?? "";
  const avatar = (user.user_metadata?.avatar_url as string | undefined) ?? "";
  const vendorOrg = await getVendorOrg(supabase);

  return (
    <>
      <PageHero eyebrow="Account" title="Account settings" />
      <section className="mx-auto max-w-3xl space-y-6 px-5 py-12">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-2 bg-white px-6 py-4 shadow-card">
          <p className="text-sm text-ink-soft/80">
            Signed in as <span className="font-medium text-ink">{email}</span>
          </p>
          <SignOutButton />
        </div>

        <ProfilePanel userId={user.id} email={email} initialName={name} initialAvatar={avatar} />

        <ChangeEmailPanel currentEmail={email} />

        <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
          <h2 className="text-lg font-medium text-ink">Password</h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft/70">
            We&rsquo;ll email you a secure link to set a new password.
          </p>
          <Link
            href="/auth/forgot-password"
            className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
          >
            Change password
          </Link>
        </div>

        {vendorOrg && (
          <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
            <h2 className="text-lg font-medium text-ink">Billing</h2>
            <p className="mt-1 max-w-md text-sm text-ink-soft/70">
              {vendorOrg.plan === "free" ? (
                <>
                  Your listing is on the <span className="font-medium text-ink">Free</span> plan.
                  Upgrade for an unlimited gallery, direct inquiries and stats.
                </>
              ) : (
                <>
                  You&rsquo;re on the{" "}
                  <span className="font-medium text-ink">{TIERS[vendorOrg.plan].name}</span> plan at $
                  {TIERS[vendorOrg.plan].priceMonthly}/month.{" "}
                  {vendorOrg.cancelAtPeriodEnd
                    ? "It's set to cancel at the end of the current period."
                    : "It renews automatically until you cancel."}
                </>
              )}
            </p>
            <Link
              href="/vendor"
              className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
            >
              {vendorOrg.plan === "free" ? "See plans" : "Manage billing"}
            </Link>
          </div>
        )}

        <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
          <h2 className="text-lg font-medium text-ink">Your data</h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft/70">
            Download a copy of your account and planning data as a JSON file.
          </p>
          <a
            href="/api/account/export"
            className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
          >
            Download my data
          </a>
        </div>

        <DeleteAccount email={email} />
      </section>
    </>
  );
}
