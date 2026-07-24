"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Status = "checking" | "ready" | "no_session" | "done";

/**
 * Sets a new password after the user arrives from a reset email. By this point
 * /auth/callback has already exchanged the emailed code for a recovery session,
 * so we just confirm a session exists and call updateUser.
 */
export default function ResetPasswordPanel() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      setStatus(data.session ? "ready" : "no_session");
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Those passwords don't match.");
      return;
    }

    setBusy(true);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    setStatus("done");
    setBusy(false);
  }

  if (status === "checking") {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <p className="text-sm text-ink-soft/75">One moment…</p>
      </div>
    );
  }

  if (status === "no_session") {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-medium text-ink">Link expired</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
          This reset link is invalid or has expired. Request a fresh one and
          we&rsquo;ll email it right over.
        </p>
        <p className="mt-6 text-sm text-ink-soft/70">
          <Link href="/auth/forgot-password" className="font-semibold text-brand-dark">
            Send a new link
          </Link>
        </p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-medium text-ink">Password updated</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
          You&rsquo;re all set — your new password is ready to use.
        </p>
        <button
          type="button"
          onClick={() => {
            // /dashboard self-routes each account to its home (couples to their
            // wedding, vendors to /vendor), so this works for everyone.
            router.push("/dashboard");
            router.refresh();
          }}
          className="mt-6 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Continue to my account
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card"
    >
      <label className="mb-4 block">
        <span className="text-sm font-medium text-ink-soft">New password</span>
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
        />
        <span className="mt-1.5 block text-xs text-ink-soft/60">At least 8 characters.</span>
      </label>

      <label className="mb-6 block">
        <span className="text-sm font-medium text-ink-soft">Confirm new password</span>
        <input
          required
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          disabled={busy}
          placeholder="••••••••"
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
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
