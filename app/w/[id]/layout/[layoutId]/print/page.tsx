import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LayoutDrawing, { ALL_LAYERS, LAYER_LABELS, type Layers } from "@/components/layout/layout-drawing";
import PrintButton from "@/components/print-button";
import { supabaseServer } from "@/lib/supabase/server";
import {
  PIECES,
  isApproximate,
  sanitizeItems,
  seatTotal,
  tableCount,
  tableKey,
} from "@/lib/venue-layout";
import { guestsByTable, seatTable, tableTitle } from "@/lib/seating";
import { getLayout, listSeatGuests } from "../../actions";

export const metadata: Metadata = {
  title: "Print layout",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** `?hide=chairs,labels` — the layers the editor had switched off. */
function layersFrom(raw: string | string[] | undefined): Layers {
  const hidden = new Set((Array.isArray(raw) ? raw.join(",") : (raw ?? "")).split(",").filter(Boolean));
  return Object.fromEntries(
    Object.keys(ALL_LAYERS).map((k) => [k, !hidden.has(k)]),
  ) as unknown as Layers;
}

function hideParam(layers: Layers): string {
  const off = (Object.keys(layers) as (keyof Layers)[]).filter((k) => !layers[k]);
  return off.length ? `?hide=${off.join(",")}` : "";
}

/**
 * The layout on paper, or as a PDF through the browser's print dialog: the
 * drawing on a landscape page, then who sits at each table, for the venue
 * coordinator and rental company. Uses the same drawing as the editor, so
 * what prints is what the couple arranged.
 */
export default async function LayoutPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; layoutId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id, layoutId } = await params;
  const layers = layersFrom((await searchParams).hide);

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/w/${id}/layout/${layoutId}/print`);

  const [layout, guests, { data: wedding }] = await Promise.all([
    getLayout(id, layoutId),
    listSeatGuests(id),
    supabase.from("weddings").select("partner_one, partner_two, event_date").eq("id", id).maybeSingle(),
  ]);
  if (!layout || !wedding) notFound();

  const items = sanitizeItems(layout.items, layout.width_ft, layout.length_ft);
  const approximate = isApproximate(layout.floor_source);
  const couple = [wedding.partner_one, wedding.partner_two].filter(Boolean).join(" & ");

  // Confirmed guests by table: only people who said yes have a chair.
  const byTable = guestsByTable(guests ?? []);
  const seatedCounts = Object.fromEntries([...byTable].map(([k, v]) => [k, v.length]));

  const tables = items
    .filter((it) => PIECES[it.kind].isTable)
    .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" }));
  const onLayout = new Set(tables.map((t) => tableKey(t.label)));
  // Guests seated at a table name that isn't on this layout — usually a typo
  // ("Table 12" with no table 12), worth catching before the day.
  const elsewhere = [...byTable]
    .filter(([k]) => !onLayout.has(k))
    .map(([k, gs]) => [gs[0].tableName ?? k, gs.map((g) => g.name)] as const);

  const date = wedding.event_date
    ? new Date(`${wedding.event_date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-stone-4/40 print:bg-white">
      {/* Landscape for the drawing; the table list flows onto the next page. */}
      <style>{`@page { size: landscape; margin: 12mm; }`}</style>

      <div className="border-b border-stone-2 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-5 py-5">
          <Link
            href={`/w/${id}/layout/${layoutId}`}
            className="text-sm font-semibold text-brand-text hover:text-brand-deep"
          >
            ← Back to the layout
          </Link>
          <div className="ml-auto">
            <PrintButton />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-5 pb-5 text-sm text-ink-soft">
          <span className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">Show</span>
          {LAYER_LABELS.filter(([k]) => k !== "photo" || layout.base_image_url).map(([k, label]) => {
            const next = { ...layers, [k]: !layers[k] };
            return (
              <Link
                key={k}
                href={`/w/${id}/layout/${layoutId}/print${hideParam(next)}`}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  layers[k] ? "bg-brand text-white" : "border border-stone-2 text-ink-soft hover:border-brand"
                }`}
                aria-pressed={layers[k]}
              >
                {label}
              </Link>
            );
          })}
          <span className="text-ink-soft/60">
            · Choose &ldquo;Save as PDF&rdquo; as the printer to get a file you can email.
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 py-8 print:max-w-none print:px-0 print:py-0">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">{layout.name}</h1>
            <p className="text-sm text-ink-soft/70">
              {[couple, date].filter(Boolean).join(" · ")}
            </p>
          </div>
          <p className="text-sm text-ink-soft">
            {layout.width_ft} × {layout.length_ft} ft · {tableCount(items)} tables · {seatTotal(items)} seats
          </p>
        </header>
        {approximate && (
          <p className="mt-2 text-sm text-amber-800">
            Approximate: this floor was straightened from a photo, so measurements are estimates. Confirm sizes
            against the venue&rsquo;s floor plan before booking rentals.
          </p>
        )}

        <div className="mt-4 break-inside-avoid rounded-2xl border border-stone-2 bg-white p-2 print:rounded-none print:border-0 print:p-0">
          <LayoutDrawing
            idPrefix="print"
            width={layout.width_ft}
            length={layout.length_ft}
            imageUrl={layout.base_image_url}
            items={items}
            layers={layers}
            approximate={approximate}
            seatedByTable={seatedCounts}
            role="img"
            aria-label={`${layout.name}, overhead layout`}
            className="block h-auto max-h-[80vh] w-full print:max-h-[160mm]"
          />
        </div>

        {tables.length > 0 && (
          <section className="mt-8 print:mt-0 print:break-before-page">
            <h2 className="font-display text-xl font-semibold text-ink">Tables</h2>
            <p className="text-sm text-ink-soft/70">
              Guests who have accepted, chair by chair (1 is 12 o&rsquo;clock, then clockwise), with their meal and
              dietary needs for the caterer.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 print:grid-cols-3">
              {tables.map((t) => {
                const { chairs, overflow } = seatTable(byTable.get(tableKey(t.label)) ?? [], t.seats);
                const count = chairs.filter(Boolean).length + overflow.length;
                const over = overflow.length > 0;
                return (
                  <div
                    key={t.id}
                    className="break-inside-avoid rounded-xl border border-stone-2 bg-white p-4 print:rounded-none"
                  >
                    <div className="flex items-baseline justify-between gap-2 border-b border-stone-2 pb-1.5">
                      <h3 className="font-semibold text-ink">{tableTitle(t.label)}</h3>
                      <span className={`text-xs ${over ? "font-semibold text-red-700" : "text-ink-soft/60"}`}>
                        {count}/{t.seats} · {PIECES[t.kind].label}
                      </span>
                    </div>
                    {count ? (
                      <ol className="mt-2 space-y-0.5 text-sm text-ink">
                        {chairs.map((g, i) =>
                          g ? (
                            <li key={g.id} className="flex gap-2">
                              <span className="w-5 shrink-0 text-right text-xs leading-5 text-ink-soft/50">{i + 1}</span>
                              <span>
                                {g.name}
                                {(g.dish || g.dietary) && (
                                  <span className="text-ink-soft/70">
                                    {" — "}
                                    {[g.dish, g.dietary].filter(Boolean).join(" · ")}
                                  </span>
                                )}
                              </span>
                            </li>
                          ) : null,
                        )}
                        {overflow.map((g) => (
                          <li key={g.id} className="flex gap-2 text-red-700">
                            <span className="w-5 shrink-0 text-right text-xs leading-5">!</span>
                            {g.name} (no chair)
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-2 text-sm text-ink-soft/50">No one seated yet</p>
                    )}
                  </div>
                );
              })}
            </div>

            {elsewhere.length > 0 && (
              <div className="mt-6 break-inside-avoid rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 print:rounded-none">
                <p className="font-semibold">Seated at a table that isn&rsquo;t on this layout</p>
                <ul className="mt-1 space-y-0.5">
                  {elsewhere.map(([key, names]) => (
                    <li key={key}>
                      &ldquo;{key}&rdquo;: {names.join(", ")}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
