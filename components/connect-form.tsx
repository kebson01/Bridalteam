"use client";

import { useActionState } from "react";
import { connectToWedding, type ConnectState } from "@/app/connect/actions";

export default function ConnectForm() {
  const [state, action, pending] = useActionState<ConnectState, FormData>(connectToWedding, {
    error: null,
  });

  return (
    <form action={action} className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card">
      <label className="block">
        <span className="text-sm font-medium text-ink-soft">Connect code</span>
        <input
          name="code"
          required
          autoComplete="off"
          placeholder="ABCD1234"
          disabled={pending}
          className="mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-center font-mono text-lg uppercase tracking-[0.3em] text-ink outline-none focus:border-brand disabled:opacity-60"
        />
      </label>

      {state.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {pending ? "Connecting…" : "Connect to this wedding"}
      </button>
    </form>
  );
}
