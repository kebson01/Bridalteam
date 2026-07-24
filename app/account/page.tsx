import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import ChangeEmailPanel from "@/components/account/change-email-panel";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Account Settings",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * A shared account-settings home for every signed-in user — couples, planners
 * and vendors alike. Currently: change email and change password.
 */
export default async function AccountPage() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/account");

  return (
    <>
      <PageHero eyebrow="Account" title="Account settings" />
      <section className="mx-auto max-w-3xl space-y-6 px-5 py-12">
        <ChangeEmailPanel currentEmail={user.email ?? ""} />

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
      </section>
    </>
  );
}
