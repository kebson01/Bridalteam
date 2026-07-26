"use client";

import { useEffect, useState } from "react";
import { INSTALL_EVENT } from "@/components/install-app";

/**
 * Homepage "get the app" band. Bridal Team is an installable PWA, so this makes
 * that visible: on mobile it opens the install flow (reusing the existing
 * banner via INSTALL_EVENT); on desktop it points people to their phone. Hidden
 * when already running as the installed app.
 */
export default function GetTheApp() {
  const [isMobile, setIsMobile] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    setStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true,
    );
  }, []);

  if (standalone) return null;

  return (
    <section className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-10 px-5 py-16 md:flex-row md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <p className="font-display text-xs font-semibold tracking-[0.28em] text-brand">NO APP STORE NEEDED</p>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-wide text-balance sm:text-4xl">
            Plan from your pocket
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70 md:mx-0">
            Install Bridal Team on your phone for one-tap access to your timeline, budget, community
            and RSVPs. It installs straight from your browser and works even when you're offline.
          </p>
          {isMobile ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(INSTALL_EVENT))}
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(243,103,5,0.8)] transition-transform hover:-translate-y-0.5"
            >
              Install the app
            </button>
          ) : (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm text-white/70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
              Open bridalteam.com on your phone to install
            </p>
          )}
        </div>

        <div className="flex-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="Bridal Team app icon"
            width={112}
            height={112}
            className="h-28 w-28 rounded-[28px] shadow-2xl shadow-black/40 ring-1 ring-white/10"
          />
        </div>
      </div>
    </section>
  );
}
