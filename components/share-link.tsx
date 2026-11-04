"use client";

import { useState } from "react";

/**
 * "Share these results": the phone's share sheet where there is one,
 * otherwise copies the page's current URL (which carries the tool's inputs,
 * see lib/tool-share.ts).
 */
export default function ShareLink({ title, text, label = "Share these results" }: { title: string; text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Dismissed share sheet or blocked clipboard: the URL in the address bar still works.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="inline-flex items-center gap-2 rounded-full border border-stone-2 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-brand"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        className="h-4 w-4" aria-hidden="true">
        <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      {copied ? "Link copied" : label}
    </button>
  );
}
