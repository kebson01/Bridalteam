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
 * script-src/style-src/img-src are left open on purpose: couples load fonts,
 * animation libraries and photos from CDNs, and with an opaque origin there is
 * nothing on our side for those scripts to reach.
 *
 * middleware.ts skips its own CSP for /sandbox/ (two policies would
 * intersect and block the CDNs), and next.config.ts swaps X-Frame-Options
 * DENY for SAMEORIGIN there. Keep all three in step.
 */

export const SANDBOX_PREFIX = "/sandbox/";

export const SANDBOX_IFRAME_ATTR = "allow-scripts allow-popups allow-popups-to-escape-sandbox";

export const SANDBOX_CSP = [
  `sandbox ${SANDBOX_IFRAME_ATTR}`,
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
