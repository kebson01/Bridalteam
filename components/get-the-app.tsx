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
    <section className="mx-auto max-w-6xl px-5 pb-16">
      <div className="flex flex-col items-center gap-8 rounded-[2rem] bg-gradient-to-br from-brand-wash to-white p-8 text-ink ring-1 ring-brand/15 sm:p-10 md:flex-row md:justify-between">
        <div className="max-w-xl text-center md:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-text">No app store needed</p>
          <h2 className="mt-2 text-3xl font-medium leading-tight text-balance sm:text-4xl">
            Plan from your pocket
          </h2>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-soft/80 md:mx-0">
            Add Bridal Team to your home screen for one-tap access to your timeline, budget and RSVPs. It installs
            straight from your browser, and pages you have already opened stay readable if you lose signal.
          </p>
          {isMobile ? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(INSTALL_EVENT))}
              className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white shadow-[0_14px_30px_-12px_rgba(243,103,5,0.8)] transition-transform hover:-translate-y-0.5"
            >
              Add to home screen
            </button>
          ) : (
            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-stone-2 bg-white px-5 py-2.5 text-sm text-ink-soft">
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
            className="h-20 w-20 rounded-[22px] bg-white shadow-card ring-1 ring-stone-2 md:h-28 md:w-28 md:rounded-[28px]"
          />
        </div>
      </div>
    </section>
  );
}
