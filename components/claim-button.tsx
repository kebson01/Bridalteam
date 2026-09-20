"use client";

import { useActionState } from "react";
import { claimListing, type ClaimState } from "@/app/claim/[token]/actions";

export default function ClaimButton({ token }: { token: string }) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(
    claimListing.bind(null, token),
    { error: null },
  );

  return (
    <form action={action}>
      {state.error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {pending ? "Claiming…" : "This is my business — claim it"}
      </button>
      <p className="mt-3 text-center text-xs leading-relaxed text-ink-soft/60">
        Claiming doesn&rsquo;t publish anything. You&rsquo;ll land in your vendor account
        where you can edit every detail, add photos, or delete the listing entirely.
      </p>
    </form>
  );
}
