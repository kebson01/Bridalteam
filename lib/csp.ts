import { SUPABASE_URL } from "@/lib/supabase";
import { analyticsConfigured } from "@/lib/analytics";

/**
 * Builds the Content-Security-Policy.
 *
 * ── Why this is not nonce-based by default ──────────────────────────────────
 * It used to be, and the policy was silently doing nothing. A nonce has to be
 * minted per request and stamped onto every script tag in the same render.
 * Most of this site is statically prerendered at build time (`○ Static` in the
 * build output: /, /pricing, /about, /blog, /guides, /planner, /terms,
 * /privacy, /signup and both /auth pages). Those HTML files are generated long
 * before any request exists, so Next has no nonce to stamp and emits **zero**
 * nonced scripts, while this middleware still advertises a fresh nonce in the
 * header. On top of that the whole response — header included — is cached at
 * the CDN for days, so even the advertised nonce goes stale.
 *
 * Measured on production before this change: / and /pricing served 0 nonced
 * scripts against header nonces 14.7 and 6.4 days old, and every script on the
 * page logged a violation. Report-Only hid the damage; flipping CSP_ENFORCE
 * would have blocked all JavaScript on the entire marketing site.
 *
 * ── What we do instead ──────────────────────────────────────────────────────
 * Default to a policy with no per-request state, which is therefore correct on
 * static, dynamic and CDN-cached responses alike, and can actually be enforced.
 * `script-src 'self' 'unsafe-inline'` is weaker against injected inline script
 * than a nonce would be, but every other directive still does real work:
 * object-src/base-uri/form-action close off classic injection escalations,
 * frame-ancestors blocks clickjacking, and connect-src pins network egress to
 * our own origin and Supabase, which is what actually limits data exfiltration.
 *
 * Set CSP_STRICT=true to opt back into nonce + 'strict-dynamic'. Only do that
 * once the marketing routes render dynamically (e.g. `export const dynamic =
 * "force-dynamic"`), or you will reproduce the outage described above.
 *
 * connect-src allows the Supabase REST API and its realtime websocket (used by
 * community + notifications). Anthropic is called server-side only, so it isn't
 * listed. img-src allows any https host because vendor/venue/inspiration images
 * can point anywhere (low risk for images) plus blob:/data: for avatar cropping.
 * style-src keeps 'unsafe-inline' — Next/Tailwind emit inline styles, and style
 * injection is far lower risk than script injection.
 *
 * Two directives name third parties because the app genuinely navigates to and
 * embeds them; both were found by walking the app rather than by reading the
 * policy, and both would have broken silently the moment CSP_ENFORCE was set:
 *
 *   frame-src   — the inspiration gallery embeds YouTube and Vimeo players
 *                 (components/inspiration-gallery.tsx::toEmbed). Without this
 *                 the directive falls back to default-src 'self' and every
 *                 embedded video renders as an empty box.
 *   script-src / frame-src / connect-src also name challenges.cloudflare.com
 *                 for Cloudflare Turnstile, which guards signup, login and
 *                 password reset (see lib/captcha.ts). All three are needed:
 *                 the script, the challenge iframe, and its own XHR. Since
 *                 this policy is enforcing in production, a missing entry
 *                 means the widget never loads and — once Supabase is set to
 *                 require a token — nobody can sign up at all.
 *   form-action — vendor checkout redirects to checkout.stripe.com and the
 *                 billing portal to billing.stripe.com. Chrome exempts
 *                 redirects from form-action, but Firefox and Safari do not,
 *                 so on those browsers a no-JS "Subscribe" POST would be
 *                 blocked mid-redirect. Naming the hosts costs nothing and
 *                 removes the browser-dependent failure.
 *
 *   script-src / connect-src also name Google's analytics hosts, but ONLY
 *                 when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. Widening the
 *                 policy for a tracker that isn't configured would weaken it
 *                 for nothing, and a deployment that drops the id gets the
 *                 tighter policy back automatically. Note that the gate is on
 *                 configuration, not consent: the header is one per response
 *                 and is CDN-cached, so it cannot vary per visitor. CSP is a
 *                 ceiling on what the page *may* load — components/analytics
 *                 .tsx is what decides whether anything is loaded at all.
 *
 * Anything else added later that loads a cross-origin script, iframe, or
 * fetch target needs its own entry here — check before enabling a feature,
 * not after a support ticket.
 */
export function buildCsp(nonce: string, strict: boolean): string {
  const supabaseHttp = SUPABASE_URL;
  const supabaseWss = SUPABASE_URL.replace(/^https:/, "wss:");
  // Cloudflare Turnstile: a script on our page, an iframe for the challenge,
  // and its own XHR back home. Named in script-src, frame-src and connect-src
  // below. Remove all three together if the captcha is ever dropped.
  const turnstile = "https://challenges.cloudflare.com";
  // Google Analytics: the gtag loader comes from googletagmanager.com and then
  // beacons to google-analytics.com. The wildcards are not decoration —
  // GA4 collects via region-specific subdomains (region1.google-analytics.com
  // and friends), so naming the bare host alone drops data from most of the
  // world while looking correct from a US test.
  const ga = analyticsConfigured()
    ? {
        script: " https://www.googletagmanager.com",
        connect:
          " https://www.google-analytics.com https://*.google-analytics.com" +
          " https://*.analytics.google.com https://www.googletagmanager.com",
      }
    : { script: "", connect: "" };
  const scriptSrc = strict
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${turnstile}${ga.script}`
    : `script-src 'self' 'unsafe-inline' ${turnstile}${ga.script}`;
  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `media-src 'self' https:`,
    `connect-src 'self' ${supabaseHttp} ${supabaseWss} ${turnstile}${ga.connect}`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `frame-src 'self' https://www.youtube.com https://player.vimeo.com ${turnstile}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://checkout.stripe.com https://billing.stripe.com`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}
