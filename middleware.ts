import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/supabase";

// Signed-in areas. Everything else is the public marketing site.
const PROTECTED = ["/dashboard", "/onboarding", "/w"];

/**
 * Refreshes the Supabase auth session on every request (tokens expire, and
 * Server Components can't write cookies), then gates the signed-in areas.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
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
    if (!isProtected) return response;
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    login.searchParams.set("error", "unavailable");
    return NextResponse.redirect(login);
  }

  if (isProtected && !user) {
    const login = request.nextUrl.clone();
    login.pathname = "/auth/login";
    // Send them back where they were headed once signed in.
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except static assets, images, the service worker and icons.
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)",
  ],
};
