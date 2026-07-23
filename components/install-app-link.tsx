"use client";

import { useEffect, useState } from "react";
import { INSTALL_EVENT } from "@/components/install-app";

/**
 * A persistent "Install app" link for the footer — a fallback for visitors who
 * dismissed the install banner. Clicking it re-opens the banner (and fires the
 * native prompt on Android). Only shown on mobile and when the app isn't
 * already installed, so it stays in step with the banner.
 */
export default function InstallAppLink({ className }: { className?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (!standalone && isMobile) setShow(true);
  }, []);

  if (!show) return null;

  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(INSTALL_EVENT))}
      className={className}
    >
      Install app
    </button>
  );
}
