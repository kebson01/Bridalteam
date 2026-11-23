"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { sendInquiry, type InquiryState } from "@/app/vendor/inquiry-actions";
import { gaEvent } from "@/lib/google-analytics";

const initial: InquiryState = { error: null, sent: false };

/**
 * "Send inquiry" for a Pro/Featured vendor's public profile. Signed-out
 * visitors are nudged to log in; signed-in couples get an inline form.
 */
export default function VendorInquiryButton({
  vendorOrgId,
  signedIn,
  defaultName = "",
  defaultEmail = "",
  loginHref,
  vendorCategory,
}: {
  vendorOrgId: string;
  signedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
  loginHref: string;
  /** Sent to GA with the lead, so inquiries can be broken down by category. */
  vendorCategory?: string | null;
}) {
  const [state, action, pending] = useActionState(sendInquiry, initial);
  const [open, setOpen] = useState(false);

  // One GA lead per successful send. `sent` only ever flips false -> true for
  // this component (the form is replaced by the confirmation), so this fires
  // once. Never the name, email or message: no personal data goes to Google.
  useEffect(() => {
    if (!state.sent) return;
    gaEvent({
      name: "generate_lead",
      params: { lead_source: "vendor_inquiry", ...(vendorCategory ? { vendor_category: vendorCategory } : {}) },
    });
  }, [state.sent, vendorCategory]);

  if (!signedIn) {
    return (
      <Link
        href={loginHref}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white"
      >
        Log in to send an inquiry
      </Link>
    );
  }

  if (state.sent) {
    return (
      <p className="mt-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
        Your inquiry was sent — the vendor will be in touch.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white"
      >
        Send an inquiry
      </button>
    );
  }

  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="vendor_org_id" value={vendorOrgId} />
      <input
        name="name"
        defaultValue={defaultName}
        placeholder="Your name"
        required
        className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <input
        name="email"
        type="email"
        defaultValue={defaultEmail}
        placeholder="Your email"
        required
        className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      <textarea
        name="message"
        rows={4}
        placeholder="Tell them about your wedding…"
        required
        className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
