"use client";

import { useActionState, useState } from "react";
import { inviteByEmail, type InviteState } from "@/app/w/[id]/team/actions";

const ROLES: [string, string][] = [
  ["partner", "Partner"],
  ["maid_of_honor", "Maid of Honor"],
  ["matron_of_honor", "Matron of Honor"],
  ["best_man", "Best Man"],
  ["bridesmaid", "Bridesmaid"],
  ["groomsman", "Groomsman"],
  ["mother_of_bride", "Mother of the Bride"],
  ["father_of_bride", "Father of the Bride"],
  ["mother_of_groom", "Mother of the Groom"],
  ["father_of_groom", "Father of the Groom"],
  ["usher", "Usher"],
  ["junior_bridesmaid", "Junior Bridesmaid"],
  ["flower_girl", "Flower Girl"],
  ["ring_bearer", "Ring Bearer"],
  ["helper", "Helper"],
  ["planner", "Wedding planner"],
];

const field =
  "rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

export default function InvitePanel({ weddingId }: { weddingId: string }) {
  const [state, action, pending] = useActionState<InviteState, FormData>(inviteByEmail, {
    error: null,
    link: null,
    emailed: false,
  });
  const [copied, setCopied] = useState(false);

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <h2 className="text-lg font-medium text-ink">Invite your wedding party &amp; family</h2>
      <p className="mt-1 text-sm leading-relaxed text-ink-soft/75">
        Invite people by email with a role. They&rsquo;ll get a link to join and
        help with the plan.
      </p>

      <form action={action} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input type="hidden" name="wedding_id" value={weddingId} />
        <input
          name="email"
          type="email"
          required
          placeholder="their@email.com"
          disabled={pending}
          className={`${field} flex-1`}
        />
        <select name="role" defaultValue="maid_of_honor" disabled={pending} className={field}>
          {ROLES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send invite"}
        </button>
      </form>

      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.link && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">
            {state.emailed ? "Invitation emailed!" : "Invite created."}
          </p>
          <p className="mt-1 text-xs text-green-700">
            {state.emailed
              ? "They'll get an email with a link to join. You can also share this link directly:"
              : "Share this link with them to join (email sending isn't set up yet):"}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 truncate rounded-md bg-white px-3 py-2 text-xs text-ink-soft">
              {state.link}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(state.link!).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                });
              }}
              className="rounded-full border border-stone-2 bg-white px-4 py-2 text-xs font-semibold text-ink-soft hover:border-brand"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
