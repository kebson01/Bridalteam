import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import WeddingNav from "@/components/wedding-nav";
import FlashBanner from "@/components/flash-banner";
import LayoutDrawing from "@/components/layout/layout-drawing";
import Icon, { type IconName } from "@/components/layout/icons";
import { supabaseServer } from "@/lib/supabase/server";
import { flashFrom } from "@/lib/flash";
import { guestsByTable } from "@/lib/seating";
import {
  PIECES,
  findClashes,
  findTightSpots,
  isApproximate,
  sanitizeItems,
  seatTotal,
  tableCount,
  tableKey,
} from "@/lib/venue-layout";
import { createLayout, listLayouts, listSeatGuests } from "./actions";

export const metadata: Metadata = {
  title: "Venue layout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** The three ways to set up a room, shown as cards under "Set up a new space". */
const METHODS: {
  method: "plan" | "photo" | "blank";
  icon: IconName;
  title: string;
  badge: string;
  body: string;
  points: string[];
  cta: string;
  tone: string;
}[] = [
  {
    method: "plan",
    icon: "plan",
    title: "Venue floor plan",
    badge: "Most precise",
    body: "Upload your venue’s floor plan and draw one line along a wall you know the length of. Everything is then to scale.",
    points: ["A photo or screenshot of the plan works", "Exact measurements for rentals"],
    cta: "Upload floor plan",
    tone: "bg-brand-wash text-brand-text",
  },
  {
    method: "photo",
    icon: "camera",
    title: "Photo of the room",
    badge: "Approximate",
    body: "Tap the floor’s four corners on a photo and enter the room’s size. You plan on a clean grid; the photo stays as a reference you can switch on.",
    points: ["Good for a first look at a venue", "Marked approximate until you add a plan"],
    cta: "Start from a photo",
    tone: "bg-emerald-50 text-emerald-800",
  },
  {
    method: "blank",
    icon: "blank",
    title: "Blank room",
    badge: "Quickest",
    body: "Type the width and depth and start placing tables on a grid. Ideal for a tent, a lawn or a simple hall.",
    points: ["Snaps to a 6-inch grid", "Switch to a floor plan any time"],
    cta: "Create blank room",
    tone: "bg-stone-4 text-ink-soft",
  },
];

export default async function LayoutsPage({
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
  if (!user) redirect(`/auth/login?next=/w/${id}/layout`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, partner_one, partner_two")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const [layouts, people, { data: households }] = await Promise.all([
    listLayouts(id),
    listSeatGuests(id),
    supabase.from("wedding_guests").select("seats").eq("wedding_id", id),
  ]);
  const names = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");
  // Invited seats, not RSVPs: the room has to fit everyone who might say yes.
  const invited = (households ?? []).reduce((s, g) => s + ((g.seats as number) ?? 0), 0);
  const confirmed = people?.length ?? 0;
  const byTable = guestsByTable(people ?? []);

  const spaces = (layouts ?? []).map((l) => {
    const items = sanitizeItems(l.items, l.width_ft, l.length_ft);
    const clashes = findClashes(items, l.width_ft, l.length_ft);
    const tight = findTightSpots(items, clashes);
    const seated = items
      .filter((it) => PIECES[it.kind].isTable)
      .reduce((s, it) => s + (byTable.get(tableKey(it.label))?.length ?? 0), 0);
    const setUp = Boolean(l.floor_source || l.base_image_url || items.length);
    return { l, items, issues: clashes.size + tight.length, seated, setUp, seats: seatTotal(items) };
  });
  const totalIssues = spaces.reduce((s, x) => s + x.issues, 0);
  const seatedAnywhere = [...byTable.values()].reduce((s, g) => s + g.length, 0);

  return (
    <div className="min-h-screen bg-stone-4/40">
      <div className="border-b border-stone-2 bg-white">
        <div className="mx-auto max-w-6xl px-5 py-8">
          <Link href={`/w/${id}`} className="text-sm font-semibold text-brand-text hover:text-brand-deep">
            ← Back to overview
          </Link>
          <WeddingNav weddingId={id} active="layout" />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-10">
        <FlashBanner message={flash} />

        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-text">
              {names ? `${names} · ` : ""}Venue setup
            </p>
            <h1 className="mt-2 font-display text-4xl font-light text-ink">Spaces &amp; layouts</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft/80">
              Plan each room to scale &mdash; from your venue&rsquo;s floor plan, a photo of the room or its
              measurements &mdash; then seat your guests table by table. Everyone on your team can open it,
              including your planner.
            </p>
          </div>
          <a
            href="#new-space"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-glow hover:bg-brand-deep"
          >
            <Icon name="plus" /> New space
          </a>
        </div>

        {layouts === null ? (
          <p className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            Couldn&rsquo;t load your layouts. Please refresh the page.
          </p>
        ) : (
          <>
            <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-stone-2 bg-stone-2 shadow-card sm:grid-cols-4">
              <Summary label="Spaces" value={String(layouts.length)} note={layouts.length === 1 ? "room planned" : "rooms planned"} />
              <Summary label="Guests seated" value={String(seatedAnywhere)} note={`of ${confirmed} confirmed`} />
              <Summary label="Invited seats" value={String(invited)} note="households’ seats" />
              <Summary
                label="Walkways & clashes"
                value={totalIssues ? String(totalIssues) : "All clear"}
                note={totalIssues ? "to look at" : "36″ walkways kept"}
                tone={totalIssues ? "text-red-700" : "text-emerald-700"}
              />
            </dl>

            {spaces.length > 0 && (
              <section className="mt-10">
                <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
                  Your spaces
                  <span className="rounded-full bg-white px-2.5 py-0.5 font-body text-xs font-semibold text-ink-soft ring-1 ring-stone-2">
                    {spaces.length}
                  </span>
                </h2>
                <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {spaces.map(({ l, items, issues, seated, setUp, seats }) => {
                    const pct = invited ? Math.min(100, Math.round((seats / invited) * 100)) : 0;
                    const status = !setUp
                      ? { text: "Not set up", cls: "bg-stone-4 text-ink-soft" }
                      : issues
                        ? { text: `${issues} to check`, cls: "bg-red-50 text-red-700" }
                        : isApproximate(l.floor_source)
                          ? { text: "Approximate", cls: "bg-amber-50 text-amber-800" }
                          : { text: "Ready", cls: "bg-emerald-50 text-emerald-700" };
                    return (
                      <li key={l.id} className="flex flex-col overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-card">
                        <Link href={`/w/${id}/layout/${l.id}`} className="relative block bg-brand-wash/60 p-4" tabIndex={-1}>
                          {setUp ? (
                            <LayoutDrawing
                              idPrefix={`card${l.id.slice(0, 8)}`}
                              width={l.width_ft}
                              length={l.length_ft}
                              imageUrl={null}
                              items={items}
                              layers={{ photo: false, grid: true, room: true, chairs: true, labels: true }}
                              role="img"
                              aria-label={`${l.name}, overhead layout`}
                              className="mx-auto block aspect-[3/2] h-auto w-full"
                            />
                          ) : (
                            <div className="flex aspect-[3/2] items-center justify-center rounded-lg border border-dashed border-stone-5 text-sm text-ink-soft/60">
                              Room not set up yet
                            </div>
                          )}
                          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-medium text-ink-soft ring-1 ring-stone-2">
                            {l.width_ft}′ × {l.length_ft}′ · {Math.round(l.width_ft * l.length_ft).toLocaleString()} sq ft
                          </span>
                          <span className={`absolute bottom-3 right-3 rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.cls}`}>
                            {status.text}
                          </span>
                        </Link>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-display text-lg font-semibold text-ink">{l.name}</h3>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft/50">
                              {l.floor_source === "plan" ? "Floor plan" : l.floor_source === "photo" ? "From photo" : l.floor_source === "blank" ? "Measured" : ""}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-ink-soft/75">
                            {tableCount(items)} tables · {seats} seats · {seated} guests seated
                          </p>
                          {invited > 0 && setUp && (
                            <div className="mt-4">
                              <div className="flex justify-between text-xs font-medium text-ink-soft">
                                <span>Seats for invited guests</span>
                                <span>
                                  {seats} / {invited}
                                </span>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-2">
                                <div
                                  className={`h-full rounded-full ${seats >= invited ? "bg-emerald-600" : "bg-brand"}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="mt-auto flex gap-2 pt-5">
                            <Link
                              href={`/w/${id}/layout/${l.id}`}
                              className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold ${
                                setUp ? "bg-brand text-white hover:bg-brand-deep" : "bg-stone-4 text-ink hover:bg-stone-2"
                              }`}
                            >
                              <Icon name={setUp ? "grid" : "ruler"} />
                              {setUp ? "Open editor" : "Continue setup"}
                            </Link>
                            {setUp && (
                              <Link
                                href={`/w/${id}/layout/${l.id}/print`}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-4 text-ink-soft hover:bg-stone-2 hover:text-ink"
                                aria-label={`Print or save ${l.name} as PDF`}
                                title="Print / PDF"
                              >
                                <Icon name="download" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <section id="new-space" className="mt-14 scroll-mt-6">
              <h2 className="flex items-center gap-2 font-display text-2xl font-light text-ink">
                <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
                Set up a new space
              </h2>
              <p className="mt-1 text-sm text-ink-soft/75">
                Name the room, then choose how you&rsquo;d like to measure it. You can switch methods later and your
                tables stay where they are.
              </p>
              <form action={createLayout.bind(null, id)} className="mt-5">
                <label className="block max-w-md">
                  <span className="text-sm font-medium text-ink-soft">Space name</span>
                  <input
                    name="name"
                    maxLength={80}
                    placeholder={layouts.length ? "Ceremony, Cocktail hour…" : "Reception"}
                    className="mt-1 w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand"
                  />
                </label>
                <div className="mt-5 grid gap-5 md:grid-cols-3">
                  {METHODS.map((m) => (
                    <div key={m.method} className="flex flex-col rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
                      <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${m.tone}`}>
                        <Icon name={m.icon} width={24} height={24} />
                      </span>
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-display text-lg font-semibold text-ink">{m.title}</h3>
                        <span className="rounded-full bg-stone-4 px-2.5 py-0.5 text-xs font-medium text-ink-soft">{m.badge}</span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-ink-soft/80">{m.body}</p>
                      <ul className="mt-4 space-y-1.5 text-xs text-ink-soft">
                        {m.points.map((p) => (
                          <li key={p} className="flex items-center gap-2">
                            <Icon name="check" width={14} height={14} className="text-emerald-700" />
                            {p}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto pt-6">
                        <button
                          name="method"
                          value={m.method}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-stone-4 px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand hover:text-white"
                        >
                          <Icon name={m.method === "plan" ? "upload" : m.method === "photo" ? "camera" : "ruler"} />
                          {m.cta}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </form>
            </section>

            <p className="mt-10 flex flex-wrap items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm text-ink-soft ring-1 ring-stone-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-wash text-brand-text">
                <Icon name="shield" />
              </span>
              <span>
                <strong className="text-brand-text">Planner standard:</strong> the editor flags pieces that overlap or
                block a door, and anywhere chair backs leave less than a 36&Prime; walkway for servers and gowns.
              </span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Summary({ label, value, note, tone }: { label: string; value: string; note: string; tone?: string }) {
  return (
    <div className="bg-white px-5 py-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft/60">{label}</dt>
      <dd className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`font-display text-2xl font-light ${tone ?? "text-ink"}`}>{value}</span>
        <span className="text-xs text-ink-soft/70">{note}</span>
      </dd>
    </div>
  );
}
