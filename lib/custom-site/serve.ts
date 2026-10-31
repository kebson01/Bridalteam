/**
 * Serving couple-written HTML without letting it touch bridalteam.com.
 *
 * Custom sites are arbitrary HTML and JavaScript — pasted by a couple, or
 * written by their own AI. On our origin, a script like that could read the
 * viewer's Supabase session and act as them. So it is only ever served from
 * app/sandbox/*, with these headers:
 *
 *  - `Content-Security-Policy: sandbox allow-scripts …` with NO
 *    allow-same-origin. The browser gives the document an opaque origin: our
 *    cookies, localStorage and same-origin fetches are out of reach, even if
 *    someone opens the sandbox URL directly instead of through the iframe.
 *  - No allow-top-navigation: the page can't redirect the guest's tab.
 *    Links to other sites open in a new tab (allow-popups +
 *    allow-popups-to-escape-sandbox, so registry sites work normally).
 *  - No allow-forms + `form-action 'none'`: a custom page can't post a
 *    look-alike sign-in form anywhere. RSVPs are invite-only anyway.
 *  - `frame-ancestors 'self'`: only our own pages may frame it.
 *
 * What a page may load is limited so that what guests see is what passed the
 * content policy check at publish (lib/custom-site/policy.ts):
 *  - Scripts and stylesheets only inline or from the well-known CDNs in
 *    SITE_CDNS, so a page can't pull in new code from its own server later.
 *  - connect-src 'none': no fetch/XHR/WebSocket, so a script can't download
 *    new text after the review.
 *  - Embeds only from YouTube, Vimeo and Google Maps (livestreams, venues).
 *  - Images, fonts and video from any https URL. Images are checked at
 *    publish; the "Report this page" link covers anything swapped later.
 *
 * middleware.ts skips its own CSP for /sandbox/ (two policies would
 * intersect and block the CDNs), and next.config.ts swaps X-Frame-Options
 * DENY for SAMEORIGIN there. Keep all three in step.
 */

export const SANDBOX_PREFIX = "/sandbox/";

export const SANDBOX_IFRAME_ATTR = "allow-scripts allow-popups allow-popups-to-escape-sandbox";

/** Where custom sites may load scripts and stylesheets from. */
export const SITE_CDNS = [
  "https://cdn.jsdelivr.net",
  "https://cdnjs.cloudflare.com",
  "https://unpkg.com",
  "https://cdn.tailwindcss.com",
  "https://code.jquery.com",
  "https://ajax.googleapis.com",
  "https://fonts.googleapis.com",
];

/** Embeds a custom site may show. */
export const SITE_EMBEDS = [
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://www.google.com/maps/",
  "https://maps.google.com",
];

export const SANDBOX_CSP = [
  `sandbox ${SANDBOX_IFRAME_ATTR}`,
  "default-src 'none'",
  `script-src 'unsafe-inline' 'unsafe-eval' ${SITE_CDNS.join(" ")}`,
  `style-src 'unsafe-inline' ${SITE_CDNS.join(" ")}`,
  "img-src https: data: blob:",
  "font-src https: data:",
  "media-src https: blob:",
  `frame-src ${SITE_EMBEDS.join(" ")}`,
  "connect-src 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
  "base-uri 'none'",
  "object-src 'none'",
].join("; ");

export function sandboxedHtmlResponse(html: string, opts: { cache?: boolean; status?: number } = {}): Response {
  return new Response(html, {
    status: opts.status ?? 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": SANDBOX_CSP,
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow",
      // Live pages may be cached briefly; drafts never.
      "Cache-Control": opts.cache ? "public, max-age=0, s-maxage=30, stale-while-revalidate=60" : "private, no-store",
    },
  });
}

export function sandboxedNotFound(): Response {
  return sandboxedHtmlResponse(
    '<!doctype html><meta charset="utf-8"><title>Not found</title><p style="font-family:system-ui;padding:2rem;color:#555">This page isn’t available.</p>',
    { status: 404 },
  );
}
