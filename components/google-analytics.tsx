"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { trackingDisabled } from "@/lib/events";
import { GA_MEASUREMENT_ID } from "@/lib/google-analytics";

/**
 * Google Analytics 4 via gtag.js, alongside (not instead of) the first-party
 * counting in <PageViewTracker />.
 *
 * Renders nothing unless NEXT_PUBLIC_GA_MEASUREMENT_ID is set, so local dev,
 * previews and tests stay untracked. It is read at build time, so setting it
 * needs a redeploy.
 *
 * It honours the same owner opt-out as the first-party tracker: a browser that
 * has opened /admin (lib/events.ts `bt_no_track`) never loads gtag.js, and
 * neither does any /admin page itself. The check runs in an effect because
 * localStorage only exists in the browser and most routes are prerendered.
 *
 * Page views: GA4's enhanced measurement counts App Router navigations on its
 * own (they are History API changes), so no manual page_view is sent here —
 * sending one would double count. Leave "Page changes based on browser history
 * events" switched on in the GA data stream settings.
 *
 * Google signals and ad personalisation are off: this is for traffic numbers,
 * not advertising. The CSP entries it needs are in lib/csp.ts.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || enabled) return;
    if (pathname?.startsWith("/admin") || trackingDisabled()) return;
    setEnabled(true);
  }, [pathname, enabled]);

  // Once loaded, gtag stays on the page across client navigations. If the
  // visitor then lands on /admin, switch it off so admin screens aren't sent.
  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !enabled) return;
    const off = !!pathname?.startsWith("/admin") || trackingDisabled();
    (window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = off;
  }, [pathname, enabled]);

  if (!GA_MEASUREMENT_ID || !enabled) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(GA_MEASUREMENT_ID)}, {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`}
      </Script>
    </>
  );
}
