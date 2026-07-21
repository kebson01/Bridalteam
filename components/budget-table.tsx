"use client";

import { useState, useTransition } from "react";
import { updateBudgetItem, addBudgetItem, deleteBudgetItem } from "@/app/w/[id]/budget/actions";

export interface BudgetItem {
  id: string;
  category: string;
  label: string;
  estimated_cents: number;
  paid_cents: number;
  overlooked: boolean;
}

const dollars = (cents: number) => (cents / 100).toFixed(2);
const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    cents / 100,
  );

function AmountInput({
  defaultCents,
  onCommit,
  disabled,
}: {
  defaultCents: number;
  onCommit: (dollars: number) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(defaultCents ? dollars(defaultCents) : "");
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-soft/50">$</span>
      <input
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={() => onCommit(parseFloat(value) || 0)}
        placeholder="0"
        className="w-28 rounded-lg border border-stone-2 bg-white py-2 pl-6 pr-2 text-right text-sm text-ink outline-none focus:border-brand disabled:opacity-50"
      />
    </div>
  );
}

export default function BudgetTable({
  items,
  weddingId,
  categoryOrder,
}: {
  items: BudgetItem[];
  weddingId: string;
  categoryOrder: string[];
}) {
  const [pending, startTransition] = useTransition();

  // Group by category, ordered by the template's order with any extras appended.
  const byCategory = new Map<string, BudgetItem[]>();
  for (const it of items) {
    const list = byCategory.get(it.category) ?? [];
    list.push(it);
    byCategory.set(it.category, list);
  }
  const categories = [
    ...categoryOrder.filter((c) => byCategory.has(c)),
    ...[...byCategory.keys()].filter((c) => !categoryOrder.includes(c)),
  ];

  const [addCat, setAddCat] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addAmount, setAddAmount] = useState("");

  function commit(id: string, estimated: number, paid: number) {
    startTransition(() => updateBudgetItem(id, weddingId, estimated, paid));
  }
  function remove(id: string) {
    startTransition(() => deleteBudgetItem(id, weddingId));
  }
  function add() {
    const cat = (addCat || "Other").trim();
    const label = addLabel.trim();
    if (!label) return;
    startTransition(() => addBudgetItem(weddingId, cat, label, parseFloat(addAmount) || 0));
    setAddLabel("");
    setAddAmount("");
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => {
        const rows = byCategory.get(category)!;
        const catEst = rows.reduce((s, r) => s + r.estimated_cents, 0);
        const catPaid = rows.reduce((s, r) => s + r.paid_cents, 0);
        const overlooked = category === "Often forgotten";

        return (
          <section key={category} className="rounded-2xl border border-stone-2 bg-white shadow-card">
            <header className="flex items-baseline justify-between border-b border-stone-2 px-5 py-3">
              <h2 className={`text-sm font-semibold uppercase tracking-wide ${overlooked ? "text-brand-dark" : "text-ink"}`}>
                {category}
                {overlooked && (
                  <span className="ml-2 normal-case tracking-normal text-xs font-normal text-ink-soft/60">
                    — costs people forget
                  </span>
                )}
              </h2>
              <span className="text-xs text-ink-soft/60">
                {money(catPaid)} / {money(catEst)}
              </span>
            </header>

            <div className="divide-y divide-stone-2/60">
              {/* column labels */}
              <div className="hidden px-5 py-2 text-xs font-medium uppercase tracking-wider text-ink-soft/40 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4">
                <span>Item</span>
                <span className="w-28 text-right">Estimated</span>
                <span className="w-28 text-right">Paid</span>
                <span className="w-6" />
              </div>

              {rows.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 px-5 py-3 sm:grid-cols-[1fr_auto_auto_auto]"
                >
                  <span className="text-sm text-ink">{item.label}</span>
                  <AmountInput
                    defaultCents={item.estimated_cents}
                    disabled={pending}
                    onCommit={(v) => commit(item.id, v, item.paid_cents / 100)}
                  />
                  <AmountInput
                    defaultCents={item.paid_cents}
                    disabled={pending}
                    onCommit={(v) => commit(item.id, item.estimated_cents / 100, v)}
                  />
                  <button
                    type="button"
                    onClick={() => remove(item.id)}
                    disabled={pending}
                    aria-label={`Remove ${item.label}`}
                    className="justify-self-end text-ink-soft/30 transition-colors hover:text-red-600 disabled:opacity-30"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Add a line */}
      <div className="rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-4">
        <p className="mb-3 text-sm font-medium text-ink-soft">Add a line item</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={addCat}
            onChange={(e) => setAddCat(e.target.value)}
            placeholder="Category (e.g. Décor)"
            className="rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand sm:w-48"
          />
          <input
            value={addLabel}
            onChange={(e) => setAddLabel(e.target.value)}
            placeholder="Item name"
            className="flex-1 rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand"
          />
          <input
            value={addAmount}
            onChange={(e) => setAddAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            inputMode="decimal"
            placeholder="$ estimated"
            className="rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand sm:w-32"
          />
          <button
            type="button"
            onClick={add}
            disabled={pending}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
