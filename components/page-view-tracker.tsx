"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/events";
import { readAttribution } from "@/lib/attribution";

/**
 * Counts page views, first-party and without an identifier of any kind.
 *
 * Mounted in the root layout *after* <AttributionCapture />, which matters:
 * React runs effects in child order, so the UTM values are in place before the
 * first view is reported and a campaign's landing page is attributed rather
 * than showing up as direct.
 *
 * Most marketing routes are statically prerendered. That is fine — this is a
 * client component, so the effect runs in the browser whatever the rendering
 * mode, which is the same reason AttributionCapture lives here.
 */
export default function PageViewTracker() {
  const pathname = usePathname();
  // App Router re-runs effects on changes that are not navigations (a search
  // param edit, a refresh of the segment). Without this, one page could report
  // several views and quietly inflate the top of the funnel — the number most
  // likely to be believed.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastPath.current === pathname) return;
    lastPath.current = pathname;

    const attribution = readAttribution();
    const source = attribution?.utm_source ?? attribution?.referrer_host ?? undefined;
    track("page_view", pathname, source);
  }, [pathname]);

  return null;
}
