"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import type { GuestInvite } from "@/app/rsvp/[token]/page";

/**
 * The guest's reply.
 *
 * Calls submit_guest_rsvp directly from the browser with the anon key. That's
 * safe because the function is SECURITY DEFINER, keyed by the token, and can
 * only ever touch the one household the token belongs to — and because guests
 * have no account, there's no session for a server action to use anyway. The
 * database clamps the head count to the seats offered, so a tampered form can't
 * add people.
 */
export default function GuestRsvpForm({
  token,
  invite,
}: {
  token: string;
  invite: GuestInvite;
}) {
  const alreadyReplied = Boolean(invite.responded_at);

  const [attending, setAttending] = useState<boolean | null>(
    alreadyReplied ? invite.attending : null,
  );
  const [partySize, setPartySize] = useState<number>(
    invite.party_size && invite.party_size > 0 ? invite.party_size : invite.seats,
  );
  const [meal, setMeal] = useState(invite.meal ?? "");
  const [note, setNote] = useState(invite.note ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(alreadyReplied);
  const [editing, setEditing] = useState(!alreadyReplied);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (attending === null) {
      setError("Please let us know if you can make it.");
      return;
    }
    setBusy(true);
    setError(null);

    const { error: err } = await supabaseBrowser().rpc("submit_guest_rsvp", {
      p_token: token,
      p_attending: attending,
      p_party_size: attending ? partySize : 0,
      p_meal: meal,
      p_note: note,
    });

    setBusy(false);
    if (err) {
      console.error("submit_guest_rsvp failed:", err.code, err.message);
      setError("Something went wrong sending your reply. Please try again.");
      return;
    }
    setDone(true);
    setEditing(false);
  }

  if (done && !editing) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 text-center shadow-card">
        <h2 className="text-xl font-medium text-ink">
          {attending ? "Thank you — see you there!" : "Thank you for letting us know."}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft/75">
          {attending
            ? `We've got you down for ${partySize} ${partySize === 1 ? "person" : "people"}.`
            : "We're sorry you can't make it — you'll be missed."}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-5 rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text"
        >
          Change my reply
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card">
      <h2 className="text-xl font-medium text-ink">{invite.household_name}</h2>
      <p className="mt-1 text-sm text-ink-soft/75">
        {invite.seats > 1
          ? `Your invitation is for ${invite.seats} people.`
          : "Your invitation is for one."}
      </p>

      <div className="mt-6 flex gap-3">
        {[
          [true, "Joyfully accepts"],
          [false, "Regretfully declines"],
        ].map(([value, label]) => (
          <button
            key={String(value)}
            type="button"
            onClick={() => setAttending(value as boolean)}
            className={`flex-1 rounded-full border px-4 py-3 text-sm font-semibold transition-colors ${
              attending === value
                ? "border-brand bg-brand text-white"
                : "border-stone-2 text-ink-soft hover:border-brand"
            }`}
          >
            {label as string}
          </button>
        ))}
      </div>

      {attending === true && (
        <>
          {/* Only a household with more than one seat has a number to choose.
              The options stop at the seats offered, so a guest can say fewer are
              coming but never more — the database clamps to the same ceiling, so
              a tampered form can't add people either. Each option spells out
              "2 of 4" rather than a bare "2", so the cap is legible in the
              control itself and not just in the line above it. */}
          {invite.seats > 1 && (
            <label className="mt-6 block text-sm font-medium text-ink-soft">
              How many of you are coming?
              <select
                value={partySize}
                onChange={(e) => setPartySize(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
              >
                {Array.from({ length: invite.seats }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} of {invite.seats} {n === 1 ? "person" : "people"}
                  </option>
                ))}
              </select>
              <span className="mt-1.5 block text-xs font-normal text-ink-soft/60">
                {partySize < invite.seats
                  ? `We'll let them know ${invite.seats - partySize} of you can't make it.`
                  : "Let us know if fewer of you can make it — just pick a smaller number."}
              </span>
            </label>
          )}

          <label className="mt-5 block text-sm font-medium text-ink-soft">
            Any dietary needs?
            <input
              value={meal}
              onChange={(e) => setMeal(e.target.value)}
              placeholder="e.g. Vegetarian, nut allergy"
              className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
            />
          </label>
        </>
      )}

      <label className="mt-5 block text-sm font-medium text-ink-soft">
        A note for the couple
        <textarea
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional"
          className="mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
        />
      </label>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-7 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {busy ? "Sending…" : alreadyReplied ? "Update my reply" : "Send my reply"}
      </button>
    </form>
  );
}
