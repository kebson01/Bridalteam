"use client";

import { useState, useTransition } from "react";
import {
  clearReply,
  recordReply,
  updateGuest,
  type Guest,
  type MenuOption,
} from "@/app/w/[id]/guests/actions";

/**
 * Editing one household: their details, and their reply.
 *
 * The reply half exists because guests answer by phone, by text, or in person
 * far more often than product design tends to assume, and the couple shouldn't
 * have to ask them to go and find the email. It writes through the same RPC the
 * guest's own form uses, so both routes get identical validation.
 */
export default function GuestEditor({
  weddingId,
  guest,
  menu,
  onDone,
}: {
  weddingId: string;
  guest: Guest;
  menu: MenuOption[];
  onDone: () => void;
}) {
  const [name, setName] = useState(guest.household_name);
  const [email, setEmail] = useState(guest.email ?? "");
  const [seats, setSeats] = useState(guest.seats);

  const [attending, setAttending] = useState<boolean | null>(
    guest.responded_at ? guest.attending : null,
  );
  const [people, setPeople] = useState<{ name: string; dish: string }[]>(() =>
    guest.attendees.length > 0
      ? guest.attendees.map((a) => ({
          name: a.name ?? "",
          dish: menu.find((m) => m.name === a.dish)?.id ?? "",
        }))
      : Array.from({ length: guest.seats }, () => ({ name: "", dish: "" })),
  );
  const [dietary, setDietary] = useState(guest.dietary ?? guest.meal ?? "");
  const [note, setNote] = useState(guest.note ?? "");

  const [busy, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function setPerson(i: number, patch: Partial<{ name: string; dish: string }>) {
    setPeople((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function save() {
    setError(null);
    start(async () => {
      const d = await updateGuest(weddingId, guest.id, {
        household_name: name,
        email,
        seats,
      });
      if (!d.ok) return setError(d.error ?? "Couldn’t save those details.");

      // Only touch the reply if one is being stated — otherwise editing a name
      // would silently mark an unanswered household as replied.
      if (attending !== null) {
        const r = await recordReply(weddingId, guest.id, {
          attending,
          attendees: people.slice(0, seats),
          dietary,
          note,
        });
        if (!r.ok) return setError(r.error ?? "Couldn’t save that reply.");
      }
      onDone();
    });
  }

  function clear() {
    setError(null);
    start(async () => {
      const res = await clearReply(weddingId, guest.id);
      if (!res.ok) return setError(res.error ?? "Couldn’t clear that reply.");
      onDone();
    });
  }

  const field =
    "mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand";

  return (
    <div className="rounded-xl border border-brand/30 bg-brand/[0.04] p-4">
      <div className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
        <label className="block text-xs font-medium text-ink-soft">
          Household
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} />
        </label>
        <label className="block text-xs font-medium text-ink-soft">
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Optional"
            className={field}
          />
        </label>
        <label className="block text-xs font-medium text-ink-soft">
          Seats
          <input
            type="number"
            min={1}
            max={20}
            value={seats}
            onChange={(e) => setSeats(Math.min(Math.max(Number(e.target.value) || 1, 1), 20))}
            className={`${field} w-20`}
          />
        </label>
      </div>

      <div className="mt-4 border-t border-stone-2/70 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/60">
          Their reply
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            [true, "Coming"],
            [false, "Can't make it"],
          ].map(([v, label]) => (
            <button
              key={String(v)}
              type="button"
              onClick={() => setAttending(v as boolean)}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-colors ${
                attending === v
                  ? "border-brand bg-brand text-white"
                  : "border-stone-2 text-ink-soft hover:border-brand"
              }`}
            >
              {label as string}
            </button>
          ))}
          {guest.responded_at && (
            <button
              type="button"
              onClick={clear}
              disabled={busy}
              className="rounded-full border border-stone-2 px-4 py-1.5 text-xs font-semibold text-ink-soft hover:border-red-300 hover:text-red-700 disabled:opacity-50"
            >
              Clear reply
            </button>
          )}
        </div>

        {attending === true && (
          <>
            <div className="mt-3 space-y-2">
              {people.slice(0, seats).map((p, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    value={p.name}
                    onChange={(e) => setPerson(i, { name: e.target.value })}
                    placeholder={`Guest ${i + 1}`}
                    className="min-w-0 flex-1 rounded-lg border border-stone-2 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
                  />
                  {menu.length > 0 && (
                    <select
                      value={p.dish}
                      onChange={(e) => setPerson(i, { dish: e.target.value })}
                      className="rounded-lg border border-stone-2 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
                    >
                      <option value="">No dish</option>
                      {menu.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {people.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setPeople((prev) => prev.filter((_, idx) => idx !== i))}
                      aria-label={`Remove guest ${i + 1}`}
                      className="px-1 text-lg leading-none text-ink-soft/40 hover:text-red-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              {people.length < seats && (
                <button
                  type="button"
                  onClick={() => setPeople((p) => [...p, { name: "", dish: "" }])}
                  className="text-xs font-semibold text-brand-text hover:underline"
                >
                  + Add someone
                </button>
              )}
            </div>

            <input
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="Allergies or dietary needs"
              className="mt-3 w-full rounded-lg border border-stone-2 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
            />
          </>
        )}

        {attending !== null && (
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note from them (optional)"
            className="mt-2 w-full rounded-lg border border-stone-2 px-3 py-1.5 text-sm text-ink outline-none focus:border-brand"
          />
        )}
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800">{error}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={busy}
          className="rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
