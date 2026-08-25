"use client";

import Link from "next/link";
import { useState } from "react";

type Audience = "couple" | "vendor";

/**
 * Pre-launch waitlist capture.
 *
 * Accounts aren't open yet, so this deliberately does NOT ask for a password —
 * collecting a credential for an account that cannot exist invites password
 * reuse for no benefit. `mode="login"` renders an explanation rather than a
 * form, because there is nothing to sign in to.
 */
export default function AuthForm({
  mode,
  audience = "couple",
  source,
}: {
  mode: "signup" | "login";
  audience?: Audience;
  source?: string;
}) {
  const isSignup = mode === "signup";
  const isVendor = audience === "vendor";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nothing to log in to yet — say so plainly instead of showing a form that
  // silently fails.
  if (!isSignup) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-medium text-ink">Accounts aren&rsquo;t open yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-soft/75">
          Bridal Team is in preview, so there are no sign-ins yet. Join the
          waitlist and we&rsquo;ll email you the moment your free workspace is
          ready.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
          >
            Join the waitlist
          </Link>
          <Link
            href="/planner"
            className="inline-flex rounded-full border border-stone-2 px-6 py-3 text-sm font-semibold text-ink-soft hover:border-brand"
          >
            Try the AI planner
          </Link>
        </div>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand-text">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-medium text-ink">
          {alreadyJoined ? "You're already on the list!" : "You're on the list!"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft/75">
          We&rsquo;ve saved <span className="font-medium text-ink">{email}</span>{" "}
          and will email you the moment{" "}
          {isVendor ? "vendor profiles open" : "your free workspace is ready"}.
        </p>
        <Link
          href="/planner"
          className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white"
        >
          Meanwhile, try the AI planner
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          name: name || undefined,
          role: audience,
          source: source ?? (isVendor ? "for-vendors" : "signup"),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }

      setAlreadyJoined(Boolean(data?.alreadyJoined));
      setStatus("done");
    } catch {
      setError("We couldn't reach the server. Please check your connection.");
      setStatus("idle");
    }
  }

  const sending = status === "sending";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card"
    >
      {!isVendor && (
        <label className="mb-4 block">
          <span className="text-sm font-medium text-ink-soft">Your name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex & Sam"
            autoComplete="name"
            disabled={sending}
            className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60"
          />
        </label>
      )}

      <label className="mb-6 block">
        <span className="text-sm font-medium text-ink-soft">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          disabled={sending}
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
        disabled={sending}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {sending
          ? "Saving…"
          : isVendor
            ? "Join the vendor waitlist"
            : "Join the waitlist"}
      </button>

      <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft/70">
        Accounts open soon — we&rsquo;ll only email you about Bridal Team.
        {!isVendor && (
          <>
            {" "}
            Are you a vendor?{" "}
            <Link href="/for-vendors" className="font-semibold text-brand-text">
              Join here instead
            </Link>
            .
          </>
        )}
      </p>
    </form>
  );
}
