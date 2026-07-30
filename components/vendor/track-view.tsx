"use client";

import { useEffect, useRef } from "react";

/**
 * Fires a single profile-view event when a visitor lands on a vendor's public
 * page. Client-side (on mount) so server prefetches/bots don't inflate it.
 */
export default function TrackView({ orgId }: { orgId: string }) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current || !orgId) return;
    sent.current = true;
    fetch("/api/vendor/track", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ org: orgId, kind: "view" }),
      keepalive: true,
    }).catch(() => {});
  }, [orgId]);
  return null;
}
