import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import CommunityManager from "@/components/dashboard/community-manager";
import { listGroups, listMyEvents } from "@/app/community/actions";
import { supabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Groups & events",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Where groups (and their invites/members) and events are created and managed.
 * It used to sit at the bottom of /dashboard; that page now goes straight to
 * the couple's wedding, so this is its own stop — reached from the Community
 * tool on the wedding overview and from the Community page.
 */
export default async function DashboardCommunityPage() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard/community");

  const [myGroups, myEvents] = await Promise.all([listGroups(), listMyEvents()]);

  return (
    <>
      <PageHero eyebrow="Community" title="Groups & events" />
      <section className="mx-auto max-w-5xl px-5 py-12">
        <p className="mb-6 text-sm text-ink-soft/70">
          Create and manage your groups, invites and events here — bridesmaids, groomsmen,
          family, the rehearsal dinner. Browsing, posting and RSVPs happen on the{" "}
          <Link href="/community" className="font-semibold text-brand-text hover:underline">
            Community page
          </Link>
          .
        </p>
        <CommunityManager
          viewerId={user.id}
          initialGroups={myGroups ?? []}
          initialEvents={myEvents ?? []}
          loadFailed={myGroups === null || myEvents === null}
        />
      </section>
    </>
  );
}
