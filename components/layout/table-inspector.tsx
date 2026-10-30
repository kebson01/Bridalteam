"use client";

import { useEffect, useState } from "react";
import SeatDial from "@/components/layout/seat-dial";
import Icon from "@/components/layout/icons";
import {
  dietaryTags,
  initials,
  seatGuest,
  swapSeats,
  tableTitle,
  unseatGuest,
  type SeatChange,
  type SeatGuest,
  type TableSeating,
} from "@/lib/seating";
import { PIECES, type LayoutItem, type PieceKind } from "@/lib/venue-layout";

export const PANEL = "rounded-2xl border border-stone-2 bg-white shadow-card";
export const CHIP_BTN =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-stone-4 px-3 py-2 text-sm font-medium text-ink hover:bg-stone-2 disabled:opacity-40";

/** The other standard size of a table, for "Change size" (a 72″ round that won't fit becomes a 60″). */
export const OTHER_SIZE: Partial<Record<PieceKind, PieceKind>> = {
  round60: "round72",
  round72: "round60",
  banquet6: "banquet8",
  banquet8: "banquet6",
};

export function Tag({ children }: { children: string }) {
  return (
    <span className="rounded-md bg-brand-wash px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-brand-text ring-1 ring-brand/20">
      {children}
    </span>
  );
}

/**
 * The selected table: its chairs as a dial, who's in each one, and the moves —
 * seat someone from the guests still waiting, swap two chairs, move a person
 * to another table or take them off it.
 *
 * Moving is two taps: tap a person (on the dial or the swap button in the
 * list), then tap the chair they should go to. An empty chair tapped on its
 * own offers the guests who haven't got a table yet.
 */
