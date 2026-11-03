"use client";

import { useState } from "react";

/**
 * Share a vendor's profile: the phone's share sheet where there is one,
 * otherwise copy the link.
 */
export default function ShareButton({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Dismissing the share sheet rejects; nothing to do.
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      aria-label={copied ? "Link copied" : `Share ${title}`}
      className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white/90 px-3 text-ink shadow-sm backdrop-blur hover:bg-white"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
        strokeLinejoin="round" className="h-[18px] w-[18px]" aria-hidden="true">
        <path d="M12 3v12M7.5 7.5 12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
      {copied && <span className="text-xs font-semibold">Copied</span>}
    </button>
  );
}
