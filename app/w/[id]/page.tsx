import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import { shortDate } from "@/lib/dates";
import FlashBanner from "@/components/flash-banner";
import { TEMPLATE_TASK_COUNT } from "@/lib/plan-template";
import { seedExpertPlan, toggleTask } from "./actions";
import GeneratePlanButton from "@/components/generate-plan-button";
import WeddingNav from "@/components/wedding-nav";
import WeddingTools, { type ToolStats } from "@/components/wedding-tools";
import { enabledTools } from "@/lib/wedding-tools";

export const metadata: Metadata = {
  title: "Your Wedding",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function daysUntil(date: string | null) {
  if (!date) return null;
  return Math.ceil((new Date(`${date}T00:00:00`).getTime() - Date.now()) / 86_400_000);
}

function longDate(date: string | null) {
  if (!date) return "Date not set";
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function money(cents: number | null, currency: string) {
  if (cents == null) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

function Stat({
  label,
  value,
  sub,
  href,
  children,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">
        {label}
      </p>
      <p className="mt-2 text-2xl font-light text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft/60">{sub}</p>}
      {children}
    </>
  );
  const cls = "rounded-2xl border border-stone-2 bg-white p-5 shadow-card";
  if (href) {
    return (
      <Link href={href} className={`${cls} block transition-transform hover:-translate-y-0.5`}>
        {inner}
      </Link>
    );
  }
  return <div className={cls}>{inner}</div>;
}

export default async function WeddingOverviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const flash = flashFrom(await searchParams);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}`);

  // RLS decides this: no row means no access, which is the same as not existing.
  const { data: wedding } = await supabase
    .from("weddings")
    .select(
      "id, partner_one, partner_two, event_date, city, venue, guest_count, budget_cents, currency, style, website_published, enabled_tools",
    )
    .eq("id", id)
    .maybeSingle();

  if (!wedding) notFound();

  const tools = enabledTools(wedding.enabled_tools as string[] | null);
  const on = new Set(tools.map((t) => t.key));

  // Only ask for the numbers behind tools that are actually switched on. Each
  // query is a no-op promise otherwise, so a lean dashboard stays cheap.
  const none = Promise.resolve({ data: null });
  const [tasksRes, budgetRes, guestsRes, vendorsRes, layoutsRes, travelRes, ideasRes, teamRes] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, due_date, completed_at")
        .eq("wedding_id", id)
        .is("deleted_at", null)
        .order("position"),
      on.has("budget")
        ? supabase.from("budget_items").select("estimated_cents, paid_cents").eq("wedding_id", id)
        : none,
      on.has("guests")
        ? supabase.from("wedding_guests").select("seats, attending, party_size, responded_at").eq("wedding_id", id)
        : none,
      on.has("vendors")
        ? supabase.from("wedding_vendors").select("status").eq("wedding_id", id)
        : none,
      on.has("layout") ? supabase.from("venue_layouts").select("id").eq("wedding_id", id) : none,
      on.has("travel") ? supabase.from("travel_items").select("id").eq("wedding_id", id) : none,
      on.has("ideas") ? supabase.from("saved_inspiration").select("image_id").eq("wedding_id", id) : none,
      on.has("team") ? supabase.from("wedding_members").select("id").eq("wedding_id", id) : none,
    ]);

  type Task = { id: string; title: string; due_date: string | null; completed_at: string | null };
  const allTasks = (tasksRes.data ?? []) as Task[];
  const done = allTasks.filter((t) => t.completed_at).length;
  const pct = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
  const currency = wedding.currency ?? "USD";
  const budget = money(wedding.budget_cents, currency);

  // Guests: confirmed headcount from RSVPs, when there's a guest list at all.
  const guests = (guestsRes.data ?? []) as {
    seats: number;
    attending: boolean | null;
    party_size: number | null;
    responded_at: string | null;
  }[];
  const invitedSeats = guests.reduce((s, g) => s + (g.seats ?? 1), 0);
  const confirmed = guests
    .filter((g) => g.attending)
    .reduce((s, g) => s + (g.party_size ?? g.seats ?? 1), 0);
  const awaiting = guests.filter((g) => !g.responded_at).length;

  const budgetItems = (budgetRes.data ?? []) as { estimated_cents: number; paid_cents: number }[];
  const paid = budgetItems.reduce((s, r) => s + (r.paid_cents ?? 0), 0);
  const vendors = (vendorsRes.data ?? []) as { status: string }[];
  const booked = vendors.filter((v) => v.status === "booked").length;
  const count = (r: { data: unknown[] | null }) => (r.data ?? []).length;

  // One short line per tool card — the "is there anything here yet?" glance.
  const stats: ToolStats = {
    checklist: allTasks.length ? `${done} of ${allTasks.length} tasks done` : "No tasks yet",
    budget: budgetItems.length
      ? `${money(paid, currency)} paid${budget ? ` of ${budget}` : ""}`
      : budget
        ? `${budget} budget`
        : "Not set up yet",
    guests: guests.length
      ? `${confirmed} confirmed · ${plural(awaiting, "household")} pending`
      : "No guests added yet",
    vendors: vendors.length ? `${booked} booked · ${vendors.length} tracked` : "No vendors yet",
    layout: count(layoutsRes) ? plural(count(layoutsRes), "floor plan") : "No floor plans yet",
    website: wedding.website_published ? "Published" : "Draft",
    travel: count(travelRes) ? plural(count(travelRes), "item") : "Nothing added yet",
    ideas: count(ideasRes) ? `${plural(count(ideasRes), "idea")} saved` : "No ideas saved yet",
    team: count(teamRes) ? plural(count(teamRes), "member") : "Just you so far",
    community: "Groups & events",
    ai: "Ready 24/7",
  };

  // Next up: open tasks, soonest deadline first, undated ones last.
  const nextUp = allTasks
    .filter((t) => !t.completed_at)
    .sort((a, b) => (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999"))
    .slice(0, 5);

  const names =
    [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ") || "Your wedding";
  const days = daysUntil(wedding.event_date);
  const locationLine = [wedding.city, wedding.venue].filter(Boolean).join(" · ");

  const countdownValue =
    days == null ? "—" : days < 0 ? "🎉" : days === 0 ? "Today" : plural(days, "day");
  const countdownSub =
    days == null ? "Add your date" : days < 0 ? "Congratulations!" : days === 0 ? "It's the day!" : "to go";

  return (
    <div className="bg-stone-4/40">
      {/* Header band */}
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link href="/dashboard" className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← All weddings
          </Link>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              {wedding.style && (
                <span className="mb-3 inline-block rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-text">
                  {wedding.style}
                </span>
              )}
              <h1 className="text-3xl font-light uppercase tracking-wide text-ink sm:text-4xl">
                {names}
              </h1>
              <p className="mt-1 text-sm text-ink-soft/70">
                {longDate(wedding.event_date)}
                {locationLine && <> · {locationLine}</>}
              </p>
            </div>
            <a
              href="#tools"
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
            >
              Customize my tools
            </a>
          </div>
          <WeddingNav weddingId={id} active="overview" enabled={wedding.enabled_tools} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <FlashBanner message={flash} />

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Countdown" value={countdownValue} sub={countdownSub} />
          <Stat
            label="Planning progress"
            value={`${pct}%`}
            sub={allTasks.length > 0 ? `${done} of ${allTasks.length} tasks` : "No tasks yet"}
            href={`/w/${id}/checklist`}
          >
            {allTasks.length > 0 && (
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-stone-2">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark"
                  style={{ width: `${pct}%` }}
                />
              </div>
            )}
          </Stat>
          {guests.length > 0 ? (
            <Stat
              label="Guests & RSVP"
              value={String(confirmed)}
              sub={`confirmed of ${invitedSeats} invited`}
              href={`/w/${id}/guests`}
            />
          ) : (
            <Stat
              label="Guests"
              value={wedding.guest_count != null ? String(wedding.guest_count) : "—"}
              sub={wedding.guest_count != null ? "expected" : "Not set"}
              href={on.has("guests") ? `/w/${id}/guests` : undefined}
            />
          )}
          <Stat
            label="Budget"
            value={budget ?? "—"}
            sub={budget ? (paid > 0 ? `${money(paid, currency)} paid · manage →` : "manage →") : "set it up →"}
            href={`/w/${id}/budget`}
          />
        </div>

        {/* Kickstart CTA — the fastest ways to fill an empty plan */}
        {allTasks.length < 3 && (
          <div className="mt-8 overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-8 text-white">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Start your plan
              </p>
              <h2 className="mt-2 text-2xl font-light">
                Not sure where to begin? We&rsquo;ll set it up for you.
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Get a complete, expert wedding plan — every stage from “just
                engaged” to the big day, the events around it, and the details
                first-timers miss — with deadlines built from your date.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <GeneratePlanButton
                  weddingId={id}
                  className="w-full rounded-full bg-white px-7 py-3 text-sm font-semibold text-brand-text transition-transform hover:-translate-y-0.5 disabled:opacity-70 sm:w-auto"
                >
                  ✨ Build my plan with AI
                </GeneratePlanButton>
                <form action={seedExpertPlan}>
                  <input type="hidden" name="wedding_id" value={id} />
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center rounded-full border border-white/40 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
                  >
                    Or use the expert checklist ({TEMPLATE_TASK_COUNT} steps)
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Tools: the couple's pinned tools, plus the marketplace to add more */}
        <WeddingTools
          weddingId={id}
          initialEnabled={tools.map((t) => t.key)}
          stats={stats}
        />

        {/* Next up */}
        {nextUp.length > 0 && (
          <section className="mt-10 rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">Next up</h2>
                <p className="text-sm text-ink-soft/60">Your soonest open tasks.</p>
              </div>
              <Link
                href={`/w/${id}/checklist`}
                className="text-sm font-semibold text-brand-text hover:text-brand-deep"
              >
                See all {allTasks.length} tasks →
              </Link>
            </div>
            <ul>
              {nextUp.map((t) => {
                const overdue = t.due_date != null && (daysUntil(t.due_date) ?? 0) < 0;
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 border-b border-stone-2/60 py-3 last:border-0"
                  >
                    <form action={toggleTask} className="flex">
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="wedding_id" value={id} />
                      <input type="hidden" name="completed" value="false" />
                      <button
                        type="submit"
                        aria-label={`Mark "${t.title}" as done`}
                        className="h-5 w-5 flex-none rounded-full border border-stone-2 transition-colors hover:border-brand"
                      />
                    </form>
                    <span className="flex-1 text-sm text-ink">{t.title}</span>
                    {t.due_date && (
                      <span
                        className={`text-xs ${overdue ? "font-medium text-red-600" : "text-ink-soft/60"}`}
                      >
                        {shortDate(new Date(`${t.due_date}T00:00:00`))}
                        {overdue && " · overdue"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
