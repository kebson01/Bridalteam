"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addGuests,
  deleteGuest,
  sendInvites,
  updateGuest,
  sendReminders,
  type Guest,
} from "@/app/w/[id]/guests/actions";
import { canRemind, REMINDER_COOLDOWN_DAYS } from "@/lib/guests";

/** Attending / declined / waiting, as a small coloured chip. */
function Status({ g }: { g: Guest }) {
  if (!g.responded_at) {
    return (
      <span className="rounded-full bg-stone-4 px-2.5 py-1 text-xs font-medium text-ink-soft/70">
        {!g.invited_at
          ? "Not invited yet"
          : g.reminder_count > 0
            ? `Awaiting reply · ${g.reminder_count} reminder${g.reminder_count === 1 ? "" : "s"}`
            : "Awaiting reply"}
      </span>
    );
  }
  if (g.attending) {
    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-800">
        Coming{g.party_size ? ` · ${g.party_size}` : ""}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-stone-4 px-2.5 py-1 text-xs font-medium text-ink-soft">
      Can&rsquo;t make it
    </span>
  );
}

export default function GuestList({
  weddingId,
  initialGuests,
  loadFailed = false,
  siteUrl,
}: {
  weddingId: string;
  initialGuests: Guest[];
  loadFailed?: boolean;
  siteUrl: string;
}) {
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [raw, setRaw] = useState("");
  const [busy, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Head counts. `seats` is what was offered; `coming` is what they confirmed.
  const invited = guests.length;
  const seats = guests.reduce((s, g) => s + g.seats, 0);
  const replied = guests.filter((g) => g.responded_at).length;
  const coming = guests
    .filter((g) => g.responded_at && g.attending)
    .reduce((s, g) => s + (g.party_size ?? 1), 0);
  const awaiting = invited - replied;

  function refresh() {
    router.refresh();
  }

  function onAdd() {
    setMsg(null);
    start(async () => {
      const res = await addGuests(weddingId, raw);
      if (!res.ok) return setMsg({ text: res.error ?? "Couldn’t add those guests.", ok: false });
      setRaw("");
      setMsg({ text: `Added ${res.added} ${res.added === 1 ? "household" : "households"}.`, ok: true });
      refresh();
    });
  }

  function onSendAll() {
    setMsg(null);
    start(async () => {
      const res = await sendInvites(weddingId);
      setMsg({
        text: res.ok ? `Sent ${res.sent} invitation${res.sent === 1 ? "" : "s"}.` : res.error ?? "Couldn’t send.",
        ok: Boolean(res.ok),
      });
      refresh();
    });
  }

  function onRemindAll() {
    setMsg(null);
    start(async () => {
      const res = await sendReminders(weddingId);
      setMsg({
        text: res.ok ? `Sent ${res.sent} reminder${res.sent === 1 ? "" : "s"}.` : res.error ?? "Couldn't send.",
        ok: Boolean(res.ok),
      });
      refresh();
    });
  }

  function onRemindOne(id: string) {
    setMsg(null);
    start(async () => {
      const res = await sendReminders(weddingId, id);
      setMsg({ text: res.ok ? "Reminder sent." : res.error ?? "Couldn't send.", ok: Boolean(res.ok) });
      refresh();
    });
  }

  function onSendOne(id: string) {
    setMsg(null);
    start(async () => {
      const res = await sendInvites(weddingId, id);
      setMsg({ text: res.ok ? "Invitation sent." : res.error ?? "Couldn’t send.", ok: Boolean(res.ok) });
      refresh();
    });
  }

  function onRemove(g: Guest) {
    setMsg(null);
    // Optimistic: the row disappears immediately, and comes back on refresh if
    // the delete didn't land.
    setGuests((prev) => prev.filter((x) => x.id !== g.id));
    start(async () => {
      const res = await deleteGuest(weddingId, g.id);
      if (!res.ok) setMsg({ text: res.error ?? "Couldn’t remove that guest.", ok: false });
      refresh();
    });
  }

  function onSeats(g: Guest, seats: number) {
    start(async () => {
      await updateGuest(weddingId, g.id, { seats });
      refresh();
    });
  }

  async function copyLink(g: Guest) {
    await navigator.clipboard.writeText(`${siteUrl}/rsvp/${g.token}`);
    setCopied(g.id);
    setTimeout(() => setCopied(null), 1600);
  }

  const uninvitedWithEmail = guests.filter((g) => g.email && !g.invited_at).length;
  // Same rule the server enforces, so the button never promises a send that
  // the cooldown will refuse.
  const remindable = guests.filter((g) => canRemind(g)).length;

  return (
    <div className="space-y-6">
      {loadFailed && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          We couldn&rsquo;t load your guest list just now, so this may be incomplete. Please refresh.
        </p>
      )}

      {/* Counts */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Invited", String(invited), "households"],
          ["Seats offered", String(seats), "people"],
          ["Coming", String(coming), "confirmed"],
          ["Awaiting reply", String(awaiting), "households"],
        ].map(([label, value, sub]) => (
          <div key={label} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">{label}</p>
            <p className="mt-2 text-2xl font-light text-ink">{value}</p>
            <p className="text-xs text-ink-soft/50">{sub}</p>
          </div>
        ))}
      </div>

      {msg && (
        <p
          role="status"
          className={`rounded-lg px-4 py-3 text-sm ${
            msg.ok ? "bg-stone-4 text-ink-soft" : "border border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {msg.text}
        </p>
      )}

      {/* Add */}
      <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
        <h2 className="text-lg font-medium text-ink">Add guests</h2>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft/75">
          One household per line — the way you&rsquo;d address an envelope. Add an email so we can
          send their invitation, and a number if it&rsquo;s for more than one person.
        </p>
        <textarea
          rows={4}
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"Alex & Sam Smith, alex@example.com, 2\nThe Okafor family, okafor@example.com, 4\nDana Reyes, dana@example.com"}
          className="mt-4 w-full rounded-lg border border-stone-2 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-brand"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || !raw.trim()}
          className="mt-3 rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? "Working…" : "Add to list"}
        </button>
      </div>

      {/* The list */}
      <div className="rounded-2xl border border-stone-2 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-2 px-5 py-4">
          <h2 className="text-lg font-medium text-ink">Your guests</h2>
          <button
            type="button"
            onClick={onSendAll}
            disabled={busy || uninvitedWithEmail === 0}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            title={
              uninvitedWithEmail === 0
                ? "Everyone with an email address has already been invited"
                : undefined
            }
          >
            Send {uninvitedWithEmail > 0 ? `${uninvitedWithEmail} ` : ""}invitation
            {uninvitedWithEmail === 1 ? "" : "s"}
          </button>
          <button
            type="button"
            onClick={onRemindAll}
            disabled={busy || remindable === 0}
            className="rounded-full border border-stone-2 px-5 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50"
            title={
              remindable === 0
                ? `No one to remind — everyone has replied or was nudged in the last ${REMINDER_COOLDOWN_DAYS} days`
                : undefined
            }
          >
            Remind {remindable > 0 ? `${remindable} ` : ""}non-responder
            {remindable === 1 ? "" : "s"}
          </button>
        </div>

        {guests.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-ink-soft/60">
            {loadFailed
              ? "Couldn’t load your guest list."
              : "No guests yet. Add your first households above."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-2/60">
            {guests.map((g) => (
              <li key={g.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink">{g.household_name}</p>
                  <p className="truncate text-xs text-ink-soft/60">
                    {g.email ?? "No email — share their link by hand"}
                  </p>
                  {g.responded_at && (g.meal || g.note) && (
                    <p className="mt-1 truncate text-xs text-ink-soft/70">
                      {[g.meal, g.note].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                <label className="flex items-center gap-1.5 text-xs text-ink-soft/60">
                  Seats
                  <input
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={g.seats}
                    onBlur={(e) => {
                      const n = Number.parseInt(e.target.value, 10);
                      if (Number.isFinite(n) && n !== g.seats) onSeats(g, n);
                    }}
                    className="w-14 rounded border border-stone-2 px-2 py-1 text-sm text-ink outline-none focus:border-brand"
                  />
                </label>

                <Status g={g} />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyLink(g)}
                    className="rounded-full border border-stone-2 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand-text"
                  >
                    {copied === g.id ? "Copied!" : "Copy link"}
                  </button>
                  {g.email && (
                    <button
                      type="button"
                      onClick={() => onSendOne(g.id)}
                      disabled={busy}
                      className="rounded-full border border-stone-2 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-50"
                    >
                      {g.invited_at ? "Resend" : "Send invite"}
                    </button>
                  )}
                  {/* Only offered when the cooldown would actually let it
                      through, so the button can't be pressed into an error. */}
                  {canRemind(g) && (
                    <button
                      type="button"
                      onClick={() => onRemindOne(g.id)}
                      disabled={busy}
                      className="rounded-full border border-brand/40 px-3 py-1.5 text-xs font-semibold text-brand-text hover:border-brand disabled:opacity-50"
                    >
                      Remind
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemove(g)}
                    aria-label={`Remove ${g.household_name}`}
                    className="px-1 text-lg leading-none text-ink-soft/40 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
