import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
import { supabaseServer } from "@/lib/supabase/server";
import { enabledTools } from "@/lib/wedding-tools";

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

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000);
}

type WeddingRow = {
  id: string;
  partner_one: string | null;
  partner_two: string | null;
  event_date: string | null;
  city: string | null;
  enabled_tools: unknown;
};

const EXPLORE_LINKS: [string, string, string][] = [
  ["/vendors", "Find vendors", "Venues, photographers, florists and more"],
  ["/guides", "Planning guides", "How-tos for every step of the day"],
  ["/inspiration", "Inspiration", "Ideas and looks to save"],
  ["/real-weddings", "Real weddings", "Stories from real couples"],
  ["/wedding-checklist", "Checklist", "A dated plan from now to the day"],
  ["/wedding-budget-calculator", "Budget calculator", "Split a budget across vendors"],
];

/**
 * Home for a signed-in person with no couple, planner or vendor org: wedding
 * party and family who joined by invite (more than one wedding), and people
 * who chose "guest or just exploring" at onboarding.
 */
function GuestHome({ weddings }: { weddings: WeddingRow[] }) {
  return (
    <>
      <PageHero eyebrow="Welcome" title={weddings.length ? "Your weddings" : "Explore Bridal Team"} />

      {weddings.length > 0 && (
        <section className="mx-auto max-w-5xl px-5 pt-12">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weddings.map((w) => (
              <Link
                key={w.id}
                href={`/w/${w.id}`}
                className="block rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <h2 className="text-lg font-medium text-ink">
                  {[w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "Untitled wedding"}
                </h2>
                <p className="mt-1 text-sm text-ink-soft/70">{formatDate(w.event_date)}</p>
                {w.city && <p className="mt-1 text-sm text-ink-soft/70">{w.city}</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-5 py-12">
        {weddings.length === 0 && (
          <p className="mb-6 max-w-2xl text-sm leading-relaxed text-ink-soft/75">
            Invited to someone&rsquo;s wedding? Open the invite link from your
            email and you&rsquo;ll join it. In the meantime, everything below is
            free to use.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORE_LINKS.map(([href, title, sub]) => (
            <Link
              key={href}
              href={href}
              className="block rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-0.5"
            >
              <h2 className="font-medium text-ink">{title}</h2>
              <p className="mt-1 text-sm text-ink-soft/70">{sub}</p>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-stone-2 bg-stone-4 px-6 py-5">
          <p className="text-sm text-ink-soft/80">Planning a wedding of your own?</p>
          <Link
            href="/onboarding"
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white"
          >
            Set up my wedding
          </Link>
        </div>
      </section>
    </>
  );
}

export default async function DashboardPage() {
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

  // RLS already limits this to weddings this user can reach, so no filter here.
  // That includes weddings they joined by invite (wedding_members), which is
  // what the no-org branch below relies on.
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, status, enabled_tools")
    .order("event_date", { ascending: true, nullsFirst: false });

  if (!org) {
    // Vendors have their own home.
    const { data: anyOrg } = await supabase.from("org_members").select("org_id").limit(1);
    if (anyOrg?.length) redirect("/vendor");

    // Bridesmaids, family and other invited helpers belong to a wedding but
    // have no org of their own. Sending them to /onboarding asked them to set
    // up a wedding they aren't planning, with no way back to the one they
    // joined — so take them to it instead.
    if (weddings?.length === 1) redirect(`/w/${weddings[0].id}`);

    const isExplorer = user.user_metadata?.account_type === "explorer";
    if (!weddings?.length && !isExplorer) redirect("/onboarding");

    return <GuestHome weddings={weddings ?? []} />;
  }

  const isCompany = org.type === "planner_company";

  // A couple planning one wedding has nothing to choose between here, and
  // every tool lives on the wedding's own page — so "Dashboard" takes them
  // straight there instead of to a card they have to click through.
  if (!isCompany && weddings?.length === 1) redirect(`/w/${weddings[0].id}`);

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
              <div
                key={w.id}
                className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card transition-transform hover:-translate-y-1"
              >
                <Link href={`/w/${w.id}`} className="block">
                  <h2 className="text-lg font-medium text-ink">
                    {[w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "Untitled wedding"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-soft/70">{formatDate(w.event_date)}</p>
                  {w.city && <p className="mt-1 text-sm text-ink-soft/70">{w.city}</p>}
                  {daysUntil(w.event_date) != null && daysUntil(w.event_date)! >= 0 && (
                    <p className="mt-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-text">
                      {daysUntil(w.event_date)} days to go
                    </p>
                  )}
                </Link>

                {/* Every tool switched on for this wedding, one tap away. */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-2 pt-4">
                  {enabledTools(w.enabled_tools as string[] | null)
                    .map((t) => [`${t.icon} ${t.nav}`, t.path(w.id)])
                    .map(([label, href]) => (
                    <Link
                      key={label}
                      href={href}
                      className="rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16" id="community">
        <Link
          href="/dashboard/community"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-2 bg-white px-6 py-5 shadow-card transition-transform hover:-translate-y-0.5"
        >
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">🎉 Groups &amp; events</h2>
            <p className="mt-1 text-sm text-ink-soft/70">
              Bridesmaids, groomsmen and family groups, invites, and events like the rehearsal dinner.
            </p>
          </div>
          <span className="text-sm font-semibold text-brand-text">Manage →</span>
        </Link>
      </section>
    </>
  );
}
