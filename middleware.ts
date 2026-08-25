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
 */
function buildCsp(nonce: string, strict: boolean): string {
  const supabaseHttp = SUPABASE_URL;
  const supabaseWss = SUPABASE_URL.replace(/^https:/, "wss:");
  const scriptSrc = strict
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `script-src 'self' 'unsafe-inline'`;
  return [
    `default-src 'self'`,
    scriptSrc,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' blob: data: https:`,
    `font-src 'self' data:`,
    `media-src 'self' https:`,
    `connect-src 'self' ${supabaseHttp} ${supabaseWss}`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
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
