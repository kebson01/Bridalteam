"use client";

import { useEffect, useRef, useState } from "react";
import { CAPTCHA_SITE_KEY } from "@/lib/captcha";

/**
 * Cloudflare Turnstile widget. Renders nothing when no site key is configured,
 * so the auth forms work unchanged before the key is set (see lib/captcha.ts
 * for why that ordering matters).
 *
 * Tokens are SINGLE USE. After a failed submit the caller must mount a fresh
 * widget to get a new one — the panels do that by changing this component's
 * `key`, which is simpler than exposing an imperative reset handle.
 *
 * Note for the CSP: this loads a third-party script and renders a third-party
 * iframe, so challenges.cloudflare.com is named in script-src, frame-src and
 * connect-src in middleware.ts. The policy is ENFORCING in production — the
 * widget silently fails to load without those entries.
 */

const SCRIPT_ID = "cf-turnstile";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
      // Turnstile passes a numeric code as a string; see isConfigError below.
      "error-callback"?: (code?: string) => void;
      "timeout-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      action?: string;
    },
  ) => string | undefined;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Turnstile reports failures to `error-callback` as a numeric code string, and
 * the code is the only thing that separates two problems that look identical
 * on screen. Cloudflare's own error box says "Unable to connect to website"
 * for both, which reads like a network fault even when it is our misconfigured
 * widget.
 *
 *   110xxx — integration errors: 110100/110110 an unknown or invalid sitekey,
 *            110200 the page's hostname is not on the widget's allowed-domains
 *            list, 110420 an action the widget rejects, 110430 a bad parameter.
 *            Nobody on the visitor's side can fix these and the widget will not
 *            recover on its own; an operator has to change the widget in the
 *            Cloudflare dashboard (or the deployed key). We take Cloudflare's
 *            box down and say so, with the code, rather than leaving a visitor
 *            clicking Troubleshoot at a problem that is ours.
 *   others — transient: network blips, a timed-out challenge, the 300xxx and
 *            600xxx execution errors. Turnstile retries these itself, so we log
 *            the code and otherwise keep out of its way.
 *
 * Every code is logged either way. Without that, diagnosing this needs DevTools
 * on the affected visitor's machine, which in practice means it never happens.
 */
function isConfigError(code: string | undefined): boolean {
  return typeof code === "string" && code.startsWith("110");
}

type Failure =
  /** The script never loaded — blocker, network filter, or a missing CSP entry. */
  | { kind: "blocked" }
  /** The widget loaded but is misconfigured and will not recover. */
  | { kind: "config"; code: string };

/** Loads the Turnstile script once per page, shared across widgets. */
function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    const done = () =>
      window.turnstile
        ? resolve(window.turnstile)
        : reject(new Error("turnstile_missing_after_load"));

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error("turnstile_blocked")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", done, { once: true });
    script.addEventListener("error", () => reject(new Error("turnstile_blocked")), { once: true });
    document.head.appendChild(script);
  });
}

export default function Captcha({
  onToken,
  action,
}: {
  /** Called with a token when solved, and with null when it expires or fails. */
  onToken: (token: string | null) => void;
  /** Labels the widget in Turnstile's analytics, e.g. "signup". */
  action?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Kept in a ref so a caller passing an inline arrow doesn't re-create the
  // widget on every render.
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const [failure, setFailure] = useState<Failure | null>(null);

  useEffect(() => {
    if (!CAPTCHA_SITE_KEY) return;

    let cancelled = false;

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !hostRef.current) return;
        widgetIdRef.current =
          turnstile.render(hostRef.current, {
            sitekey: CAPTCHA_SITE_KEY,
            action,
            theme: "light",
            callback: (token) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": (code) => {
              console.error(
                `[turnstile] error-callback code=${code ?? "unknown"} sitekey=${CAPTCHA_SITE_KEY.slice(0, 8)}… host=${window.location.hostname}`,
              );
              onTokenRef.current(null);
              if (cancelled || !isConfigError(code)) return;
              // Unrecoverable: drop Cloudflare's box so ours is the only one.
              const id = widgetIdRef.current;
              if (id && window.turnstile) {
                try {
                  window.turnstile.remove(id);
                } catch {
                  // Already gone; the message below is what matters.
                }
                widgetIdRef.current = null;
              }
              setFailure({ kind: "config", code: code as string });
            },
            "timeout-callback": () => onTokenRef.current(null),
          }) ?? null;
      })
      .catch(() => {
        // Script blocked — an extension, a network filter, or a CSP entry gone
        // missing. Say so plainly instead of letting the submit fail later with
        // Supabase's opaque "captcha protection: request disallowed".
        if (!cancelled) {
          setFailure({ kind: "blocked" });
          onTokenRef.current(null);
        }
      });

    return () => {
      cancelled = true;
      const id = widgetIdRef.current;
      if (id && window.turnstile) {
        try {
          window.turnstile.remove(id);
        } catch {
          // Already gone (navigated away mid-render); nothing to clean up.
        }
      }
      widgetIdRef.current = null;
    };
  }, [action]);

  if (!CAPTCHA_SITE_KEY) return null;

  if (failure?.kind === "blocked") {
    return (
      <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        We couldn&rsquo;t load the security check. Disable any ad or script blocker for
        this page and reload, and it&rsquo;ll appear.
      </p>
    );
  }

  if (failure?.kind === "config") {
    return (
      <div role="alert" className="mb-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <p>
          Our security check is misconfigured, so you can&rsquo;t sign in right now.
          This one&rsquo;s on us — please try again shortly.
        </p>
        <p className="mt-1 text-xs text-amber-700">Turnstile error {failure.code}</p>
      </div>
    );
  }

  return <div ref={hostRef} className="mb-5 flex justify-center" />;
}
