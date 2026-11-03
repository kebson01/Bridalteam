"use client";

import { useState } from "react";

/** A read-only value with a Copy button, e.g. a connector URL. */
export default function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text is selectable, so it can still be copied by hand.
    }
  }
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft/60">{label}</p>
      <div className="mt-1.5 flex items-center gap-2 rounded-2xl border border-stone-2 bg-white p-1.5 pl-4">
        <code className="min-w-0 flex-1 select-all break-all text-sm text-ink">{value}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? "Copied" : `Copy ${label}`}
          className="shrink-0 rounded-full bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-xs font-semibold text-white"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