export default function TableInspector({
  item,
  seating,
  guests,
  tables,
  saving,
  onSeats,
  onChange,
  onDuplicate,
  onDelete,
  onClose,
  nameField,
}: {
  item: LayoutItem;
  seating: TableSeating;
  /** Everyone confirmed, seated or not. */
  guests: SeatGuest[];
  /** Every table on the layout, for "move to another table". */
  tables: LayoutItem[];
  saving: boolean;
  onSeats: (changes: SeatChange[]) => void;
  onChange: (patch: Partial<LayoutItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onClose: () => void;
  /** The editable name and seats fields, from the editor. */
  nameField: React.ReactNode;
}) {
  const def = PIECES[item.kind];
  const [picked, setPicked] = useState<number | null>(null);
  const [assigning, setAssigning] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const name = tableTitle(item.label);

  // A different table, or a change of seat count, starts fresh.
  useEffect(() => {
    setPicked(null);
    setAssigning(null);
  }, [item.id, item.seats]);

  const taken = seating.chairs.filter(Boolean) as SeatGuest[];
  const open = seating.chairs.length - taken.length;
  const tagged = taken.filter((g) => dietaryTags(g.dietary).length);
  const tagCounts = new Map<string, number>();
  for (const g of tagged) for (const t of dietaryTags(g.dietary)) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  const unseated = guests.filter((g) => !g.tableName);
  const pickedGuest = picked ? seating.chairs[picked - 1] : null;
  const other = OTHER_SIZE[item.kind];

  function tapSeat(n: number) {
    setAssigning(null);
    if (picked === null) {
      if (seating.chairs[n - 1]) setPicked(n);
      else {
        setAssigning(n);
        setQuery("");
      }
      return;
    }
    if (picked !== n) onSeats(swapSeats(guests, name, item.seats, picked, n));
    setPicked(null);
  }

  function assign(g: SeatGuest, seat: number) {
    onSeats(seatGuest(guests, g.id, name, item.seats, seat));
    setAssigning(null);
  }

  function moveTo(g: SeatGuest, tableId: string) {
    const t = tables.find((x) => x.id === tableId);
    if (!t) return;
    onSeats(seatGuest(guests, g.id, tableTitle(t.label), t.seats));
    setPicked(null);
  }

  const matches = unseated.filter((g) =>
    `${g.name} ${g.household}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className={PANEL}>
      <div className="flex items-start justify-between gap-3 border-b border-stone-2 p-5">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-display text-xl font-semibold text-ink">{name}</span>
            <span className="rounded-full bg-brand-wash px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-brand-text">
              Selected
            </span>
          </p>
          <p className="mt-0.5 text-sm text-ink-soft/70">
            {def.label} · seats {item.seats}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-ink-soft hover:bg-stone-4">
          <Icon name="close" />
        </button>
      </div>

      <div className="p-5">
        {item.seats > 0 && (
          <div className="rounded-2xl bg-stone-4/60 p-3">
            <p className="text-center">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-soft ring-1 ring-stone-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" aria-hidden />
                {taken.length} assigned · {open} open
              </span>
            </p>
            <SeatDial
              item={item}
              chairs={seating.chairs}
              picked={picked}
              onSeat={tapSeat}
              className="mx-auto mt-2 block h-auto max-h-72 w-full"
            />
            <p className="mt-1 text-center text-xs text-ink-soft/70" aria-live="polite">
              {picked && pickedGuest
                ? `Moving ${pickedGuest.name} — tap another chair to swap.`
                : "Tap a guest, then another chair, to swap seats."}
            </p>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-stone-4/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-soft/60">Assigned</p>
            <p className="mt-0.5 font-display text-xl text-ink">
              {taken.length + seating.overflow.length} guests
            </p>
            <p className="text-xs text-ink-soft/70">{open === 1 ? "1 open seat" : `${open} open seats`}</p>
          </div>
          <div className="rounded-xl bg-stone-4/60 p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-soft/60">Dietary</p>
            <p className={`mt-0.5 font-display text-xl ${tagged.length ? "text-brand-text" : "text-ink"}`}>
              {tagged.length} {tagged.length === 1 ? "note" : "notes"}
            </p>
            <p className="truncate text-xs text-ink-soft/70">
              {tagCounts.size ? [...tagCounts].map(([t, n]) => `${n} ${t}`).join(" · ") : "None at this table"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" className={CHIP_BTN} onClick={() => onChange({ rotation: (item.rotation + 45) % 360 })}>
            <Icon name="rotate" /> Rotate 45°
          </button>
          <button
            type="button"
            className={CHIP_BTN}
            disabled={!other}
            title={other ? `Switch to ${PIECES[other].label}` : "This table comes in one size"}
            onClick={() => {
              if (!other) return;
              const next = PIECES[other];
              onChange({
                kind: other,
                w: next.w,
                h: next.h,
                seats: item.seats === def.seats ? next.seats : item.seats,
              });
            }}
          >
            <Icon name="ruler" /> {other ? `Make ${PIECES[other].label}` : "Change size"}
          </button>
          <button type="button" className={CHIP_BTN} onClick={onDuplicate}>
            <Icon name="copy" /> Duplicate
          </button>
          <button type="button" className={`${CHIP_BTN} text-red-700`} onClick={onDelete}>
            <Icon name="trash" /> Delete
          </button>
        </div>

        {nameField}

        {item.seats > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/60">
                Seat roster ({item.seats} chairs)
              </h3>
              {saving && <span className="text-xs text-ink-soft/60">Saving…</span>}
            </div>

            {pickedGuest && (
              <div className="mt-3 rounded-xl border border-brand/30 bg-brand-wash p-3 text-sm text-ink">
                <p>
                  <strong>{pickedGuest.name}</strong> — tap another chair to swap, or:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tables.length > 1 && (
                    <select
                      aria-label="Move to another table"
                      defaultValue=""
                      onChange={(e) => e.target.value && moveTo(pickedGuest, e.target.value)}
                      className="rounded-lg border border-stone-2 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="" disabled>
                        Move to table…
                      </option>
                      {tables
                        .filter((t) => t.id !== item.id)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {tableTitle(t.label)}
                          </option>
                        ))}
                    </select>
                  )}
                  <button
                    type="button"
                    className="rounded-lg bg-white px-3 py-1.5 font-medium text-red-700 ring-1 ring-stone-2"
                    onClick={() => {
                      onSeats(unseatGuest(pickedGuest.id));
                      setPicked(null);
                    }}
                  >
                    Take off table
                  </button>
                  <button type="button" className="rounded-lg px-3 py-1.5 font-medium text-ink-soft" onClick={() => setPicked(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <ol className="mt-3 space-y-2">
              {seating.chairs.map((g, i) => {
                const n = i + 1;
                const isPicked = picked === n;
                return (
                  <li key={n}>
                    <div
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ring-1 transition-colors ${
                        isPicked ? "bg-brand-wash ring-brand" : g ? "bg-white ring-stone-2" : "bg-stone-4/60 ring-transparent"
                      }`}
                    >
                      <span
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                          g ? "bg-brand text-white" : "bg-white text-ink-soft/60 ring-1 ring-stone-2"
                        }`}
                        title={g ? initials(g.name) : undefined}
                      >
                        {String(n).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        {g ? (
                          <>
                            <p className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-ink">
                              <span className="truncate">{g.name}</span>
                              {dietaryTags(g.dietary).map((t) => (
                                <Tag key={t}>{t}</Tag>
                              ))}
                            </p>
                            <p className="truncate text-xs text-ink-soft/70" title={g.dietary ?? undefined}>
                              {[g.household !== g.name ? g.household : null, g.dish, g.dietary].filter(Boolean).join(" · ") ||
                                `Seat ${n}`}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm font-semibold text-ink-soft">Seat {n} available</p>
                            <p className="text-xs text-ink-soft/60">
                              {unseated.length ? `${unseated.length} guests waiting for a table` : "Everyone confirmed has a table"}
                            </p>
                          </>
                        )}
                      </div>
                      {g ? (
                        <button
                          type="button"
                          onClick={() => tapSeat(n)}
                          aria-label={isPicked ? `Cancel moving ${g.name}` : `Move ${g.name}`}
                          aria-pressed={isPicked}
                          className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isPicked ? "bg-brand text-white" : "bg-stone-4 text-ink-soft hover:bg-stone-2"
                          }`}
                        >
                          <Icon name="swap" />
                        </button>
                      ) : picked ? (
                        <button
                          type="button"
                          onClick={() => tapSeat(n)}
                          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand-text ring-1 ring-brand/40"
                        >
                          Move here
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => tapSeat(n)}
                          disabled={!unseated.length}
                          className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand-text ring-1 ring-stone-2 hover:ring-brand disabled:opacity-40"
                        >
                          Assign
                        </button>
                      )}
                    </div>

                    {assigning === n && (
                      <div className="mt-2 rounded-xl border border-stone-2 bg-white p-3">
                        <input
                          autoFocus
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === "Escape") setAssigning(null);
                          }}
                          placeholder="Find a guest…"
                          aria-label={`Find a guest for seat ${n}`}
                          className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
                        />
                        <ul className="mt-2 max-h-56 overflow-auto">
                          {matches.slice(0, 50).map((u) => (
                            <li key={u.id}>
                              <button
                                type="button"
                                onClick={() => assign(u, n)}
                                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand-wash"
                              >
                                <span className="font-medium text-ink">{u.name}</span>
                                {dietaryTags(u.dietary).map((t) => (
                                  <Tag key={t}>{t}</Tag>
                                ))}
                                <span className="ml-auto truncate text-xs text-ink-soft/60">{u.household}</span>
                              </button>
                            </li>
                          ))}
                          {!matches.length && <li className="px-2 py-1.5 text-sm text-ink-soft/60">No one waiting matches.</li>}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>

            {seating.overflow.length > 0 && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                <p className="font-semibold">No chair for {seating.overflow.length === 1 ? "1 guest" : `${seating.overflow.length} guests`}</p>
                <p className="mt-0.5">{seating.overflow.map((g) => g.name).join(", ")} — add seats or move them.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button type="button" className="rounded-lg bg-white px-3 py-1.5 font-medium ring-1 ring-red-200" onClick={() => onChange({ seats: Math.min(24, item.seats + seating.overflow.length) })}>
                    Add {seating.overflow.length === 1 ? "a seat" : `${seating.overflow.length} seats`}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-white px-3 py-1.5 font-medium ring-1 ring-red-200"
                    onClick={() => onSeats(seating.overflow.flatMap((g) => unseatGuest(g.id)))}
                  >
                    Take them off this table
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
