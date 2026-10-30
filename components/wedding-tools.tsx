"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { saveEnabledTools } from "@/app/w/[id]/tools/actions";
import { TOOL_CATEGORIES, WEDDING_TOOLS, type ToolCategory } from "@/lib/wedding-tools";

/**
 * Per tool key, worked out on the server: a one-line summary, and whether the
 * tool is still empty (its card then leads with the first thing to do).
 */
export type ToolStats = Partial<Record<string, { line: string; empty?: boolean }>>;

/**
 * The couple's pinned tools, and the marketplace to add or remove more.
 *
 * Changes save straight away (optimistically) — there's no separate "save"
 * step to forget. If the write is refused (a viewer without edit rights, or a
 * network failure) the previous selection comes back with a message.
 */
export default function WeddingTools({
  weddingId,
  initialEnabled,
  stats,
}: {
  weddingId: string;
  initialEnabled: string[];
  stats: ToolStats;
}) {
  const [enabled, setEnabled] = useState<string[]>(initialEnabled);
  const [browsing, setBrowsing] = useState(false);
  const [filter, setFilter] = useState<ToolCategory | "all">("all");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const on = new Set(enabled);
  const pinned = WEDDING_TOOLS.filter((t) => on.has(t.key));
  const shown = WEDDING_TOOLS.filter((t) => filter === "all" || t.category === filter);

  function save(next: string[]) {
    const previous = enabled;
    setEnabled(next);
    setError(null);
    startTransition(async () => {
      const res = await saveEnabledTools(weddingId, next);
      if (!res.ok) {
        setEnabled(previous);
        setError(res.error ?? "Couldn't save your tools.");
      } else if (res.tools) {
        setEnabled(res.tools);
      }
    });
  }

  const toggle = (key: string) =>
    save(on.has(key) ? enabled.filter((k) => k !== key) : [...enabled, key]);

  return (
    <section id="tools" className="mt-10 scroll-mt-24 rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Your wedding tools{" "}
            <span className="ml-1 align-middle rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-semibold text-brand-text">
              {pinned.length} of {WEDDING_TOOLS.length}
            </span>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-ink-soft/70">
            Pick only what you need. Add tools from the marketplace and they show
            up here and in your menu — remove them any time, nothing you&rsquo;ve
            entered is lost.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setBrowsing((b) => !b)}
          aria-expanded={browsing}
          aria-controls="tool-marketplace"
          className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
            browsing
              ? "border border-stone-2 text-ink-soft hover:border-brand hover:text-brand-text"
              : "bg-brand-wash text-brand-text hover:bg-brand/15"
          }`}
        >
          {browsing ? "Done" : "+ Browse tool marketplace"}
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* Marketplace */}
      {browsing && (
        <div id="tool-marketplace" className="mt-6 rounded-2xl bg-brand-soft p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b34a04]">
              Tool marketplace
            </p>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Filter tools">
              {[{ key: "all" as const, label: "All" }, ...TOOL_CATEGORIES].map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setFilter(c.key)}
                  aria-pressed={filter === c.key}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    filter === c.key ? "bg-white text-brand-text shadow-sm" : "text-ink-soft hover:text-brand-text"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((t) => {
              const added = on.has(t.key);
              return (
                <li key={t.key} className="flex flex-col rounded-2xl border border-stone-2 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <span aria-hidden className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-stone-4 text-lg">
                      {t.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{t.name}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-ink-soft/70">{t.blurb}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    {t.core ? (
                      <span className="block rounded-full bg-stone-4 py-1.5 text-center text-xs font-semibold text-ink-soft/60">
                        Always included
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggle(t.key)}
                        disabled={pending}
                        aria-pressed={added}
                        className={`w-full rounded-full py-1.5 text-xs font-semibold transition-colors disabled:opacity-60 ${
                          added
                            ? "border border-brand/40 bg-brand/10 text-brand-text hover:bg-brand/15"
                            : "bg-gradient-to-r from-brand to-brand-dark text-white hover:opacity-90"
                        }`}
                      >
                        {added ? "✓ Added — remove" : `+ Add ${t.nav}`}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              disabled={pending}
              onClick={() => save(WEDDING_TOOLS.map((t) => t.key))}
              className="font-semibold text-brand-text hover:underline disabled:opacity-60"
            >
              Add everything
            </button>
            <span className="text-ink-soft/40">·</span>
            <button
              type="button"
              disabled={pending}
              onClick={() => save([])}
              className="font-semibold text-ink-soft/70 hover:underline disabled:opacity-60"
            >
              Keep only the essentials
            </button>
          </div>
        </div>
      )}

      {/* Pinned tools */}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {pinned.map((t) => {
          const stat = stats[t.key];
          const empty = stat?.empty ?? false;
          return (
            <li
              key={t.key}
              className="group relative flex flex-col rounded-2xl border border-stone-2 bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-2">
                <span aria-hidden className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-wash text-xl">
                  {t.icon}
                </span>
                {!t.core && (
                  <button
                    type="button"
                    onClick={() => toggle(t.key)}
                    disabled={pending}
                    aria-label={`Remove ${t.name} from your dashboard`}
                    title="Remove from dashboard"
                    className="relative z-10 rounded-full px-2 py-0.5 text-xs text-ink-soft/50 opacity-100 transition hover:bg-stone-4 hover:text-brand-text sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                  >
                    ✕
                  </button>
                )}
              </div>
              <h3 className="mt-3 font-medium text-ink">{t.name}</h3>
              {stat && (
                <p className={`mt-1 text-sm font-semibold ${empty ? "text-ink-soft/50" : "text-brand-text"}`}>
                  {stat.line}
                </p>
              )}
              <p className="mt-1 text-xs leading-relaxed text-ink-soft/60">{t.blurb}</p>
              {/* The whole card is the link; the visible button is the label. */}
              <div className="mt-auto pt-4">
              <Link
                href={t.path(weddingId)}
                className={`block rounded-full py-2 text-center text-xs font-semibold transition-colors after:absolute after:inset-0 after:rounded-2xl after:content-[''] ${
                  empty
                    ? "bg-gradient-to-r from-brand to-brand-dark text-white"
                    : "border border-stone-2 text-ink group-hover:border-brand group-hover:text-brand-text"
                }`}
              >
                {empty ? `${t.start} →` : `Open ${t.nav}`}
              </Link>
              </div>
            </li>
          );
        })}
        <li>
          <button
            type="button"
            onClick={() => setBrowsing(true)}
            className="flex h-full min-h-40 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-stone-5 p-5 text-sm font-semibold text-ink-soft/60 transition-colors hover:border-brand hover:text-brand-text"
          >
            <span aria-hidden className="text-2xl">+</span>
            Add a tool
            <span className="mt-1 text-xs font-normal">
              {WEDDING_TOOLS.length - pinned.length} more in the marketplace
            </span>
          </button>
        </li>
      </ul>
    </section>
  );
}
