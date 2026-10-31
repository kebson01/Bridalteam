"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { FeatureTips as Tips } from "@/lib/feature-tips";

/**
 * "How it works" for one planning page: a quiet link at the end of the wedding
 * nav that opens a few short tips inline, under the nav.
 *
 * Deliberately low-key, because tips that interrupt get ignored or resented:
 *   - nothing opens by itself — no modal, tour, overlay or toast;
 *   - the panel pushes the page down instead of covering it, and closes with
 *     "Got it", the link again, or Escape;
 *   - the only nudge is a small dot on the link until someone has opened the
 *     tips for that page once (remembered per browser; if storage is
 *     unavailable there's simply no dot).
 */

const SEEN_KEY = "bt_tips_seen";

function readSeen(): Set<string> {
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : []);
  } catch {
    return new Set();
  }
}

function markSeen(page: string) {
  try {
    const seen = readSeen();
    seen.add(page);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen].slice(-50)));
  } catch {
    // Private mode or storage blocked: the dot just keeps showing.
  }
}

export default function FeatureTips({ page, tips }: { page: string; tips: Tips }) {
  const [open, setOpen] = useState(false);
  // Unknown until mounted, so the server render and first paint match (no dot).
  const [unseen, setUnseen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setUnseen(!readSeen().has(page));
  }, [page]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unseen) {
      markSeen(page);
      setUnseen(false);
    }
  }

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          open ? "bg-brand-wash text-brand-text" : "text-ink-soft/70 hover:bg-stone-4 hover:text-brand-text"
        }`}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1.1 2V16h5v-.2c.1-.8.5-1.5 1.1-2A6 6 0 0 0 12 3z" />
        </svg>
        How it works
        {unseen && (
          <span className="relative -mt-2 h-2 w-2 rounded-full bg-brand" aria-hidden="true" title="New tips" />
        )}
        {unseen && <span className="sr-only">(new tips)</span>}
      </button>

      {open && (
        <section
          id={panelId}
          aria-label={`How ${tips.title} works`}
          className="order-last mt-2 w-full basis-full rounded-2xl border border-brand/25 bg-brand-wash/70 px-5 py-4"
        >
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm font-semibold text-ink">{tips.title}: quick tips</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-none rounded-full px-2.5 py-0.5 text-xs font-semibold text-ink-soft/70 hover:bg-white hover:text-ink"
            >
              Got it
            </button>
          </div>
          <ul className="mt-2 grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {tips.items.map((t) => (
              <li key={t.title} className="flex gap-2.5 text-sm leading-relaxed">
                <span className="mt-[0.55rem] h-1.5 w-1.5 flex-none rounded-full bg-brand" aria-hidden="true" />
                <span>
                  <span className="font-semibold text-ink">{t.title}.</span>{" "}
                  <span className="text-ink-soft/85">{t.body}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
