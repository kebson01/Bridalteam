import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import { shortDate } from "@/lib/dates";
import FlashBanner from "@/components/flash-banner";
import { TEMPLATE_TASK_COUNT } from "@/lib/plan-template";
import { listGroups, listMyEvents } from "@/app/community/actions";
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
  icon,
  label,
  value,
  sub,
  action,
  href,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  /** Call to action shown in brand colour, e.g. "Add guests →". */
  action?: string;
  href?: string;
  children?: React.ReactNode;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">{label}</p>
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-wash text-sm">
          {icon}
        </span>
      </div>
      <p className="mt-2 text-2xl font-light text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft/60">{sub}</p>}
      {children}
      {action && <p className="mt-2 text-xs font-semibold text-brand-text">{action}</p>}
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
  const [
    tasksRes,
    budgetRes,
    guestsRes,
    vendorsRes,
    layoutsRes,
    travelRes,
    ideasRes,
    teamRes,
    weddingCount,
    company,
    groups,
    events,
  ] = await Promise.all([
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
    on.has("vendors") ? supabase.from("wedding_vendors").select("status").eq("wedding_id", id) : none,
    on.has("layout") ? supabase.from("venue_layouts").select("id").eq("wedding_id", id) : none,
    on.has("travel") ? supabase.from("travel_items").select("id").eq("wedding_id", id) : none,
    on.has("ideas") ? supabase.from("saved_inspiration").select("image_id").eq("wedding_id", id) : none,
    on.has("team") ? supabase.from("wedding_members").select("id").eq("wedding_id", id) : none,
    // "All weddings" only means something to planners or couples with more
    // than one wedding — /dashboard sends everyone else straight back here.
    supabase.from("weddings").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id").eq("type", "planner_company").limit(1).maybeSingle(),
    on.has("community") ? listGroups() : Promise.resolve(null),
    on.has("community") ? listMyEvents() : Promise.resolve(null),
  ]);
  const showAllWeddings = (weddingCount.count ?? 0) > 1 || Boolean(company.data);

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
  const members = count(teamRes);
  const upcomingEvents = (events ?? []).filter((e) => new Date(e.starts_at).getTime() > Date.now());

  // One short line per tool card, and whether it's still empty — an empty
  // tool's card leads with its first step instead of a bare "Open".
  const stats: ToolStats = {
    checklist: allTasks.length
      ? { line: `${done} of ${allTasks.length} tasks done` }
      : { line: "No tasks yet", empty: true },
    budget: budgetItems.length
      ? { line: `${money(paid, currency)} paid${budget ? ` of ${budget}` : ""}` }
      : { line: budget ? `${budget} to plan` : "Not set up yet", empty: true },
    guests: guests.length
      ? { line: `${confirmed} confirmed · ${awaiting} pending` }
      : { line: "No guests yet", empty: true },
    vendors: vendors.length
      ? { line: `${booked} booked · ${vendors.length} tracked` }
      : { line: "No vendors yet", empty: true },
    layout: count(layoutsRes)
      ? { line: plural(count(layoutsRes), "floor plan") }
      : { line: "No floor plans yet", empty: true },
    website: wedding.website_published
      ? { line: "Live for guests" }
      : { line: "Not published yet", empty: true },
    travel: count(travelRes)
      ? { line: plural(count(travelRes), "item") }
      : { line: "Nothing added yet", empty: true },
    ideas: count(ideasRes)
      ? { line: `${plural(count(ideasRes), "idea")} saved` }
      : { line: "No ideas saved yet", empty: true },
    team: members > 1
      ? { line: plural(members, "planner") }
      : { line: "Just you so far", empty: true },
    community: groups?.length
      ? { line: `${plural(groups.length, "group")} · ${plural(upcomingEvents.length, "event")}` }
      : { line: "No groups yet", empty: true },
    ai: { line: "Ready 24/7" },
  };

  // Getting-started guide: the first step in each switched-on tool, ticked off
  // as the couple does it. It's what turns an empty dashboard into a to-do.
  const steps = tools
    .filter((t) => t.key !== "ai")
    .map((t) => ({ tool: t, done: !(stats[t.key]?.empty ?? false) }));
  const stepsDone = steps.filter((s) => s.done).length;
  const nextStep = steps.find((s) => !s.done);

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
          {showAllWeddings && (
            <Link href="/dashboard" className="text-sm font-semibold text-brand-text hover:text-brand-deep">
              ← All weddings
            </Link>
          )}
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
            <div className="flex flex-wrap gap-2">
              <a
                href="#tools"
                className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
              >
                Customize tools
              </a>
              {nextStep && (
                <Link
                  href={nextStep.tool.path(id)}
                  className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-transform hover:-translate-y-0.5"
                >
                  {nextStep.tool.icon} {nextStep.tool.start}
                </Link>
              )}
            </div>
          </div>
          <WeddingNav weddingId={id} active="overview" enabled={wedding.enabled_tools} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <FlashBanner message={flash} />

        {/* Stat tiles — each one goes somewhere, and says what to do when empty */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat
            icon="⏳"
            label="Countdown"
            value={countdownValue}
            sub={countdownSub}
            action={days == null ? "Add your date →" : undefined}
            href={days == null ? `/w/${id}/details` : undefined}
          />
          <Stat
            icon="✅"
            label="Planning progress"
            value={`${pct}%`}
            sub={allTasks.length > 0 ? `${done} of ${allTasks.length} tasks` : "No tasks yet"}
            action={allTasks.length > 0 ? "View checklist →" : "Build your checklist →"}
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
              icon="💌"
              label="Guests & RSVP"
              value={String(confirmed)}
              sub={`confirmed of ${invitedSeats} invited`}
              action={awaiting > 0 ? `${plural(awaiting, "household")} yet to reply →` : "Manage guests →"}
              href={`/w/${id}/guests`}
            />
          ) : (
            <Stat
              icon="💌"
              label="Guests"
              value={wedding.guest_count != null ? String(wedding.guest_count) : "—"}
              sub={wedding.guest_count != null ? "expected" : "Not set"}
              action={on.has("guests") ? "Start your guest list →" : undefined}
              href={on.has("guests") ? `/w/${id}/guests` : undefined}
            />
          )}
          <Stat
            icon="💰"
            label="Budget"
            value={budget ?? "—"}
            sub={paid > 0 ? `${money(paid, currency)} paid so far` : budget ? "total budget" : "Not set"}
            action={budgetItems.length ? "Manage budget →" : "Build your budget →"}
            href={`/w/${id}/budget`}
          />
        </div>

        {/* Tools: the couple's pinned tools, plus the marketplace to add more */}
        <WeddingTools weddingId={id} initialEnabled={tools.map((t) => t.key)} stats={stats} />

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Getting started */}
            {stepsDone < steps.length && (
              <section className="rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink">Your next steps</h2>
                    <p className="text-sm text-ink-soft/60">
                      {stepsDone} of {steps.length} done — get each tool off the ground.
                    </p>
                  </div>
                  <div className="h-1.5 w-32 overflow-hidden rounded-full bg-stone-2">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-dark"
                      style={{ width: `${Math.round((stepsDone / steps.length) * 100)}%` }}
                    />
                  </div>
                </div>
                <ol className="mt-5 space-y-2">
                  {/* Only what's left; finished steps collapse into one line below. */}
                  {steps.filter((st) => !st.done).map(({ tool, done: stepDone }) => (
                    <li key={tool.key}>
                      {tool.key === "checklist" && !stepDone ? (
                        // The checklist step can be finished right here, in one tap.
                        <div className="rounded-2xl border border-brand/30 bg-brand-wash p-4">
                          <p className="flex items-center gap-3 text-sm font-medium text-ink">
                            <span aria-hidden className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 border-brand text-[10px]" />
                            {tool.icon} Build your checklist
                          </p>
                          <p className="mt-1 pl-9 text-xs text-ink-soft/70">
                            A full plan with deadlines worked out from your date — pick how you&rsquo;d like to start.
                          </p>
                          <div className="mt-3 flex flex-col gap-2 pl-9 sm:flex-row">
                            <GeneratePlanButton
                              weddingId={id}
                              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-xs font-semibold text-white disabled:opacity-70"
                            >
                              ✨ Build my plan with AI
                            </GeneratePlanButton>
                            <form action={seedExpertPlan}>
                              <input type="hidden" name="wedding_id" value={id} />
                              <button
                                type="submit"
                                className="w-full rounded-full border border-brand/40 bg-white px-5 py-2 text-xs font-semibold text-brand-text hover:bg-brand/5 sm:w-auto"
                              >
                                Use the expert checklist ({TEMPLATE_TASK_COUNT} steps)
                              </button>
                            </form>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={tool.path(id)}
                          className="flex items-center gap-3 rounded-2xl border border-stone-2 px-4 py-3 text-sm transition-colors hover:border-brand/40 hover:bg-brand-wash/50"
                        >
                          <span
                            aria-hidden
                            className={`flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] ${
                              stepDone ? "bg-brand text-white" : "border-2 border-stone-5"
                            }`}
                          >
                            {stepDone && "✓"}
                          </span>
                          <span className={`flex-1 ${stepDone ? "text-ink-soft/50 line-through" : "font-medium text-ink"}`}>
                            {tool.icon} {tool.start}
                          </span>
                          {!stepDone && <span className="text-xs font-semibold text-brand-text">Start →</span>}
                        </Link>
                      )}
                    </li>
                  ))}
                </ol>
                {stepsDone > 0 && (
                  <p className="mt-4 text-xs text-ink-soft/60">
                    ✓ Done: {steps.filter((st) => st.done).map((st) => st.tool.start).join(" · ")}
                  </p>
                )}
              </section>
            )}

            {/* Next up */}
            {nextUp.length > 0 && (
              <section className="rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
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

          {/* Side cards */}
          <aside className="space-y-6">
            {on.has("ai") && (
              <section className="rounded-3xl bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-glow">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                  ✨ Bridal AI assistant
                </p>
                <h2 className="mt-2 text-lg font-light">
                  Stuck on something? Ask about your {wedding.city ? `${wedding.city} ` : ""}wedding.
                </h2>
                <ul className="mt-4 space-y-2 text-sm">
                  {[
                    "What should we book first?",
                    "How much should a photographer cost?",
                    "Help me word our invitations",
                  ].map((q) => (
                    <li key={q} className="rounded-xl bg-white/15 px-3 py-2">
                      “{q}”
                    </li>
                  ))}
                </ul>
                <Link
                  href="/planner"
                  className="mt-5 block rounded-full bg-white py-2.5 text-center text-sm font-semibold text-brand-text transition-transform hover:-translate-y-0.5"
                >
                  Ask Bridal AI
                </Link>
              </section>
            )}

            {on.has("community") && (
              <section className="rounded-3xl border border-stone-2 bg-white p-6 shadow-card">
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-semibold text-ink">🎉 Groups &amp; events</h2>
                  <Link href="/dashboard/community" className="text-xs font-semibold text-brand-text">
                    Manage →
                  </Link>
                </div>
                {groups && groups.length > 0 ? (
                  <ul className="mt-4 space-y-2">
                    {groups.slice(0, 3).map((g) => (
                      <li key={g.id}>
                        <Link
                          href="/community"
                          className="block rounded-xl bg-stone-4 px-3 py-2 text-sm font-medium text-ink hover:text-brand-text"
                        >
                          {g.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-ink-soft/70">
                    Bring your bridesmaids, groomsmen and family together in one place.
                  </p>
                )}
                {upcomingEvents.length > 0 && (
                  <ul className="mt-4 space-y-2 border-t border-stone-2 pt-4">
                    {upcomingEvents.slice(0, 2).map((e) => (
                      <li key={e.id} className="text-sm">
                        <p className="font-medium text-ink">{e.title}</p>
                        <p className="text-xs text-ink-soft/60">
                          {shortDate(new Date(e.starts_at))}
                          {e.location && ` · ${e.location}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                {!groups?.length && (
                  <Link
                    href="/dashboard/community"
                    className="mt-4 block rounded-full bg-gradient-to-r from-brand to-brand-dark py-2 text-center text-xs font-semibold text-white"
                  >
                    Create a group →
                  </Link>
                )}
              </section>
            )}

            {!on.has("community") && (
              <a
                href="#tools"
                className="block rounded-3xl border border-dashed border-stone-5 p-6 text-center text-sm text-ink-soft/70 transition-colors hover:border-brand hover:text-brand-text"
              >
                <span className="block text-2xl">🧩</span>
                Need more? Add groups, travel, seating and more from the tool marketplace.
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
