"use client";

import { useState, useTransition } from "react";
import { deactivateVendorAccount, closeVendorAccount } from "@/app/vendor/actions";

/**
 * Account lifecycle controls for a vendor: deactivate (reversible — hide the
 * listing and stop renewals) and permanently close the account. Both server
 * actions redirect on completion.
 */
export default function VendorAccountActions({ orgId }: { orgId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmClose, setConfirmClose] = useState(false);

  function deactivate() {
    if (
      !confirm(
        "Deactivate your account?\n\n" +
          "Your listing will be hidden and your subscription won't renew — you keep " +
          "Featured until the end of your current period (no refund for the remainder). " +
          "You can reactivate anytime by publishing your listing again.",
      )
    )
      return;
    startTransition(() => deactivateVendorAccount(orgId));
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="text-lg font-medium text-ink">Account</h2>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-stone-2 pb-5">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-ink">Deactivate account</p>
          <p className="mt-1 text-sm text-ink-soft/70">
            Hide your listing and stop your subscription from renewing. Reversible —
            reactivate anytime. Payments already made are non-refundable.
          </p>
        </div>
        <button
          type="button"
          onClick={deactivate}
          disabled={pending}
          className="rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-60"
        >
          Deactivate
        </button>
      </div>

      <div className="mt-5 max-w-md">
        <p className="text-sm font-semibold text-red-700">Close account</p>
        <p className="mt-1 text-sm text-ink-soft/70">
          Permanently cancel your subscription, remove your listing and media, and close
          your account. This can&rsquo;t be undone, and payments already made are
          non-refundable.
        </p>
        {confirmClose ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm text-ink">Are you sure? This is permanent.</span>
            <button
              type="button"
              onClick={() => startTransition(() => closeVendorAccount(orgId))}
              disabled={pending}
              className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Closing…" : "Yes, close my account"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmClose(false)}
              disabled={pending}
              className="text-sm text-ink-soft/60"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmClose(true)}
            className="mt-3 rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            Close account…
          </button>
        )}
      </div>
    </div>
  );
}
