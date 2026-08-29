"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateWeddingDetails, type DetailsInput } from "@/app/w/[id]/details/actions";

export interface WeddingDetails {
  id: string;
  partner_one: string | null;
  partner_two: string | null;
  event_date: string | null;
  city: string | null;
  region: string | null;
  venue: string | null;
  guest_count: number | null;
  budget_cents: number | null;
  style: string | null;
  notes: string | null;
}

const field =
  "mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand";
const labelCls = "block text-sm font-medium text-ink-soft";

export default function DetailsForm({
  wedding,
  datedTaskCount,
}: {
  wedding: WeddingDetails;
  /** How many deadlines would move if the date changes — drives the opt-in below. */
  datedTaskCount: number;
}) {
  const router = useRouter();
  const originalDate = wedding.event_date ?? "";

  const [form, setForm] = useState({
    partnerOne: wedding.partner_one ?? "",
    partnerTwo: wedding.partner_two ?? "",
    eventDate: originalDate,
    city: wedding.city ?? "",
    region: wedding.region ?? "",
    venue: wedding.venue ?? "",
    guestCount: wedding.guest_count != null ? String(wedding.guest_count) : "",
    budgetDollars: wedding.budget_cents != null ? String(wedding.budget_cents / 100) : "",
    style: wedding.style ?? "",
    notes: wedding.notes ?? "",
  });
  const [shiftDeadlines, setShiftDeadlines] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const dateChanged = form.eventDate !== originalDate && form.eventDate !== "" && originalDate !== "";
  const daysMoved = dateChanged
    ? Math.round(
        (Date.parse(`${form.eventDate}T00:00:00Z`) - Date.parse(`${originalDate}T00:00:00Z`)) / 86_400_000,
      )
    : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setFlash(null);

    const payload: DetailsInput = { ...form, shiftDeadlines: shiftDeadlines && dateChanged };
    const res = await updateWeddingDetails(wedding.id, payload);

    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't save those changes.");
      return;
    }
    // Saved, but the deadline shift failed — surface that rather than a clean
    // "Saved." that would hide stale dates.
    if (res.error) {
      setError(res.error);
      router.refresh();
      return;
    }
    const days = Math.abs(res.daysMoved ?? 0);
    setFlash(
      res.shifted
        ? `Saved. ${res.shifted} deadline${res.shifted === 1 ? "" : "s"} moved by ${days} day${days === 1 ? "" : "s"}.`
        : "Saved.",
    );
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelCls}>
          Your name
          <input className={field} value={form.partnerOne} onChange={set("partnerOne")} placeholder="Alex" />
        </label>
        <label className={labelCls}>
          Partner&rsquo;s name
          <input className={field} value={form.partnerTwo} onChange={set("partnerTwo")} placeholder="Sam" />
        </label>

        <label className={labelCls}>
          Wedding date
          <input type="date" className={field} value={form.eventDate} onChange={set("eventDate")} />
        </label>
        <label className={labelCls}>
          Venue
          <input className={field} value={form.venue} onChange={set("venue")} placeholder="The Grove" />
        </label>

        <label className={labelCls}>
          City
          <input className={field} value={form.city} onChange={set("city")} placeholder="Coral Springs" />
        </label>
        <label className={labelCls}>
          State or region
          <input className={field} value={form.region} onChange={set("region")} placeholder="FL" />
        </label>

        <label className={labelCls}>
          Guests (roughly)
          <input inputMode="numeric" className={field} value={form.guestCount} onChange={set("guestCount")} placeholder="150" />
        </label>
        <label className={labelCls}>
          Budget (USD)
          <input inputMode="decimal" className={field} value={form.budgetDollars} onChange={set("budgetDollars")} placeholder="35000" />
        </label>
      </div>

      <label className={`${labelCls} mt-5`}>
        Style or vibe
        <input className={field} value={form.style} onChange={set("style")} placeholder="Rustic autumn, candlelight, vineyard" />
      </label>

      <label className={`${labelCls} mt-5`}>
        Notes
        <textarea rows={3} className={field} value={form.notes} onChange={set("notes")} placeholder="Anything else worth remembering" />
      </label>

      {/* Only offered when it would actually do something: the date moved, and
          there are dated tasks to move with it. */}
      {dateChanged && datedTaskCount > 0 && (
        <div className="mt-5 rounded-lg border border-brand/30 bg-brand/[0.06] px-4 py-3">
          <label className="flex items-start gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={shiftDeadlines}
              onChange={(e) => setShiftDeadlines(e.target.checked)}
              className="mt-0.5 h-4 w-4 flex-none accent-[var(--color-brand)]"
            />
            <span>
              You&rsquo;re moving the wedding{" "}
              <b className="text-ink">
                {Math.abs(daysMoved)} day{Math.abs(daysMoved) === 1 ? "" : "s"} {daysMoved > 0 ? "later" : "earlier"}
              </b>
              . Also move your {datedTaskCount} existing deadline
              {datedTaskCount === 1 ? "" : "s"} by the same amount, so they stay the right distance
              from the day. Untick to leave them exactly where they are.
            </span>
          </label>
        </div>
      )}

      {error && (
        <p className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
      )}
      {flash && (
        <p className="mt-5 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft">{flash}</p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
