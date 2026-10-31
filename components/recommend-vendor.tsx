"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { suggestVendor } from "@/app/vendors/actions";
import { CATEGORY_ORDER } from "@/lib/categories";

/**
 * "Know a great vendor who isn't here?" -- the couple-side half of finding
 * vendors. A recommendation becomes a lead an admin reviews on /admin/leads;
 * nothing goes live from this form on its own.
 */

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function RecommendVendor({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [form, setForm] = useState({ business_name: "", category: "", city: "", website: "", phone: "", note: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await suggestVendor(form);
      if (res.ok) {
        setSent(true);
        setForm({ business_name: "", category: "", city: "", website: "", phone: "", note: "" });
      } else setError(res.error);
    });
  }

  return (
    <section className="mx-auto mt-12 max-w-2xl rounded-3xl border border-stone-2 bg-white p-6 shadow-card sm:p-8">
      <h2 className="text-lg font-medium text-ink">Know a great vendor who isn&rsquo;t here?</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft/75">
        Tell us who you booked or loved. We check every recommendation and add the
        business to the directory, so the next couple can find them too.
      </p>

      {!signedIn ? (
        <Link
          href="/auth/login?next=/vendors"
          className="mt-4 inline-flex rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand hover:text-brand-text"
        >
          Sign in to recommend a vendor
        </Link>
      ) : sent ? (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">
          Thank you. We&rsquo;ll take a look.{" "}
          <button type="button" onClick={() => setSent(false)} className="font-semibold underline">
            Recommend another
          </button>
        </div>
      ) : !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white"
        >
          Recommend a vendor
        </button>
      ) : (
        <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Business name</span>
            <input required maxLength={200} value={form.business_name} onChange={set("business_name")} disabled={pending} className={field} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-ink-soft">What they do</span>
            <select value={form.category} onChange={set("category")} disabled={pending} className={field}>
              <option value="">Choose…</option>
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-ink-soft">City</span>
            <input maxLength={100} value={form.city} onChange={set("city")} disabled={pending} className={field} placeholder="e.g. Naples" />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-ink-soft">Website (optional)</span>
            <input maxLength={300} value={form.website} onChange={set("website")} disabled={pending} className={field} />
          </label>
          <label>
            <span className="mb-1 block text-xs font-medium text-ink-soft">Phone (optional)</span>
            <input maxLength={40} value={form.phone} onChange={set("phone")} disabled={pending} className={field} />
          </label>
          <label className="sm:col-span-2">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Anything we should know? (optional)</span>
            <textarea maxLength={1000} rows={2} value={form.note} onChange={set("note")} disabled={pending} className={field} />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={pending || !form.business_name.trim()}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Sending…" : "Send recommendation"}
            </button>
            <button type="button" onClick={() => setOpen(false)} disabled={pending} className="px-4 text-sm text-ink-soft/70 hover:text-ink">
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
