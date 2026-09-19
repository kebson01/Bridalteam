"use client";

import { useEffect, useState } from "react";
import {
  CONSENT_EVENT,
  GA_MEASUREMENT_ID,
  analyticsConfigured,
  readConsent,
  writeConsent,
  type Consent,
} from "@/lib/analytics";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Injects the gtag script. Guarded by its own id because consent can be
 * granted, withdrawn and granted again within a single page view, and loading
 * gtag twice double-counts every event from then on.
 */
function loadGa(id: string): void {
  if (document.getElementById("ga-src")) return;

  const tag = document.createElement("script");
  tag.id = "ga-src";
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?${new URLSearchParams({ id })}`;
  document.head.appendChild(tag);

  window.dataLayer = window.dataLayer ?? [];
  // gtag.js reads the `arguments` object itself, which is why the documented
  // snippet uses a plain function rather than an arrow and why this pushes
  // `arguments` and not the rest array. The rest signature exists only so
  // TypeScript accepts the calls below; it is deliberately unused.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  }
  gtag("js", new Date());
  // No anonymize_ip: that was a Universal Analytics parameter. GA4 truncates
  // IPs on collection unconditionally and ignores the flag, so passing it
  // would only suggest a control that isn't there.
  gtag("config", id);
}

/**
 * Loads Google Analytics, but only once someone has said yes.
 *
 * Client navigations are covered by GA4's enhanced measurement, which listens
 * for History API changes and is on by default in a new property. If page
 * views ever stop appearing for anything but the entry page, that setting in
 * the GA console is the first place to look — not this file.
 *
 * See lib/analytics.ts for why consent is a hard gate rather than Consent Mode.
 */
export default function Analytics() {
  const [consent, setConsent] = useState<Consent | null>(null);

  useEffect(() => {
    if (!analyticsConfigured()) return;
    setConsent(readConsent());
    const onChange = (e: Event) => setConsent((e as CustomEvent).detail ?? null);
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  useEffect(() => {
    if (consent === "granted" && analyticsConfigured()) loadGa(GA_MEASUREMENT_ID);
  }, [consent]);

  return null;
}

/** Exported for the banner to record a decision without importing storage directly. */
export { writeConsent };
