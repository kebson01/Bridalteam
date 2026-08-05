import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

// Signed-in areas. Everything else is the public marketing site.
const PROTECTED = ["/dashboard", "/onboarding", "/w"];

/**
 * Builds a nonce-based Content-Security-Policy.
 *
 * script-src uses a per-request nonce + 'strict-dynamic' so only Next's own
 * (nonced) scripts and what they load can run — injected inline scripts from any
 * XSS in user content (comments, community posts) are blocked. Next reads the
 * nonce from the CSP request header and applies it to the scripts it renders.
 *
 * connect-src allows the Supabase REST API and its realtime websocket (used by
 * community + notifications). Anthropic is called server-side only, so it isn't
 * listed. img-src allows any https host because vendor/venue/inspiration images
 * can point anywhere (low risk for images) plus blob:/data: for avatar cropping.
 * style-src keeps 'unsafe-inline' — Next/Tailwind emit inline styles, and style
 * injection is far lower risk than script injection.
 */
function buildCsp(nonce: string): string {
  const supabaseHttp = SUPABASE_URL;
  const supabaseWss = SUPABASE_URL.replace(/^https:/, "wss:");
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
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
 * break the app; set CSP_ENFORCE=true (after verifying reports are clean in
 * staging) to switch to the enforcing header. CSP_REPORT_URI, if set, receives
 * violation reports.
 */
export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const enforce = process.env.CSP_ENFORCE === "true";
  const reportUri = process.env.CSP_REPORT_URI;
  const csp = buildCsp(nonce) + (reportUri ? `; report-uri ${reportUri}` : "");
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
