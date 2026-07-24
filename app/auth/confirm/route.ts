import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { supabaseServer } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Verifies email links (signup confirmation, password recovery, email change,
 * invites) using Supabase's token-hash flow, then forwards the user on.
 *
 * Templates should link to:
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=<template type>&next=<path>
 *
 * Unlike the OAuth-style ?code= exchange, the token hash always arrives in the
 * query string, so this works regardless of how the email client or browser
 * handles the link. Redirects are built from SITE_URL (see /auth/callback).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  // Only ever redirect to a path on our own site.
  const requested = url.searchParams.get("next") ?? "/onboarding";
  const next =
    requested.startsWith("/") && !requested.startsWith("//") ? requested : "/onboarding";

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", SITE_URL));
  }

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error) {
    console.error("auth confirm failed:", error.message);
    const kind = /expired/i.test(error.message) ? "expired" : "invalid_code";
    return NextResponse.redirect(new URL(`/auth/login?error=${kind}`, SITE_URL));
  }

  // Recovery links go to the reset screen regardless of `next`.
  const target = type === "recovery" ? "/auth/reset-password" : next;
  return NextResponse.redirect(new URL(target, SITE_URL));
}
