"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface MenuChoice {
  id: string;
  name: string;
  description: string | null;
}

export interface RsvpContext {
  household: {
    name: string;
    seats: number;
    responded_at: string | null;
    attending: boolean | null;
    party_size: number | null;
    dietary: string | null;
    note: string | null;
  };
  menu: MenuChoice[];
  attendees: { name: string | null; menu_option_id: string | null }[];
}

type Person = { name: string; dish: string };

/**
 * The guest's reply.
 *
 * Calls submit_guest_rsvp from the browser with the anon key. That's safe
 * because the function is SECURITY DEFINER, keyed by the token, and can only
 * touch the one household it belongs to — and guests have no account, so
 * there's no session for a server action to use. The database independently
 * caps the party at the seats offered and ignores any dish that isn't on this
 * wedding's menu, so a tampered form can't add people or invent a meal.
 */
export default function GuestRsvpForm({
  token,
  ctx,
}: {
  token: string;
  ctx: RsvpContext;
}) {
  const { household, menu, attendees } = ctx;
  const alreadyReplied = Boolean(household.responded_at);
  const hasMenu = menu.length > 0;

  const [attending, setAttending] = useState<boolean | null>(
    alreadyReplied ? household.attending : null,
  );

  // One row per person coming. Seeded from a previous reply if there is one,
  // otherwise a full house — most invitations are accepted in full, and it's
  // easier to remove a row than to add several.
  const [people, setPeople] = useState<Person[]>(() => {
    if (attendees.length > 0) {
      return attendees.map((a) => ({ name: a.name ?? "", dish: a.menu_option_id ?? "" }));
    }
    return Array.from({ length: household.seats }, () => ({ name: "", dish: "" }));
  });

  const [dietary, setDietary] = useState(household.dietary ?? "");
  const [note, setNote] = useState(household.note ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(alreadyReplied);
  const [editing, setEditing] = useState(!alreadyReplied);
  const [error, setError] = useState<string | null>(null);

  function setPerson(i: number, patch: Partial<Person>) {
    setPeople((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (attending === null) {
      setError("Please let us know if you can make it.");
      return;
    }
    if (attending && people.length === 0) {
      setError("Add at least one person, or let us know you can't make it.");
      return;
    }
    setBusy(true);
    setError(null);

    const { error: err } = await supabaseBrowser().rpc("submit_guest_rsvp", {
      p_token: token,
      p_attending: attending,
      p_attendees: attending
        ? people.map((p) => ({ name: p.name.trim() || null, menu_option_id: p.dish || null }))
        : [],
      p_dietary: dietary,
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
            ? `We've got you down for ${people.length} ${people.length === 1 ? "person" : "people"}.`
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
      <h2 className="text-xl font-medium text-ink">{household.name}</h2>
      <p className="mt-1 text-sm text-ink-soft/75">
        {household.seats > 1
          ? `Your invitation is for ${household.seats} people.`
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
          <div className="mt-7">
            <div className="flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-ink">
                Who&rsquo;s coming{household.seats > 1 ? ` — ${people.length} of ${household.seats}` : ""}
              </h3>
              {household.seats > 1 && people.length < household.seats && (
                <button
                  type="button"
                  onClick={() => setPeople((p) => [...p, { name: "", dish: "" }])}
                  className="text-xs font-semibold text-brand-text hover:underline"
                >
                  + Add someone
                </button>
              )}
            </div>

            <div className="mt-3 space-y-3">
              {people.map((p, i) => (
                <div key={i} className="rounded-xl border border-stone-2 p-3">
                  <div className="flex items-center gap-2">
                    <input
                      value={p.name}
                      onChange={(e) => setPerson(i, { name: e.target.value })}
                      placeholder={i === 0 ? "Your name" : `Guest ${i + 1}`}
                      className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                    />
                    {/* Removing a row is how you say fewer are coming. Never
                        below one — that's what "declines" is for. */}
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

                  {hasMenu && (
                    <select
                      value={p.dish}
                      onChange={(e) => setPerson(i, { dish: e.target.value })}
                      className="mt-2 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand"
                    >
                      <option value="">Choose a dish…</option>
                      {menu.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                          {m.description ? ` — ${m.description}` : ""}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            {household.seats > 1 && (
              <p className="mt-2 text-xs text-ink-soft/60">
                {people.length < household.seats
                  ? `We'll let them know ${household.seats - people.length} of you can't make it.`
                  : "Remove anyone who can't make it — you can't add more than you were invited for."}
              </p>
            )}
          </div>

          <label className="mt-6 block text-sm font-medium text-ink-soft">
            Any allergies or dietary needs?
            <input
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="e.g. nut allergy for Chidi"
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
