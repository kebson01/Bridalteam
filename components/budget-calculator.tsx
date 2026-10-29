"use client";

import { useId, useState } from "react";
import { budgetBreakdown, parseAmount, perGuest, OFTEN_FORGOTTEN } from "@/lib/budget-calculator";

const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const pct = (p: number) => `${Math.round(p * 100)}%`;

const INPUT =
  "mt-1 w-full rounded-xl border border-stone-2 bg-white px-4 py-3 text-lg text-ink outline-none focus:border-brand";

/**
 * The interactive part of /wedding-budget-calculator. Everything runs in the
 * browser; nothing typed here is sent anywhere.
 */
export default function BudgetCalculator() {
  const id = useId();
  const [rawTotal, setRawTotal] = useState("30,000");
  const [rawGuests, setRawGuests] = useState("100");

  const total = parseAmount(rawTotal);
  const guests = Number.parseInt(rawGuests.replace(/[^0-9]/g, ""), 10);
  const result = budgetBreakdown(total);
  const each = perGuest(total, guests);

  return (
    <div className="rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label htmlFor={`${id}-total`} className="block">
          <span className="text-sm font-medium text-ink-soft">Total budget</span>
          <input
            id={`${id}-total`}
            inputMode="decimal"
            autoComplete="off"
            value={rawTotal}
            onChange={(e) => setRawTotal(e.target.value)}
            className={INPUT}
          />
        </label>
        <label htmlFor={`${id}-guests`} className="block">
          <span className="text-sm font-medium text-ink-soft">Guests (optional)</span>
          <input
            id={`${id}-guests`}
            inputMode="numeric"
            autoComplete="off"
            value={rawGuests}
            onChange={(e) => setRawGuests(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>

      {total === 0 ? (
        <p className="mt-6 text-sm text-ink-soft/70" role="status">
          Enter a total, like 30000 or 30k, to see the breakdown.
        </p>
      ) : (
        <div aria-live="polite">
          {each !== null && (
            <p className="mt-6 rounded-2xl bg-brand-soft px-5 py-4 text-sm text-ink">
              That&rsquo;s about <strong>{money(each)} per guest</strong>. Catering, bar, rentals and
              stationery all scale with the guest count, so it&rsquo;s the biggest lever you have.
            </p>
          )}

          <table className="mt-6 w-full text-sm">
            <caption className="sr-only">Starter budget for {money(total)}</caption>
            <thead className="border-b border-stone-2 text-left text-xs uppercase tracking-wide text-ink-soft/50">
              <tr>
                <th scope="col" className="py-2">Category</th>
                <th scope="col" className="py-2 text-right">Share</th>
                <th scope="col" className="py-2 pl-4 text-right">Amount</th>
              </tr>
            </thead>
            {result.categories.map((c) => (
              <tbody key={c.category} className="border-b border-stone-2/60">
                <tr>
                  <th scope="row" className="pt-3 text-left font-medium text-ink">{c.category}</th>
                  <td className="pt-3 text-right text-ink-soft/70">{pct(c.pct)}</td>
                  <td className="pt-3 pl-4 text-right font-semibold text-ink">{money(c.amount)}</td>
                </tr>
                {c.lines.length > 1 &&
                  c.lines.map((l) => (
                    <tr key={l.label} className="text-ink-soft/70">
                      <td className="py-0.5 pl-4">{l.label}</td>
                      <td className="py-0.5 text-right">{pct(l.pct)}</td>
                      <td className="py-0.5 pl-4 text-right">{money(l.amount)}</td>
                    </tr>
                  ))}
                <tr><td colSpan={3} className="pb-3" /></tr>
              </tbody>
            ))}
            <tbody>
              <tr>
                <th scope="row" className="pt-3 text-left font-medium text-brand-text">
                  Buffer &amp; often-forgotten costs
                </th>
                <td className="pt-3 text-right text-ink-soft/70">{pct(result.unassignedPct)}</td>
                <td className="pt-3 pl-4 text-right font-semibold text-brand-text">{money(result.unassigned)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-6 rounded-2xl border border-stone-2 p-5">
            <p className="text-sm font-medium text-ink">What the buffer is for</p>
            <p className="mt-1 text-sm text-ink-soft/80">
              These rarely make the first draft of a budget, and they add up:
            </p>
            <ul className="mt-3 grid gap-x-6 gap-y-1 text-sm text-ink-soft/80 sm:grid-cols-2">
              {OFTEN_FORGOTTEN.map((f) => (
                <li key={f} className="flex gap-2">
                  <span aria-hidden className="text-brand">•</span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
