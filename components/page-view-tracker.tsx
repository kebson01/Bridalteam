"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, excludeAdminBrowserByDefault } from "@/lib/events";
import { readAttribution, readReferrer } from "@/lib/attribution";

/**
 * Counts page views and how long each page was on screen. First-party, with no
 * cookie and no identifier beyond the random per-visit id lib/events.ts adds.
 *
 * Mounted in the root layout *after* <AttributionCapture />, which matters:
 * React runs effects in child order, so the UTM values are in place before the
 * first view is reported and a campaign's landing page is attributed rather
 * than showing up as direct.
 *
 * Most marketing routes are statically prerendered. That is fine: this is a
 * client component, so the effect runs in the browser whatever the rendering
 * mode, which is the same reason AttributionCapture lives here.
 *
 * Time on page counts only visible time. When the tab is hidden or closed, or
 * the visitor navigates, the time so far is sent as a page_leave and the clock
 * resets; coming back to the tab starts it again. Several page_leave rows for
 * one view simply add up, which is what the dashboard sums.
 *
 * /admin is never counted, and opening it marks this browser as the owner's
 * so their own browsing of the site isn't counted either (undo it on
 * /admin/analytics).
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  // App Router re-runs effects on changes that are not navigations (a search
  // param edit, a refresh of the segment). Without this, one page could report
  // several views and quietly inflate the top of the funnel.
  const lastPath = useRef<string | null>(null);
  const visibleSince = useRef<number | null>(null);
  const accumulated = useRef(0);

  // Sends the on-screen time for the current page, if any, and resets the clock.
  const flush = useRef(() => {
    const path = lastPath.current;
    if (!path) return;
    const now = Date.now();
    const ms = accumulated.current + (visibleSince.current !== null ? now - visibleSince.current : 0);
    accumulated.current = 0;
    visibleSince.current = document.visibilityState === "visible" ? now : null;
    if (ms >= 500 && !path.startsWith("/admin")) track("page_leave", path, undefined, ms);
  });

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;

    flush.current(); // close out the previous page
    lastPath.current = pathname;
    accumulated.current = 0;
    visibleSince.current = document.visibilityState === "visible" ? Date.now() : null;

    if (pathname.startsWith("/admin")) {
      excludeAdminBrowserByDefault();
      return;
    }

    const attribution = readAttribution();
    // Tagged links first, then the referring site for untagged arrivals (an
    // organic search result, a link someone shared) so those aren't "(none)".
    const source = attribution?.utm_source ?? attribution?.referrer_host ?? readReferrer();
    track("page_view", pathname, source);
  }, [pathname]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush.current();
        visibleSince.current = null;
      } else if (visibleSince.current === null) {
        visibleSince.current = Date.now();
      }
    };
    const onPageHide = () => flush.current();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  return null;
}
