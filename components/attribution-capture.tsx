"use client";

import { useEffect } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Records which ad or link brought this visitor here, once per session.
 *
 * Mounted in the root layout rather than on the landing pages, because the
 * campaign can point at any URL and the parameters are only present on the
 * first page load. Renders nothing and never blocks — see lib/attribution.ts
 * for what is stored and why it is not a tracker.
 *
 * Most marketing routes are statically prerendered, which is fine: this is a
 * client component, so the effect runs in the browser on every page whatever
 * the rendering mode.
 */
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  return null;
}
