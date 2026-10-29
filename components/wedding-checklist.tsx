"use client";

import { useEffect, useId, useState } from "react";
import { datedChecklist, parseIsoDate } from "@/lib/checklist";

// Ticks are a per-visitor convenience, so they live in this browser only.
const STORAGE_KEY = "bt_checklist_done";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/** Today as "YYYY-MM-DD" in the visitor's own time zone. */
function localToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * The interactive part of /wedding-checklist: the starter plan with real
 * dates. Nothing typed or ticked here is sent anywhere.
 */
export default function WeddingChecklist() {
  const id = useId();
  const [date, setDate] = useState("");
  // Set after mount, so the server render and the first client render agree.
  const [today, setToday] = useState("");
  const [done, setDone] = useState<Set<string>>(new Set());

  useEffect(() => {
    setToday(localToday());
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      if (Array.isArray(saved)) setDone(new Set(saved.filter((s) => typeof s === "string")));
    } catch {
      // Private mode or blocked storage: ticks just won't be remembered.
    }
  }, []);

  function toggle(title: string) {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // See above.
      }
      return next;
    });
  }

  const valid = parseIsoDate(date) !== null;
  const phases = datedChecklist(valid ? date : "", today);
  const all = phases.flatMap((p) => p.tasks);
  const overdue = all.filter((t) => t.overdue && !done.has(t.title)).length;
  const ticked = all.filter((t) => done.has(t.title)).length;

  return (
    <div className="rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
      <label htmlFor={`${id}-date`} className="block max-w-xs">
        <span className="text-sm font-medium text-ink-soft">Your wedding date</span>
        <input
          id={`${id}-date`}
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-2 bg-white px-4 py-3 text-lg text-ink outline-none focus:border-brand"
        />
      </label>

      <p className="mt-4 text-sm text-ink-soft/80" role="status">
        {!valid
          ? "Add your date to see when each task is due. Or just read the list."
          : overdue > 0
            ? `${ticked} of ${all.length} done. ${overdue} ${overdue === 1 ? "task is" : "tasks are"} already past due, so start there.`
            : `${ticked} of ${all.length} done. You're on schedule.`}
      </p>

      <div className="mt-6 space-y-8">
        {phases.map((p) => (
          <section key={p.name}>
            <h3 className="border-b border-stone-2 pb-2 font-display text-lg font-semibold text-ink">{p.name}</h3>
            <ul className="mt-3 space-y-3">
              {p.tasks.map((t) => {
                const isDone = done.has(t.title);
                return (
                  <li key={t.title}>
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => toggle(t.title)}
                        className="mt-1 h-4 w-4 flex-none accent-brand-dark"
                      />
                      <span className="min-w-0 flex-1">
                        <span className={`text-sm ${isDone ? "text-ink-soft/50 line-through" : "text-ink"}`}>
                          {t.title}
                        </span>
                        {t.due && (
                          <span
                            className={`mt-0.5 block text-xs ${
                              t.overdue && !isDone ? "font-semibold text-red-700" : "text-ink-soft/60"
                            }`}
                          >
                            {t.overdue && !isDone ? "Past due · " : "By "}
                            {fmt(t.due)}
                          </span>
                        )}
                        {t.tip && !isDone && (
                          <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft/70">{t.tip}</span>
                        )}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
