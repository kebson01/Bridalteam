"use client";

import { useEffect, useState } from "react";

/**
 * The `beforeinstallprompt` event isn't in the DOM lib types. It's fired by
 * Chromium browsers when a site meets the installability criteria, and lets us
 * defer the native install prompt until the user taps our own button.
 */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "bt_install_dismissed";

/** True when the page is already running as an installed standalone app. */
function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari exposes this non-standard flag instead of display-mode.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

/** Rough iOS detection — iOS Safari never fires `beforeinstallprompt`. */
function isIos(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOSDevice = /iphone|ipad|ipod/i.test(ua);
  // iPadOS 13+ reports as a Mac; distinguish it by touch support.
  const iPadOS = /macintosh/i.test(ua) && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

/**
 * A dismissible "install the app" prompt for mobile visitors.
 *
 * On Android/Chromium we capture `beforeinstallprompt` and drive the native
 * install flow from our own button. iOS Safari has no such API, so we show the
 * manual "Add to Home Screen" steps instead. The banner never shows on desktop,
 * when already installed, or once the visitor has dismissed it.
 */
export default function InstallApp() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1") return;

    // Android / Chromium: defer the native prompt and reveal our button.
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS Safari: no event to hook, so offer the manual instructions on mobile.
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    if (isIos() && isMobile) {
      setShowIosHelp(true);
      setVisible(true);
    }

    // Once installed, hide and don't nag again.
    const onInstalled = () => {
      setVisible(false);
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* private mode — ignore */
      }
    };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* private mode — ignore */
    }
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    if (outcome === "accepted") {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
    }
    setDeferred(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
      role="dialog"
      aria-label="Install the Bridal Team app"
    >
      <div className="mx-3 mb-3 rounded-2xl border border-black/5 bg-white p-4 shadow-lg shadow-black/10">
        <div className="flex items-start gap-3">
          <img
            src="/icon-192.png"
            alt=""
            className="h-11 w-11 flex-none rounded-xl"
            width={44}
            height={44}
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">Get the Bridal Team app</p>
            {showIosHelp ? (
              <p className="mt-0.5 text-sm text-ink/70">
                Tap the Share icon{" "}
                <span aria-hidden className="inline-block align-middle">
                  &#x2191;
                </span>
                , then choose <span className="font-medium">Add to Home Screen</span>.
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-ink/70">
                Install it on your phone for one-tap planning — no app store needed.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 flex-none rounded-full p-1.5 text-ink/40 hover:bg-black/5 hover:text-ink"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {!showIosHelp && (
          <button
            type="button"
            onClick={install}
            className="mt-3 w-full rounded-full bg-[#f25e00] px-4 py-2.5 text-center font-medium text-white transition-colors hover:bg-[#d95400] active:bg-[#c44c00]"
          >
            Install app
          </button>
        )}
      </div>
    </div>
  );
}
