import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Exchanges the code from a confirmation or magic-link email for a session,
 * then forwards the user on.
 *
 * Redirects are built from the configured public SITE_URL, NOT the incoming
 * request's origin. Behind DigitalOcean's proxy the app receives requests on
 * http://localhost:8080, so `new URL(next, request.url)` would send a
 * freshly-confirmed user to a dead internal address.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Only ever redirect to a path on our own site — an open redirect here would
  // let a crafted email bounce a freshly-authenticated user to any site.
  const requested = url.searchParams.get("next") ?? "/onboarding";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/onboarding";

  if (!code) {
    // Supabase redirects here with error params when a link is invalid or
    // already used — surface that instead of a generic "missing code".
    const errCode = url.searchParams.get("error_code") ?? "";
    const kind = /expired/i.test(errCode) ? "expired" : "missing_code";
    return NextResponse.redirect(new URL(`/auth/login?error=${kind}`, SITE_URL));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback failed:", error.message);
    return NextResponse.redirect(new URL("/auth/login?error=invalid_code", SITE_URL));
  }

  return NextResponse.redirect(new URL(next, SITE_URL));
}
