import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import CommunityManager from "@/components/dashboard/community-manager";
import { listGroups, listMyEvents } from "@/app/community/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function formatDate(d: string | null) {
  if (!d) return "Date not set";
  return new Date(`${d}T00:00:00`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function DashboardPage() {
  if (!SHOW_PLANNER_APP) notFound();

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?next=/dashboard");

  // This is the couple/planner home, so ask for one of those orgs directly
  // rather than reading whichever org_members row comes back first. RLS
  // ("Members read their org") already scopes it to the caller. The old
  // first-membership read was the mirror of the bug on /vendor: a user who is
  // both a couple and a vendor could be redirected to /vendor and never reach
  // their own wedding dashboard, purely on row order.
  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, type")
    .in("type", ["couple", "planner_company"])
    .limit(1)
    .maybeSingle();

  if (!org) {
    // Vendors have their own home; someone with no org at all needs onboarding.
    const { data: anyOrg } = await supabase.from("org_members").select("org_id").limit(1);
    redirect(anyOrg?.length ? "/vendor" : "/onboarding");
  }

  // RLS already limits this to weddings this user can reach, so no filter here.
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, status")
    .order("event_date", { ascending: true, nullsFirst: false });

  const isCompany = org.type === "planner_company";

  // Community groups + events the user manages (independent of any wedding).
  const [myGroups, myEvents] = await Promise.all([listGroups(), listMyEvents()]);

  return (
    <>
      <PageHero
        eyebrow={isCompany ? "Your portfolio" : "Your weddings"}
        title={org.name}
      />

      <section className="mx-auto max-w-5xl px-5 py-12">
        {isCompany && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-2 bg-white px-6 py-4 shadow-card">
            <p className="text-sm text-ink-soft/80">
              Have a couple already planning on Bridal Team? Join their wedding
              with a connect code.
            </p>
            <Link
              href="/connect"
              className="rounded-full border border-brand px-5 py-2 text-sm font-semibold text-brand-text transition-colors hover:bg-brand hover:text-white"
            >
              Connect a couple
            </Link>
          </div>
        )}

        {!weddings || weddings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-12 text-center">
            <h2 className="text-lg font-medium text-ink">No weddings yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-soft/75">
              {isCompany
                ? "Add your first client and we'll build their plan."
                : "Let's set up your wedding."}
            </p>
            <Link
              href="/onboarding"
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
            >
              {isCompany ? "Add a wedding" : "Set up my wedding"}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weddings.map((w) => (
              <Link
                key={w.id}
                href={`/w/${w.id}`}
                className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <h2 className="text-lg font-medium text-ink">
                  {[w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "Untitled wedding"}
                </h2>
                <p className="mt-1 text-sm text-ink-soft/70">{formatDate(w.event_date)}</p>
                {w.city && <p className="mt-1 text-sm text-ink-soft/70">{w.city}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16" id="community">
        <div className="mb-4">
          <h2 className="font-display text-2xl font-semibold text-ink">Community</h2>
          <p className="mt-1 text-sm text-ink-soft/70">
            Create and manage your groups, invites and events here. Browsing, posting and RSVPs
            happen on the{" "}
            <Link href="/community" className="font-semibold text-brand-text hover:underline">
              Community page
            </Link>
            .
          </p>
        </div>
        <CommunityManager viewerId={user.id} initialGroups={myGroups} initialEvents={myEvents} />
      </section>
    </>
  );
}
