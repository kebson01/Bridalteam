"use client";

import { useEffect, useState } from "react";
import { readConsent } from "@/lib/consent";

/** Fires when the banner records a decision, so GA can start without a reload. */
export const CONSENT_EVENT = "bt:consent";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Loads Google Analytics, and only after an explicit yes.
 *
 * ── Why the script is injected rather than rendered ─────────────────────────
 * The decision lives in localStorage, which cannot be read during a server
 * render or during hydration without producing markup the server never
 * generated. Rendering a <script> conditionally from client state would either
 * mismatch or load GA for a frame before consent is known. Injecting it from
 * an effect, after the decision is read, has neither problem.
 *
 * ── Consent Mode ────────────────────────────────────────────────────────────
 * Google's own advice is to load gtag always and set consent flags to
 * "denied". This does the stricter thing: with no consent, gtag is never
 * fetched at all, so there is no third-party request, no cookie, and nothing
 * to configure wrongly. The cost is that Google's "consent mode" modelled
 * conversions do not apply — a real trade, and the right side of it for a site
 * whose privacy page has always said no trackers.
 *
 * With NEXT_PUBLIC_GA_MEASUREMENT_ID unset — every preview and local build —
 * this renders nothing and the banner never appears, so a staging deploy
 * cannot pollute the production property.
 */
export default function Analytics() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!GA_ID) return;
    const sync = () => setAllowed(readConsent() === "granted");
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  useEffect(() => {
    if (!GA_ID || !allowed) return;
    // Guard against a second injection if this remounts.
    if (document.getElementById("ga-src")) return;

    const tag = document.createElement("script");
    tag.id = "ga-src";
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(tag);

    const init = document.createElement("script");
    init.id = "ga-init";
    init.textContent = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${GA_ID}');
    `;
    document.head.appendChild(init);

    // Deliberately no cleanup that removes these. Once gtag has run, pulling
    // the tags out of the DOM does not unload it, and a "cleanup" that only
    // looks like it works is worse than none. Withdrawing consent reloads the
    // page instead — see the privacy page control.
  }, [allowed]);

  return null;
}
