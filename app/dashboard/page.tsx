import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import PageHero from "@/components/page-hero";
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

  const { data: memberships } = await supabase
    .from("org_members")
    .select("role, organizations(id, name, type)")
    .limit(1);

  const membership = memberships?.[0];
  if (!membership) redirect("/onboarding");

  const org = membership.organizations as unknown as {
    id: string;
    name: string;
    type: string;
  };

  // Vendors have their own home.
  if (org.type === "vendor") redirect("/vendor");

  // RLS already limits this to weddings this user can reach, so no filter here.
  const { data: weddings } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two, event_date, city, status")
    .order("event_date", { ascending: true, nullsFirst: false });

  const isCompany = org.type === "planner_company";

  // A couple has exactly one wedding — send them straight into it.
  if (!isCompany && weddings && weddings.length === 1) {
    redirect(`/w/${weddings[0].id}`);
  }

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
              className="rounded-full border border-brand px-5 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand hover:text-white"
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
    </>
  );
}
