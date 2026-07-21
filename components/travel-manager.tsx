"use client";

import { useState, useTransition } from "react";
import { addTravelItem, updateTravelItem, deleteTravelItem, type TravelPatch } from "@/app/w/[id]/travel/actions";

export interface TravelItem {
  id: string;
  kind: string;
  title: string;
  location: string | null;
  url: string | null;
  code: string | null;
  reserve_by: string | null;
  rate_cents: number | null;
  detail: string | null;
}

const KINDS = [
  { key: "lodging", label: "Accommodations", blurb: "Hotels and room blocks for your guests" },
  { key: "transport", label: "Transportation", blurb: "Shuttles, transfers and getting around" },
  { key: "info", label: "Travel notes", blurb: "Flights, destination details, anything guests should know" },
] as const;

const field =
  "rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand disabled:opacity-50";

const dollarStr = (c: number | null) => (c ? (c / 100).toFixed(2) : "");

function ItemCard({
  item,
  disabled,
  onPatch,
  onDelete,
}: {
  item: TravelItem;
  disabled: boolean;
  onPatch: (id: string, p: TravelPatch) => void;
  onDelete: (id: string) => void;
}) {
  const isLodging = item.kind === "lodging";
  return (
    <article className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <input
          defaultValue={item.title}
          disabled={disabled}
          onBlur={(e) => e.target.value !== item.title && onPatch(item.id, { title: e.target.value })}
          className="w-full border-none bg-transparent text-lg font-medium text-ink outline-none"
        />
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={disabled}
          aria-label="Remove"
          className="flex-none text-ink-soft/30 transition-colors hover:text-red-600 disabled:opacity-40"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="mt-3 space-y-2">
        <input
          defaultValue={item.location ?? ""}
          disabled={disabled}
          placeholder={isLodging ? "Address" : item.kind === "transport" ? "From → to" : "Location"}
          onBlur={(e) => onPatch(item.id, { location: e.target.value })}
          className={`${field} w-full`}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <input defaultValue={item.url ?? ""} disabled={disabled} placeholder="Link (booking / info)"
            onBlur={(e) => onPatch(item.id, { url: e.target.value })} className={field} />
          <input defaultValue={item.code ?? ""} disabled={disabled}
            placeholder={isLodging ? "Room-block code" : "Confirmation / code"}
            onBlur={(e) => onPatch(item.id, { code: e.target.value })} className={field} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs text-ink-soft/60">
            {isLodging ? "Reserve by" : "Date"}
            <input type="date" defaultValue={item.reserve_by ?? ""} disabled={disabled}
              onBlur={(e) => onPatch(item.id, { reserve_by: e.target.value })} className={`${field} mt-1 w-full`} />
          </label>
          {isLodging && (
            <label className="block text-xs text-ink-soft/60">
              Nightly rate
              <div className="relative mt-1">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft/50">$</span>
                <input inputMode="decimal" defaultValue={dollarStr(item.rate_cents)} disabled={disabled} placeholder="0"
                  onBlur={(e) => onPatch(item.id, { rateDollars: parseFloat(e.target.value) || 0 })}
                  className={`${field} w-full pl-6 text-right`} />
              </div>
            </label>
          )}
        </div>
        <textarea
          defaultValue={item.detail ?? ""}
          disabled={disabled}
          placeholder="Notes for your guests…"
          rows={2}
          onBlur={(e) => onPatch(item.id, { detail: e.target.value })}
          className={`${field} w-full resize-y`}
        />
      </div>
    </article>
  );
}

export default function TravelManager({
  items,
  weddingId,
}: {
  items: TravelItem[];
  weddingId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const patch = (id: string, p: TravelPatch) => startTransition(() => updateTravelItem(id, weddingId, p));
  const remove = (id: string) => startTransition(() => deleteTravelItem(id, weddingId));
  const add = (kind: string) => {
    const title = (drafts[kind] ?? "").trim();
    if (!title) return;
    startTransition(() => addTravelItem(weddingId, kind, title));
    setDrafts((d) => ({ ...d, [kind]: "" }));
  };

  return (
    <div className="space-y-10">
      {KINDS.map(({ key, label, blurb }) => {
        const rows = items.filter((i) => i.kind === key);
        return (
          <section key={key}>
            <h2 className="text-lg font-medium text-ink">{label}</h2>
            <p className="mt-0.5 text-sm text-ink-soft/60">{blurb}</p>

            {rows.length > 0 && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {rows.map((item) => (
                  <ItemCard key={item.id} item={item} disabled={pending} onPatch={patch} onDelete={remove} />
                ))}
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-3 sm:flex-row">
              <input
                value={drafts[key] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && add(key)}
                placeholder={
                  key === "lodging" ? "Add a hotel or room block…" : key === "transport" ? "Add a shuttle or transfer…" : "Add a travel note…"
                }
                className={`${field} flex-1`}
              />
              <button type="button" onClick={() => add(key)} disabled={pending}
                className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2 text-sm font-semibold text-white disabled:opacity-60">
                Add
              </button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
