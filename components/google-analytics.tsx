"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { trackingDisabled } from "@/lib/events";
import { GOOGLE_TAG_ID, googleTagScriptUrl, isTagManagerId } from "@/lib/google-analytics";

/**
 * Google Analytics via the Google tag, alongside (not instead of) the
 * first-party counting in <PageViewTracker />.
 *
 * Renders nothing unless NEXT_PUBLIC_GOOGLE_TAG_ID is set, so local dev,
 * previews and tests stay untracked. It is read at build time, so setting it
 * needs a redeploy. See lib/google-analytics.ts for the GTM- vs G- ids.
 *
 * It honours the same owner opt-out as the first-party tracker: a browser that
 * has opened /admin (lib/events.ts `bt_no_track`) never loads the tag, and
 * neither does any /admin page itself. The check runs in an effect because
 * localStorage only exists in the browser and most routes are prerendered.
 *
 * Page views: GA4's enhanced measurement counts App Router navigations on its
 * own (they are History API changes), so no manual page_view is sent here —
 * sending one would double count.
 *
 * Privacy settings: with a G- id, Google signals and ad personalisation are
 * switched off below. With a GTM- container those live in the GA4 / GTM
 * dashboards instead — turn them off there.
 */
export default function GoogleAnalytics() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (!GOOGLE_TAG_ID || enabled) return;
    if (pathname?.startsWith("/admin") || trackingDisabled()) return;
    setEnabled(true);
  }, [pathname, enabled]);

  // Once loaded, the tag stays on the page across client navigations. If the
  // visitor then lands on /admin, switch GA off so admin screens aren't sent.
  // GA honours `ga-disable-<G- id>`; for a container we only learn the G- ids
  // it runs once it has loaded them, from window.google_tag_manager.
  useEffect(() => {
    if (!GOOGLE_TAG_ID || !enabled) return;
    const off = !!pathname?.startsWith("/admin") || trackingDisabled();
    const w = window as unknown as Record<string, unknown>;
    const loaded = Object.keys((w.google_tag_manager as object | undefined) ?? {});
    const ids = new Set([GOOGLE_TAG_ID, ...loaded].filter((k) => k.startsWith("G-")));
    for (const id of ids) w[`ga-disable-${id}`] = off;
  }, [pathname, enabled]);

  if (!GOOGLE_TAG_ID || !enabled) return null;

  const init = isTagManagerId(GOOGLE_TAG_ID)
    ? `gtag('js', new Date());`
    : `gtag('js', new Date());
gtag('config', ${JSON.stringify(GOOGLE_TAG_ID)}, {
  allow_google_signals: false,
  allow_ad_personalization_signals: false
});`;

  return (
    <>
      {/* The dataLayer must exist before the loader runs; next/script keeps
          afterInteractive scripts in order, so this one goes first. */}
      <Script id="google-tag-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
${init}`}
      </Script>
      <Script src={googleTagScriptUrl(GOOGLE_TAG_ID)} strategy="afterInteractive" />
    </>
  );
}
