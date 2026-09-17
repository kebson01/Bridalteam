import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

// Signed-in areas. Everything else is the public marketing site.
const PROTECTED = ["/dashboard", "/onboarding", "/w"];

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
 * Anything else added later that loads a cross-origin script, iframe, or
 * fetch target needs its own entry here — check before enabling a feature,
 * not after a support ticket.
 */
function buildCsp(nonce: string, strict: boolean): string {
  const supabaseHttp = SUPABASE_URL;
  const supabaseWss = SUPABASE_URL.replace(/^https:/, "wss:");
  // Cloudflare Turnstile: a script on our page, an iframe for the challenge,
  // and its own XHR back home. Named in script-src, frame-src and connect-src
  // below. Remove all three together if the captcha is ever dropped.
  const turnstile = "https://challenges.cloudflare.com";
  const scriptSrc = strict
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${turnstile}`
    : `script-src 'self' 'unsafe-inline' ${turnstile}`;
  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `media-src 'self' https:`,
    `connect-src 'self' ${supabaseHttp} ${supabaseWss} ${turnstile}`,
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

/**
 * Refreshes the Supabase auth session on every request (tokens expire, and
 * Server Components can't write cookies), gates the signed-in areas, and sets a
 * Content-Security-Policy.
 *
 * The CSP ships as Content-Security-Policy-Report-Only by default so it can't
 * break the app; set CSP_ENFORCE=true to switch to the enforcing header. Unlike
 * the previous nonce-based policy, the default policy is safe to enforce on
 * every route — see buildCsp() for why that changed. CSP_REPORT_URI, if set,
 * receives violation reports.
 */
export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const enforce = process.env.CSP_ENFORCE === "true";
  // Nonce + 'strict-dynamic'. Incompatible with static prerendering; read the
  // buildCsp() comment before enabling.
  const strict = process.env.CSP_STRICT === "true";
  const reportUri = process.env.CSP_REPORT_URI;
  const csp = buildCsp(nonce, strict) + (reportUri ? `; report-uri ${reportUri}` : "");
  const cspHeaderName = enforce
    ? "Content-Security-Policy"
    : "Content-Security-Policy-Report-Only";

  // Pass the nonce + CSP to the app via request headers. Next reads the CSP
  // request header and stamps the nonce onto the scripts it renders.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const nextOptions = { request: { headers: requestHeaders } };

  // Attach the response-side CSP header (enforcing or report-only) to anything
  // we return, so both normal responses and redirects carry it.
  const withCsp = (res: NextResponse) => {
    res.headers.set(cspHeaderName, csp);
    return res;
  };

  let response = NextResponse.next(nextOptions);

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next(nextOptions);
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  // getUser() revalidates against Supabase. Don't swap it for getSession(),
  // which trusts an unverified cookie.
  //
  // This runs on every route, so an unreachable Supabase must not take the
  // public marketing site down with it. On failure: let public pages through
  // unauthenticated, and send protected pages to login rather than risk
  // serving someone else's wedding.
  let user = null;
  let authFailed = false;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    authFailed = true;
    console.error("middleware auth check failed:", error);
  }

  if (authFailed) {
    if (!isProtected) return withCsp(response);
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.searchParams.set("error", "unavailable");
    return withCsp(NextResponse.redirect(login));
  }

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    // Send them back where they were headed once signed in.
    login.searchParams.set("next", pathname);
    return withCsp(NextResponse.redirect(login));
  }

  return withCsp(response);
}

export const config = {
  matcher: [
    // Everything except static assets, images, the service worker and icons.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
