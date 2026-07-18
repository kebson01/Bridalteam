"use client";

import Link from "next/link";
import { useState } from "react";

export default function AuthForm({ mode }: { mode: "signup" | "login" }) {
  const isSignup = mode === "signup";
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/15 text-brand-dark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-medium text-ink">
          {isSignup ? "You're on the list!" : "Welcome back!"}
        </h2>
        <p className="mt-2 text-sm text-ink-soft/75">
          {isSignup
            ? "Accounts open soon — we'll email you the moment your free Bridal Team workspace is ready."
            : "Sign-in isn't wired to a backend yet in this preview. It's coming with accounts."}
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

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
      className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card"
    >
      {isSignup && (
        <label className="mb-4 block">
          <span className="text-sm font-medium text-ink-soft">Your name</span>
          <input
            required
            type="text"
            placeholder="Alex & Sam"
            className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand"
          />
        </label>
      )}
      <label className="mb-4 block">
        <span className="text-sm font-medium text-ink-soft">Email</span>
        <input
          required
          type="email"
          placeholder="you@email.com"
          className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand"
        />
      </label>
      <label className="mb-6 block">
        <span className="text-sm font-medium text-ink-soft">Password</span>
        <input
          required
          type="password"
          placeholder="••••••••"
          className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
      >
        {isSignup ? "Create my free account" : "Log in"}
      </button>

      <p className="mt-5 text-center text-sm text-ink-soft/70">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-brand-dark">
              Log in
            </Link>
          </>
        ) : (
          <>
            New to Bridal Team?{" "}
            <Link href="/signup" className="font-semibold text-brand-dark">
              Start free
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
