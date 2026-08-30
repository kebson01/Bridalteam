import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { listGuests } from "../actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Print",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** One line on a card or a chart: a person, their meal, and where they sit. */
interface Seat {
  name: string;
  dish: string | null;
  table: string | null;
  household: string;
}

const UNSEATED = "Not seated yet";

export default async function PrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!SHOW_PLANNER_APP) notFound();
  const { id } = await params;
  const sp = await searchParams;
  const view = (Array.isArray(sp.view) ? sp.view[0] : sp.view) === "seating" ? "seating" : "cards";

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/guests/print`);

  const { data: wedding } = await supabase
    .from("weddings")
    .select("partner_one, partner_two, event_date")
    .eq("id", id)
    .maybeSingle();
  if (!wedding) notFound();

  const guests = await listGuests(id);
  if (guests === null) notFound();

  // Only people who said yes get a card or a chair.
  const seats: Seat[] = [];
  for (const g of guests) {
    if (!g.responded_at || !g.attending) continue;
    g.attendees.forEach((a, i) => {
      seats.push({
        name: a.name?.trim() || `${g.household_name} (guest ${i + 1})`,
        dish: a.dish,
        table: a.table_name,
        household: g.household_name,
      });
    });
  }

  const couple = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  // Group by table for the chart. Unseated people go last rather than being
  // hidden — an incomplete chart you can see is more useful than a tidy one
  // that quietly drops six guests.
  const byTable = new Map<string, Seat[]>();
  for (const s of seats) {
    const key = s.table?.trim() || UNSEATED;
    byTable.set(key, [...(byTable.get(key) ?? []), s]);
  }
  const tables = [...byTable.entries()].sort(([a], [b]) => {
    if (a === UNSEATED) return 1;
    if (b === UNSEATED) return -1;
    // "Table 2" before "Table 10" — plain string sort gets this wrong.
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
  });

  return (
    <div className="min-h-screen bg-stone-4/40 print:bg-white">
      {/* Controls — deliberately hidden from the printed page. */}
      <div className="border-b border-stone-2 bg-white print:hidden">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-5 py-5">
          <Link
            href={`/w/${id}/guests`}
            className="text-sm font-semibold text-brand-text hover:text-brand-deep"
          >
            ← Back to guests
          </Link>
          <div className="ml-auto flex flex-wrap gap-2">
            <Link
              href={`/w/${id}/guests/print?view=cards`}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                view === "cards"
                  ? "bg-brand text-white"
                  : "border border-stone-2 text-ink-soft hover:border-brand"
              }`}
            >
              Place cards
            </Link>
            <Link
              href={`/w/${id}/guests/print?view=seating`}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                view === "seating"
                  ? "bg-brand text-white"
                  : "border border-stone-2 text-ink-soft hover:border-brand"
              }`}
            >
              Seating chart
            </Link>
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-5 pb-5 text-sm text-ink-soft/70">
          {seats.length} {seats.length === 1 ? "guest" : "guests"} confirmed. Use your browser&rsquo;s
          Print (Ctrl/Cmd&nbsp;+&nbsp;P) — the controls above won&rsquo;t appear on paper.
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-5 py-8 print:max-w-none print:px-0 print:py-0">
        {seats.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-2 bg-white p-12 text-center text-sm text-ink-soft/60 print:hidden">
            Nobody has accepted yet, so there&rsquo;s nothing to print.
          </p>
        ) : view === "cards" ? (
          /* Tent cards: fold along the top edge so the name faces the guest.
             Two per row, sized to be cut from A4/Letter card stock. */
          <div className="grid grid-cols-2 gap-4 print:gap-0">
            {seats.map((s, i) => (
              <div
                key={i}
                className="flex h-44 break-inside-avoid flex-col items-center justify-center rounded-xl border border-stone-2 bg-white p-5 text-center print:rounded-none print:border-dashed"
              >
                {couple && (
                  <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft/50">{couple}</p>
                )}
                <p className="mt-2 font-display text-2xl font-light text-ink">{s.name}</p>
                {s.table && (
                  <p className="mt-1 text-sm text-ink-soft/70">{s.table}</p>
                )}
                {s.dish && (
                  <p className="mt-3 rounded-full border border-stone-2 px-3 py-1 text-xs font-medium text-ink-soft">
                    {s.dish}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="hidden print:block">
              <h1 className="font-display text-2xl">{couple || "Seating chart"}</h1>
              <p className="text-sm text-ink-soft/70">
                {seats.length} guests · {tables.length} {tables.length === 1 ? "table" : "tables"}
              </p>
            </div>

            {tables.map(([table, people]) => (
              <section
                key={table}
                className="break-inside-avoid rounded-2xl border border-stone-2 bg-white p-5 print:rounded-none"
              >
                <div className="flex items-baseline justify-between border-b border-stone-2 pb-2">
                  <h2 className="font-display text-lg font-semibold text-ink">{table}</h2>
                  <span className="text-xs text-ink-soft/60">
                    {people.length} {people.length === 1 ? "seat" : "seats"}
                  </span>
                </div>
                <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                  {people.map((p, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-ink">{p.name}</span>
                      <span className="text-xs text-ink-soft/60">{p.dish ?? "—"}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
