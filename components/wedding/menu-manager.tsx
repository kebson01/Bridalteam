"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addMenuOption,
  deleteMenuOption,
  type DishCount,
  type MenuOption,
} from "@/app/w/[id]/guests/actions";

/**
 * The menu, and how many people have chosen each dish.
 *
 * Counts sit next to the dishes rather than in their own panel because they're
 * the same question asked twice — "what are we serving" and "how much of it".
 */
export default function MenuManager({
  weddingId,
  menu,
  counts,
  loadFailed = false,
}: {
  weddingId: string;
  menu: MenuOption[];
  counts: DishCount[];
  loadFailed?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const chosenFor = new Map(counts.map((c) => [c.id, c.chosen]));
  const totalChosen = counts.reduce((s, c) => s + c.chosen, 0);

  function onAdd() {
    setMsg(null);
    start(async () => {
      const res = await addMenuOption(weddingId, name, description);
      if (!res.ok) return setMsg({ text: res.error ?? "Couldn’t add that dish.", ok: false });
      setName("");
      setDescription("");
      router.refresh();
    });
  }

  function onDelete(o: MenuOption) {
    const chosen = chosenFor.get(o.id) ?? 0;
    if (
      chosen > 0 &&
      !confirm(
        `${chosen} ${chosen === 1 ? "person has" : "people have"} chosen "${o.name}". ` +
          `Removing it keeps them on the guest list but leaves them without a dish. Remove it?`,
      )
    ) {
      return;
    }
    setMsg(null);
    start(async () => {
      const res = await deleteMenuOption(weddingId, o.id);
      if (!res.ok) setMsg({ text: res.error ?? "Couldn’t remove that dish.", ok: false });
      router.refresh();
    });
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-medium text-ink">Menu</h2>
        {totalChosen > 0 && (
          <span className="text-xs text-ink-soft/60">
            {totalChosen} {totalChosen === 1 ? "dish" : "dishes"} chosen so far
          </span>
        )}
      </div>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft/75">
        Add what you&rsquo;re serving and each guest picks their own when they RSVP. Leave this
        empty and they&rsquo;ll simply reply without choosing a dish.
      </p>

      {loadFailed && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          We couldn&rsquo;t load your menu just now. Please refresh.
        </p>
      )}
      {msg && !msg.ok && (
        <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {msg.text}
        </p>
      )}

      {menu.length > 0 && (
        <ul className="mt-4 divide-y divide-stone-2/60 border-y border-stone-2/60">
          {menu.map((o) => {
            const chosen = chosenFor.get(o.id) ?? 0;
            return (
              <li key={o.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{o.name}</p>
                  {o.description && (
                    <p className="truncate text-xs text-ink-soft/60">{o.description}</p>
                  )}
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium tabular-nums ${
                    chosen > 0 ? "bg-brand/10 text-brand-text" : "bg-stone-4 text-ink-soft/60"
                  }`}
                >
                  {chosen} chosen
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(o)}
                  disabled={busy}
                  aria-label={`Remove ${o.name}`}
                  className="px-1 text-lg leading-none text-ink-soft/40 hover:text-red-600 disabled:opacity-50"
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dish name"
          className="rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description (optional)"
          className="rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !name.trim()}
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Add dish
        </button>
      </div>
    </div>
  );
}
