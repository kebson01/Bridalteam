"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  analyticsConfigured,
  readConsent,
  writeConsent,
} from "@/lib/analytics";

/**
 * The cookie consent banner.
 *
 * Shown only when analytics is actually configured and no decision is on
 * record. Two things about it are deliberate and should survive any redesign:
 *
 *   1. "Decline" is a real button, styled as a peer of "Accept" rather than a
 *      grey afterthought. A banner whose only affordance is acceptance isn't
 *      consent, and the privacy page now points at this as the opt-out.
 *   2. Dismissing is not a third option. There is no × — closing without
 *      choosing would leave the decision unrecorded, and the tracker off, but
 *      it would also re-prompt on every page load, which pressures people into
 *      clicking Accept to make it stop.
 *
 * It renders nothing during the first paint (consent is read in an effect,
 * because localStorage does not exist on the server) which also avoids a
 * hydration mismatch on the statically prerendered marketing pages.
 */
export default function ConsentBanner() {
  const [decided, setDecided] = useState<boolean | null>(null);

  useEffect(() => {
    if (!analyticsConfigured()) return;
    setDecided(readConsent() !== null);
    const onChange = (e: Event) => setDecided((e as CustomEvent).detail != null);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (decided !== false) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie choices"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-2 bg-white/95 px-5 py-4 shadow-card backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-ink-soft">
          We&rsquo;d like to use Google Analytics to understand how people find and
          use Bridal Team. It sets cookies. Everything the site needs to work
          keeps running either way.{" "}
          <Link href="/privacy" className="font-semibold text-brand-text underline">
            How we handle your data
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => writeConsent("denied")}
            className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => writeConsent("granted")}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
