"use client";

import { useId, useState } from "react";
import { tablePlan, COMMON_TABLE_SIZES } from "@/lib/seating-calculator";

const INPUT =
  "mt-1 w-full rounded-xl border border-stone-2 bg-white px-4 py-3 text-lg text-ink outline-none focus:border-brand";

const num = (raw: string) => Number.parseInt(raw.replace(/[^0-9]/g, ""), 10);
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * The interactive part of /wedding-seating-chart: how many tables a guest
 * count needs. Runs in the browser; nothing typed here is sent anywhere.
 */
export default function TableCalculator() {
  const id = useId();
  const [rawGuests, setRawGuests] = useState("100");
  const [rawSize, setRawSize] = useState("8");
  const [rawHead, setRawHead] = useState("0");

  const guests = num(rawGuests);
  const size = num(rawSize);
  const head = num(rawHead);
  const plan = guests > 0 ? tablePlan(guests, size, head) : null;

  return (
    <div className="rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <label htmlFor={`${id}-guests`} className="block">
          <span className="text-sm font-medium text-ink-soft">Guests</span>
          <input
            id={`${id}-guests`}
            inputMode="numeric"
            autoComplete="off"
            value={rawGuests}
            onChange={(e) => setRawGuests(e.target.value)}
            className={INPUT}
          />
        </label>
        <label htmlFor={`${id}-size`} className="block">
          <span className="text-sm font-medium text-ink-soft">Seats per table</span>
          <input
            id={`${id}-size`}
            inputMode="numeric"
            autoComplete="off"
            value={rawSize}
            onChange={(e) => setRawSize(e.target.value)}
            className={INPUT}
          />
        </label>
        <label htmlFor={`${id}-head`} className="block">
          <span className="text-sm font-medium text-ink-soft">At a head table</span>
          <input
            id={`${id}-head`}
            inputMode="numeric"
            autoComplete="off"
            value={rawHead}
            onChange={(e) => setRawHead(e.target.value)}
            className={INPUT}
          />
        </label>
      </div>

      {!plan ? (
        <p className="mt-6 text-sm text-ink-soft/70" role="status">
          Enter a guest count and the number of seats at each table.
        </p>
      ) : (
        <div aria-live="polite">
          <div className="mt-6 rounded-2xl bg-brand-soft px-5 py-5 text-center">
            <p className="font-display text-5xl font-semibold text-ink">{plan.tables}</p>
            <p className="mt-1 text-sm text-ink-soft">
              {plan.tables === 1 ? "guest table" : "guest tables"}
              {head > 0 && " plus your head table"}
            </p>
          </div>
          <p className="mt-4 text-center text-sm leading-relaxed text-ink-soft/80">
            {plan.seated === 0
              ? "Everyone fits at the head table."
              : plan.lastTable === 0
                ? `Every table is full: ${plural(plan.seated, "guest")} at ${plural(plan.tables, "table")} of ${size}.`
                : `${plural(plan.fullTables, "full table")} of ${size}, and one table of ${plan.lastTable}. That leaves ${plural(plan.emptySeats, "empty seat")}.`}
          </p>

          {plan.seated > 0 && (
            <table className="mt-6 w-full text-sm">
              <caption className="pb-2 text-left text-xs uppercase tracking-wide text-ink-soft/50">
                The same guests at other table sizes
              </caption>
              <thead className="border-b border-stone-2 text-left text-xs uppercase tracking-wide text-ink-soft/50">
                <tr>
                  <th scope="col" className="py-2">Seats per table</th>
                  <th scope="col" className="py-2 text-right">Tables</th>
                  <th scope="col" className="py-2 pl-4 text-right">Empty seats</th>
                </tr>
              </thead>
              <tbody>
                {COMMON_TABLE_SIZES.map((s) => {
                  const p = tablePlan(guests, s, head)!;
                  return (
                    <tr key={s} className={`border-b border-stone-2/60 ${s === size ? "font-semibold text-ink" : "text-ink-soft/80"}`}>
                      <th scope="row" className={`py-2 text-left ${s === size ? "" : "font-normal"}`}>{s}</th>
                      <td className="py-2 text-right">{p.tables}</td>
                      <td className="py-2 pl-4 text-right">{p.emptySeats}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
