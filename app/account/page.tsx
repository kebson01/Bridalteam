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

export const metadata: Metadata = {
  title: "Account Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

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
            className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
          >
            Change password
          </Link>
        </div>

        <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
          <h2 className="text-lg font-medium text-ink">Your data</h2>
          <p className="mt-1 max-w-md text-sm text-ink-soft/70">
            Download a copy of your account and planning data as a JSON file.
          </p>
          <a
            href="/api/account/export"
            className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
          >
            Download my data
          </a>
        </div>

        <DeleteAccount email={email} />
      </section>
    </>
  );
}
