"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { sendInquiry, type InquiryState } from "@/app/vendor/inquiry-actions";

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
}: {
  vendorOrgId: string;
  signedIn: boolean;
  defaultName?: string;
  defaultEmail?: string;
  loginHref: string;
}) {
  const [state, action, pending] = useActionState(sendInquiry, initial);
  const [open, setOpen] = useState(false);

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
