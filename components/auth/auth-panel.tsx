"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = supabaseBrowser();

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/onboarding")}`,
        },
      });

      if (error) {
        setError(error.message);
        setBusy(false);
        return;
      }

      // With email confirmation on, there's a user but no session yet.
      if (!data.session) {
        setCheckEmail(true);
        setBusy(false);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
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
            <Link href="/auth/forgot-password" className="text-xs font-medium text-brand-dark">
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

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {busy ? "One moment…" : isSignup ? "Create my account" : "Log in"}
      </button>

      {isSignup && (
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-soft/70">
          By creating an account, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-brand-dark">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-semibold text-brand-dark">
            Privacy Policy
          </Link>
          .
        </p>
      )}

      <p className="mt-5 text-center text-sm text-ink-soft/70">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/auth/login" className="font-semibold text-brand-dark">
              Log in
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link href="/auth/signup" className="font-semibold text-brand-dark">
              Create an account
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
