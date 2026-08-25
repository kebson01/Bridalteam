"use client";

import Link from "next/link";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Requests a password-reset email. Supabase sends a link back through
 * /auth/callback (PKCE code exchange), which forwards to /auth/reset-password
 * where the user sets a new password.
 *
 * We always show the same "check your email" confirmation whether or not the
 * address has an account — revealing which emails are registered would leak
 * membership.
 */
export default function ForgotPasswordPanel() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
        "/auth/reset-password",
      )}`,
    });

    // Only surface genuine failures (e.g. rate limiting). A missing account is
    // not reported back, so the confirmation is identical either way.
    if (error && !/user|email/i.test(error.message)) {
      setError(error.message);
      setBusy(false);
      return;
    }

    setSent(true);
    setBusy(false);
  }

  if (sent) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-medium text-ink">Check your email</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
          If an account exists for{" "}
          <span className="font-medium text-ink">{email}</span>, we&rsquo;ve sent a
          link to reset your password. It expires in an hour.
        </p>
        <p className="mt-6 text-sm text-ink-soft/70">
          <Link href="/auth/login" className="font-semibold text-brand-text">
            Back to log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card"
    >
      <p className="mb-6 text-sm leading-relaxed text-ink-soft/75">
        Enter the email on your account and we&rsquo;ll send you a link to set a
        new password.
      </p>

      <label className="mb-6 block">
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
        {busy ? "Sending…" : "Send reset link"}
      </button>

      <p className="mt-5 text-center text-sm text-ink-soft/70">
        Remembered it?{" "}
        <Link href="/auth/login" className="font-semibold text-brand-text">
          Log in
        </Link>
      </p>
    </form>
  );
}
