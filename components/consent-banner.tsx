"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent, type Consent } from "@/lib/consent";
import { CONSENT_EVENT } from "@/components/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Asks once whether Google Analytics may run.
 *
 * Shown only when there is something to consent to: with
 * NEXT_PUBLIC_GA_MEASUREMENT_ID unset there is no third-party tracker, so
 * asking would be theatre — a banner that grants permission for nothing.
 *
 * Both buttons carry equal weight on purpose. "Decline" is not a grey link
 * hiding under a bright "Accept"; the whole point of gating GA rather than
 * shipping it unconditionally is lost if the choice is nudged.
 *
 * It does not block the page. A modal over a wedding planner, to ask about
 * analytics, would cost more real visitors than the data is worth.
 */
export default function ConsentBanner() {
  const [decided, setDecided] = useState(true); // assume decided until read

  useEffect(() => {
    if (!GA_ID) return;
    setDecided(readConsent() !== null);
  }, []);

  function choose(value: Consent) {
    writeConsent(value);
    setDecided(true);
    // Lets <Analytics /> start immediately on "granted" rather than waiting
    // for the next navigation.
    window.dispatchEvent(new Event(CONSENT_EVENT));
  }

  if (!GA_ID || decided) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Analytics consent"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-2 bg-white/95 px-5 py-4 shadow-[0_-4px_24px_rgba(0,0,0,0.07)] backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-ink-soft/85">
          May we use Google Analytics to see how the site is used? It sets cookies and
          shares data with Google. Saying no changes nothing about how the site works
          for you.{" "}
          <Link href="/privacy" className="text-brand-text hover:underline">
            Privacy
          </Link>
        </p>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            onClick={() => choose("denied")}
            className="rounded-full border border-stone-2 px-5 py-2 text-sm font-medium text-ink hover:border-ink-soft/40"
          >
            No thanks
          </button>
          <button
            type="button"
            onClick={() => choose("granted")}
            className="rounded-full border border-stone-2 bg-ink px-5 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
