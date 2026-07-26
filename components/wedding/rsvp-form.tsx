"use client";

import { useState, useTransition } from "react";
import { submitRsvp } from "@/app/wedding/actions";

export default function RsvpForm({ slug }: { slug: string }) {
  const [name, setName] = useState("");
  const [attending, setAttending] = useState<boolean | null>(null);
  const [partySize, setPartySize] = useState(1);
  const [meal, setMeal] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (attending === null) {
      setError("Let us know if you can make it.");
      return;
    }
    start(async () => {
      const res = await submitRsvp({
        slug,
        name,
        attending,
        partySize: attending ? partySize : 1,
        meal: attending ? meal : "",
        note,
      });
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      setDone(true);
    });
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m20 6-11 11-5-5" />
          </svg>
        </div>
        <h3 className="mt-4 font-display text-xl font-semibold text-ink">Thank you!</h3>
        <p className="mt-1 text-sm text-ink-soft/70">
          {attending ? "We can't wait to celebrate with you." : "We'll miss you — thank you for letting us know."}
        </p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand";

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h3 className="font-display text-xl font-semibold text-ink">RSVP</h3>
      <p className="mt-1 text-sm text-ink-soft/70">We'd love to know if you can join us.</p>

      <div className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Your name
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" maxLength={120} className={inputCls} />
        </div>

        <div>
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            Will you attend?
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAttending(true)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                attending === true ? "border-brand bg-brand text-white" : "border-stone-2 text-ink-soft hover:border-brand"
              }`}
            >
              Joyfully accepts
            </button>
            <button
              type="button"
              onClick={() => setAttending(false)}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${
                attending === false ? "border-ink bg-ink text-white" : "border-stone-2 text-ink-soft hover:border-brand"
              }`}
            >
              Regretfully declines
            </button>
          </div>
        </div>

        {attending && (
          <>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                Number in your party
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={partySize}
                onChange={(e) => setPartySize(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
                Meal preference (optional)
              </label>
              <input value={meal} onChange={(e) => setMeal(e.target.value)} placeholder="e.g. Vegetarian" maxLength={80} className={inputCls} />
            </div>
          </>
        )}

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
            A note for the couple (optional)
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={`${inputCls} resize-none`} />
        </div>

        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_-12px_rgba(243,103,5,0.85)] disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send RSVP"}
        </button>
      </div>
    </div>
  );
}
