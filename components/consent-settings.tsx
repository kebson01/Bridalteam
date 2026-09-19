"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  analyticsConfigured,
  readConsent,
  resetConsent,
  type Consent,
} from "@/lib/analytics";

const LABEL: Record<Consent, string> = {
  granted: "You currently allow analytics cookies.",
  denied: "You currently decline analytics cookies.",
};

/**
 * The working half of the opt-out promised in §6 of the privacy page.
 *
 * Lives on /privacy rather than in the footer because that is where the policy
 * sends people, and a claim in a privacy policy that has no control behind it
 * is the kind of thing regulators treat as the misrepresentation, separately
 * from whatever the tracking itself does.
 *
 * Renders nothing when analytics isn't configured — there would be no cookies
 * to manage and no banner to bring back.
 */
export default function ConsentSettings() {
  const [consent, setConsent] = useState<Consent | null>(null);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (!analyticsConfigured()) return;
    setConfigured(true);
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent).detail ?? null);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!configured) return null;

  return (
    <div className="mt-4 rounded-2xl border border-stone-2 bg-stone-4 px-5 py-4">
      <p className="text-sm text-ink-soft">
        {consent ? LABEL[consent] : "You haven’t made a choice yet."}
      </p>
      <button
        type="button"
        onClick={resetConsent}
        className="mt-3 rounded-full border border-stone-2 bg-white px-5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
      >
        Change my choice
      </button>
    </div>
  );
}
