"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js, which is what makes the site installable as a PWA.
 *
 * Registration is skipped in development so an old worker can't serve stale
 * bundles over `next dev`.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Service worker registration failed:", error);
      });
    };

    // Wait for load so registration never competes with the initial render.
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
      return () => window.removeEventListener("load", register);
    }
  }, []);

  return null;
}
