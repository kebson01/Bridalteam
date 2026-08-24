"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteMyAccount } from "@/app/account/actions";

/**
 * Danger-zone control. Requires typing DELETE, then permanently deletes the
 * account via the server action. Surfaces the vendor-subscription guard and a
 * mailto fallback if the delete fails for any other reason.
 */
export default function DeleteAccount({ email }: { email: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const armed = confirm.trim().toUpperCase() === "DELETE";

  const mailto = `mailto:privacy@bridalteam.com?subject=${encodeURIComponent(
    "Account deletion request",
  )}&body=${encodeURIComponent(`Please delete my Bridal Team account (${email}).`)}`;

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50/40 p-6">
      <h2 className="text-lg font-medium text-red-800">Delete account</h2>
      <p className="mt-2 text-sm leading-relaxed text-red-900/80">
        Deleting your account is permanent and removes your personal data. Export
        your data first if you want to keep a copy. If you co-plan a wedding with
        others, we&rsquo;ll remove you from it without deleting the shared plan.
      </p>

      <label className="mt-4 block text-sm text-red-900/80">
        Type <span className="font-semibold">DELETE</span> to confirm
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={pending}
          className="mt-1.5 block w-40 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-red-500 disabled:opacity-60"
          placeholder="DELETE"
          aria-label="Type DELETE to confirm account deletion"
        />
      </label>

      {error === "active_vendor_subscription" && (
        <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Please cancel your Featured subscription before deleting your account.{" "}
          <Link href="/vendor" className="font-semibold underline">
            Go to billing
          </Link>
          .
        </p>
      )}
      {error === "failed" && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
          We couldn&rsquo;t delete your account automatically. Please email{" "}
          <a href={mailto} className="font-semibold underline">
            privacy@bridalteam.com
          </a>{" "}
          and we&rsquo;ll take care of it.
        </p>
      )}

      <button
        type="button"
        disabled={!armed || pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const res = await deleteMyAccount();
            if (res.ok) {
              router.push("/");
              router.refresh();
            } else {
              setError(res.error ?? "failed");
            }
          })
        }
        className="mt-4 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete my account permanently"}
      </button>
    </div>
  );
}
