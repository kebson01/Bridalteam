import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Exchanges the code from a confirmation or magic-link email for a session,
 * then forwards the user on.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Only ever redirect to a path on this origin — an open redirect here would
  // let a crafted email bounce a freshly-authenticated user to any site.
  const requested = url.searchParams.get("next") ?? "/onboarding";
  const next = requested.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/onboarding";

  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", url.origin));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("auth callback failed:", error.message);
    return NextResponse.redirect(new URL("/auth/login?error=invalid_code", url.origin));
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
