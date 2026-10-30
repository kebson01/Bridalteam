"use client";

import Icon from "@/components/layout/icons";
import { PANEL, Tag } from "@/components/layout/table-inspector";
import { dietaryTags, seatGuest, tableTitle, type SeatChange, type SeatGuest, type TableSeating } from "@/lib/seating";
import { PIECES, tableKey, type LayoutItem } from "@/lib/venue-layout";

/**
 * The layout as a seating chart: every table with who's in each chair, the
 * guests still waiting for a table, and anyone seated at a table name that
 * isn't on this layout. The quick way to seat a long list without hunting for
 * tables on the drawing.
 */
export default function SeatingList({
  tables,
  seatingOf,
  guests,
  onOpen,
  onSeats,
}: {
  tables: LayoutItem[];
  seatingOf: (t: LayoutItem) => TableSeating;
  guests: SeatGuest[];
  onOpen: (id: string) => void;
  onSeats: (changes: SeatChange[]) => void;
}) {
  const unseated = guests.filter((g) => !g.tableName);
  const keys = new Set(tables.map((t) => tableKey(t.label)));
  const elsewhere = new Map<string, SeatGuest[]>();
  for (const g of guests) {
    if (!g.tableName || keys.has(tableKey(g.tableName))) continue;
    elsewhere.set(g.tableName, [...(elsewhere.get(g.tableName) ?? []), g]);
  }
  const sorted = [...tables].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

  function seatAt(g: SeatGuest, id: string) {
    const t = tables.find((x) => x.id === id);
    if (t) onSeats(seatGuest(guests, g.id, tableTitle(t.label), t.seats));
  }

  const tablePicker = (g: SeatGuest) => (
    <select
      aria-label={`Seat ${g.name} at`}
      defaultValue=""
      onChange={(e) => e.target.value && seatAt(g, e.target.value)}
      className="rounded-lg border border-stone-2 bg-white px-2 py-1 text-sm"
    >
      <option value="" disabled>
        Seat at…
      </option>
      {sorted.map((t) => {
        const s = seatingOf(t);
        const free = s.chairs.filter((c) => !c).length;
        return (
          <option key={t.id} value={t.id}>
            {tableTitle(t.label)} ({free} free)
          </option>
        );
      })}
    </select>
  );

  return (
    <div className="space-y-5">
      {(unseated.length > 0 || elsewhere.size > 0) && (
        <div className={`${PANEL} p-5`}>
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Icon name="users" /> Waiting for a table
            <span className="rounded-full bg-brand-wash px-2 py-0.5 font-body text-xs font-semibold text-brand-text">
              {unseated.length}
            </span>
          </h3>
          {unseated.length > 0 ? (
            <ul className="mt-3 divide-y divide-stone-2">
              {unseated.map((g) => (
                <li key={g.id} className="flex flex-wrap items-center gap-2 py-2">
                  <span className="text-sm font-medium text-ink">{g.name}</span>
                  {dietaryTags(g.dietary).map((t) => (
                    <Tag key={t}>{t}</Tag>
                  ))}
                  <span className="text-xs text-ink-soft/60">{g.household}</span>
                  <span className="ml-auto">{tables.length > 0 && tablePicker(g)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-ink-soft/70">Everyone who has accepted has a table.</p>
          )}
          {elsewhere.size > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">Seated at a table that isn&rsquo;t on this layout</p>
              <ul className="mt-1 space-y-1">
                {[...elsewhere].map(([name, gs]) => (
                  <li key={name}>
                    &ldquo;{name}&rdquo;: {gs.map((g) => g.name).join(", ")}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs">Fine if they&rsquo;re in another room; otherwise rename the table to match.</p>
            </div>
          )}
        </div>
      )}

      {sorted.length === 0 ? (
        <p className={`${PANEL} p-5 text-sm text-ink-soft/70`}>Add tables on the canvas to start seating guests.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sorted.map((t) => {
            const s = seatingOf(t);
            const taken = s.chairs.filter(Boolean).length;
            return (
              <li key={t.id} className={`${PANEL} p-4`}>
                <button type="button" onClick={() => onOpen(t.id)} className="flex w-full items-baseline justify-between gap-2 text-left">
                  <span className="font-display text-lg font-semibold text-ink hover:text-brand-text">{tableTitle(t.label)}</span>
                  <span className={`text-xs font-medium ${s.overflow.length ? "text-red-700" : "text-ink-soft/60"}`}>
                    {taken + s.overflow.length}/{t.seats} · {PIECES[t.kind].label}
                  </span>
                </button>
                <ol className="mt-2 space-y-1 text-sm">
                  {s.chairs.map((g, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="w-5 text-right text-xs text-ink-soft/50">{i + 1}</span>
                      {g ? (
                        <>
                          <span className="truncate text-ink">{g.name}</span>
                          {dietaryTags(g.dietary).slice(0, 2).map((tag) => (
                            <Tag key={tag}>{tag}</Tag>
                          ))}
                        </>
                      ) : (
                        <span className="text-ink-soft/40">Open</span>
                      )}
                    </li>
                  ))}
                  {s.overflow.map((g) => (
                    <li key={g.id} className="flex items-center gap-2 text-red-700">
                      <span className="w-5 text-right text-xs">!</span>
                      {g.name} (no chair)
                    </li>
                  ))}
                </ol>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
