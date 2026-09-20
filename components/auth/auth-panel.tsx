"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import Captcha from "@/components/auth/captcha";
import { readAttribution } from "@/lib/attribution";
import { track } from "@/lib/events";
import { CAPTCHA_REQUIRED } from "@/lib/captcha";
import { authErrorMessage } from "@/lib/auth-errors";

type Mode = "login" | "signup";

/**
 * Real authentication against Supabase Auth — distinct from the pre-launch
 * waitlist in components/auth-form.tsx, which collects an email and nothing
 * more. This one creates accounts.
 */
export default function AuthPanel({ mode, next }: { mode: Mode; next?: string }) {
  const isSignup = mode === "signup";
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkEmail, setCheckEmail] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  // Bumping this remounts the widget for a fresh token — Turnstile tokens are
  // single use, so a retry after any failure needs a new one.
  const [captchaNonce, setCaptchaNonce] = useState(0);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  function resetCaptcha() {
    setCaptchaToken(null);
    setCaptchaNonce((n) => n + 1);
  }

  // Counts the resend cooldown down to zero.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  /**
   * Re-sends the signup confirmation. Supabase rate-limits this server-side;
   * the local cooldown is so the button doesn't invite hammering into that
   * limit, which would only earn the user a 429.
   */
  async function handleResend() {
    setBusy(true);
    setResendError(null);
    setResent(false);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/onboarding")}`,
        captchaToken: captchaToken ?? undefined,
      },
    });

    if (error) {
      console.error("resend failed:", error.code, error.message);
      setResendError(authErrorMessage(error, "signup"));
    } else {
      setResent(true);
      setCooldown(60);
    }
    resetCaptcha();
    setBusy(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = supabaseBrowser();

    if (isSignup) {
      // Which ad or link brought them here, captured on the page they landed
      // on and carried across the navigation to this form. Rides along in user
      // metadata rather than its own table: no migration, no RLS to get wrong,
      // and it is read with one group-by. Treat it as a hint, not a fact —
      // metadata is writable by the account holder, so it is fine for judging
      // a campaign and wrong for anything that needs to be trustworthy.
      const attribution = readAttribution();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/onboarding")}`,
          captchaToken: captchaToken ?? undefined,
          ...(attribution ? { data: attribution } : {}),
        },
      });

      if (error) {
        console.error("signUp failed:", error.code, error.message);
        setError(authErrorMessage(error, "signup"));
        resetCaptcha();
        setBusy(false);
        return;
      }

      // Counted here, before the session branch below, because this is the
      // single point at which the account exists. With email confirmation on
      // there is a user and no session, and that is still a signup -- counting
      // it only on the session path would undercount every real one.
      const src = attribution?.utm_source ?? attribution?.referrer_host ?? undefined;
      track("signup_success", undefined, src);

      // With email confirmation on, there's a user but no session yet.
      if (!data.session) {
        setCheckEmail(true);
        setBusy(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: { captchaToken: captchaToken ?? undefined },
      });
      if (error) {
        console.error("signInWithPassword failed:", error.code, error.message);
        setError(authErrorMessage(error, "login"));
        resetCaptcha();
        setBusy(false);
        return;
      }
    }

    // Full navigation so middleware and Server Components see the new cookies.
    router.push(next ?? (isSignup ? "/onboarding" : "/dashboard"));
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-medium text-ink">Check your email</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
          We sent a confirmation link to{" "}
          <span className="font-medium text-ink">{email}</span>. Open it and
          you&rsquo;ll land straight in your planner.
        </p>

        <p className="mx-auto mt-5 max-w-sm text-xs leading-relaxed text-ink-soft/60">
          Nothing there? Look in spam or promotions — it can take a minute to
          arrive. You need to confirm before you can log in.
        </p>

        {resendError && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-left text-sm text-red-700">
            {resendError}
          </p>
        )}

        {resent && !resendError && (
          <p role="status" className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
            Sent again to {email}.
          </p>
        )}

        {/* Resend needs its own token: the one from signup is already spent. */}
        <div className="mt-5">
          <Captcha key={`resend-${captchaNonce}`} onToken={setCaptchaToken} action="resend" />
        </div>

        <button
          type="button"
          onClick={handleResend}
          disabled={busy || cooldown > 0 || (CAPTCHA_REQUIRED && !captchaToken)}
          className="mt-1 rounded-full border border-stone-2 px-6 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50 disabled:hover:border-stone-2 disabled:hover:text-ink-soft"
        >
          {busy
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : "Resend the confirmation email"}
        </button>

        <p className="mt-6 text-sm text-ink-soft/70">
          Wrong address?{" "}
          <button
            type="button"
            onClick={() => {
              setCheckEmail(false);
              setResent(false);
              setResendError(null);
              resetCaptcha();
            }}
            className="font-semibold text-brand-text underline-offset-2 hover:underline"
          >
            Start over
          </button>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card"
    >
      <label className="mb-4 block">
        <span className="text-sm font-medium text-ink-soft">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          disabled={busy}
          placeholder="you@email.com"
          className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
        />
      </label>

      <label className="mb-6 block">
        <span className="text-sm font-medium text-ink-soft">Password</span>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={isSignup ? "new-password" : "current-password"}
          minLength={8}
          disabled={busy}
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
        />
        {isSignup ? (
          <span className="mt-1.5 block text-xs text-ink-soft/60">
            At least 8 characters.
          </span>
        ) : (
          <span className="mt-1.5 block text-right">
            <Link href="/auth/forgot-password" className="text-xs font-medium text-brand-text">
              Forgot password?
            </Link>
          </span>
        )}
      </label>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <Captcha
        key={captchaNonce}
        onToken={setCaptchaToken}
        action={isSignup ? "signup" : "login"}
      />

      <button
        type="submit"
        disabled={busy || (CAPTCHA_REQUIRED && !captchaToken)}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {busy ? "One moment…" : isSignup ? "Create my account" : "Log in"}
      </button>

      {isSignup && (
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft/70">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-brand-text">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-brand-text">
            Privacy Policy
          </Link>
          .
        </p>
      )}

      <p className="mt-5 text-center text-sm text-ink-soft/70">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-text">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/auth/signup" className="font-semibold text-brand-text">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
