"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

/**
 * Lets a signed-in user change their account email. Supabase's "secure email
 * change" sends a confirmation link (to the new address, and to the old one too
 * if that setting is on); the change only takes effect once confirmed. The link
 * returns through /auth/callback, which finalises the swap and lands the user
 * back on /account.
 */
export default function ChangeEmailPanel({ currentEmail }: { currentEmail: string }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const next = email.trim().toLowerCase();
    if (next === currentEmail.toLowerCase()) {
      setError("That's already your email.");
      return;
    }

    setBusy(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser(
      { email: next },
      { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/account")}` },
    );

    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="text-lg font-medium text-ink">Email address</h2>
      <p className="mt-1 text-sm text-ink-soft/70">
        Signed in as <span className="font-medium text-ink">{currentEmail}</span>.
      </p>

      {sent ? (
        <div className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Almost there — we sent a confirmation link to{" "}
          <span className="font-medium">{email.trim().toLowerCase()}</span>. Open it to
          finish the change. If we also email your current address, confirm from there
          too. Your email stays the same until it&rsquo;s confirmed.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 max-w-md">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">New email</span>
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
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="mt-4 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
          >
            {busy ? "Sending…" : "Update email"}
          </button>
        </form>
      )}
    </div>
  );
}
