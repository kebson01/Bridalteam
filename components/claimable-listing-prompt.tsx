"use client";

import { useActionState } from "react";
import {
  claimListingByEmail,
  type ClaimState,
  type ClaimableListing,
} from "@/app/onboarding/claim-actions";

/**
 * "We already have a page for your business — is this you?"
 *
 * Shown above the onboarding form, which is the only place it does its real
 * job. A vendor recruited over the phone arrives here, sees a blank form, and
 * builds a second listing — the exact duplicate-listing failure the first
 * walkthrough of the claim flow produced for real. Intercepting them *before*
 * the form is the point; putting this on the vendor dashboard instead would be
 * one screen too late.
 *
 * Deliberately phrased as a question with no dismiss button. There is nothing
 * to dismiss: the form is still right below, so ignoring it is already the
 * no-op, and a vendor who does not recognise the business should simply carry
 * on rather than be asked to make a decision about it.
 */
export default function ClaimableListingPrompt({
  listings,
}: {
  listings: ClaimableListing[];
}) {
  const [state, action, pending] = useActionState<ClaimState, FormData>(claimListingByEmail, {
    error: null,
  });

  if (listings.length === 0) return null;

  return (
    <section className="mx-auto mb-8 max-w-2xl rounded-2xl border border-brand/30 bg-brand-wash/60 p-6">
      <h2 className="text-lg font-medium text-ink">
        {listings.length === 1
          ? "We already have a page for your business"
          : "We already have pages for these businesses"}
      </h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft/80">
        Claim it instead of starting from scratch — your details, photos and
        contact information are already there, and nothing is public until you
        choose to publish.
      </p>

      <ul className="mt-4 space-y-3">
        {listings.map((l) => (
          <li
            key={l.org_id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-2 bg-white px-4 py-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{l.business_name}</p>
              <p className="truncate text-xs text-ink-soft/70">
                {[l.category, [l.city, l.region].filter(Boolean).join(", ")]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <form action={action}>
              <input type="hidden" name="org_id" value={l.org_id} />
              <button
                type="submit"
                disabled={pending}
                className="shrink-0 rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {pending ? "Claiming…" : "This is mine"}
              </button>
            </form>
          </li>
        ))}
      </ul>

      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-soft/60">
        Not your business? Ignore this and fill in the form below.
      </p>
    </section>
  );
}
