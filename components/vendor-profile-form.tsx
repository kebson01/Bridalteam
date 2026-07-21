"use client";

import { useActionState, useState, useTransition } from "react";
import { updateVendorProfile, setVendorPublished, type ProfileState } from "@/app/vendor/actions";

export interface VendorProfile {
  org_id: string;
  business_name: string;
  category: string | null;
  description: string | null;
  city: string | null;
  region: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  status: string;
}

const INPUT =
  "mt-1.5 w-full rounded-lg border border-stone-2 px-4 py-3 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function VendorProfileForm({ profile }: { profile: VendorProfile }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateVendorProfile, {
    error: null,
    saved: false,
  });
  const [published, setPublished] = useState(profile.status === "published");
  const [togglePending, startToggle] = useTransition();

  function togglePublish() {
    const next = !published;
    setPublished(next);
    startToggle(() => setVendorPublished(profile.org_id, next));
  }

  return (
    <div className="space-y-6">
      {/* Publish status */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
        <div>
          <p className="text-sm font-medium text-ink">
            {published ? "Your listing is live" : "Your listing is a draft"}
          </p>
          <p className="mt-0.5 text-xs text-ink-soft/60">
            {published
              ? "Couples can find you in the directory."
              : "Only you can see it. Publish when you're ready."}
          </p>
        </div>
        <button
          type="button"
          onClick={togglePublish}
          disabled={togglePending}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${
            published
              ? "border border-stone-2 text-ink-soft hover:border-brand"
              : "bg-gradient-to-r from-brand to-brand-dark text-white"
          }`}
        >
          {published ? "Unpublish" : "Publish listing"}
        </button>
      </div>

      {/* Profile fields */}
      <form action={action} className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <input type="hidden" name="org_id" value={profile.org_id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Business name</span>
            <input required name="business_name" defaultValue={profile.business_name} disabled={pending} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Category</span>
            <input name="category" defaultValue={profile.category ?? ""} disabled={pending} placeholder="Florist, Photographer, Venue…" className={INPUT} />
          </label>
        </div>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-ink-soft">About your business</span>
          <textarea name="description" defaultValue={profile.description ?? ""} disabled={pending} rows={4}
            placeholder="Tell couples what makes you special…" className={`${INPUT} resize-y`} />
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">City</span>
            <input name="city" defaultValue={profile.city ?? ""} disabled={pending} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Region / state</span>
            <input name="region" defaultValue={profile.region ?? ""} disabled={pending} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Website</span>
            <input name="website" defaultValue={profile.website ?? ""} disabled={pending} placeholder="https://…" className={INPUT} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Contact email</span>
            <input type="email" name="email" defaultValue={profile.email ?? ""} disabled={pending} className={INPUT} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-soft">Phone</span>
            <input name="phone" defaultValue={profile.phone ?? ""} disabled={pending} className={INPUT} />
          </label>
        </div>

        {state.error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>
        )}
        {state.saved && (
          <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-800">Profile saved.</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white disabled:opacity-70"
        >
          {pending ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
