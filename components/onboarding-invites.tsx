"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  inviteTeam,
  EMPTY_INVITE_TEAM_STATE,
  type InviteTeamState,
} from "@/app/onboarding/invite/actions";
import {
  FIRST_INVITE_ROLES,
  INVITE_ROLE_LABELS,
  MAX_INVITES_PER_SUBMIT,
} from "@/lib/invite-roles";

const field =
  "w-full rounded-lg border border-stone-2 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand disabled:opacity-60";

/**
 * Step two of signup: invite the wedding party.
 *
 * Why this is a step and not a card on the workspace: one wedding already
 * contains ten to twenty people, and the product is called Team. Every
 * bridesmaid who joins is a future bride, which is how a wedding product
 * replaces users who by definition churn the day after the wedding. Left on a
 * tab inside the workspace, that loop depends on someone going looking for it.
 *
 * Three rows, pre-labelled with the people a couple can name without thinking.
 * Skipping is a plain, visible link rather than a greyed-out afterthought: a
 * couple who feels trapped here abandons setup altogether, and they can invite
 * anyone later from the team page.
 */
export default function OnboardingInvites({
  weddingId,
  skipHref,
}: {
  weddingId: string;
  skipHref: string;
}) {
  const [state, action, pending] = useActionState<InviteTeamState, FormData>(
    inviteTeam,
    EMPTY_INVITE_TEAM_STATE,
  );
  const [rows, setRows] = useState<number>(FIRST_INVITE_ROLES.length);
  const [copied, setCopied] = useState<string | null>(null);

  const sent = state.outcomes.filter((o) => o.ok);
  const failed = state.outcomes.filter((o) => !o.ok);

  // Something was sent: show what happened rather than bouncing them onward.
  // The links matter — with no RESEND_API_KEY configured nothing is emailed,
  // and silently "succeeding" would leave the couple believing invitations
  // went out that never did.
  if (state.submitted && state.outcomes.length > 0) {
    return (
      <div className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card">
        <h2 className="text-lg font-medium text-ink">
          {sent.length > 0
            ? `${sent.length} ${sent.length === 1 ? "invitation" : "invitations"} ready`
            : "We couldn't send those"}
        </h2>

        {sent.length > 0 && (
          <ul className="mt-4 space-y-3">
            {sent.map((o) => (
              <li key={o.email} className="rounded-xl border border-stone-2 px-4 py-3">
                <p className="text-sm font-medium text-ink">{o.email}</p>
                <p className="mt-0.5 text-xs text-ink-soft/70">
                  {o.emailed
                    ? o.resent
                      ? "Already invited — we sent the invitation again."
                      : "Invitation emailed."
                    : "Not emailed — share this link with them yourself."}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-stone-4 px-2 py-1 text-xs text-ink-soft">
                    {o.link}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(o.link).then(
                        () => setCopied(o.email),
                        () => setCopied(null),
                      );
                    }}
                    className="shrink-0 rounded-full border border-stone-2 px-3 py-1 text-xs font-medium text-ink-soft hover:border-brand hover:text-brand-text"
                  >
                    {copied === o.email ? "Copied" : "Copy"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {failed.length > 0 && (
          <ul className="mt-4 space-y-2">
            {failed.map((o) => (
              <li
                key={o.email}
                className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700"
              >
                <strong className="font-medium">{o.email || "That row"}</strong> — {o.error}
              </li>
            ))}
          </ul>
        )}

        <Link
          href={skipHref}
          className="mt-6 inline-flex w-full justify-center rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
        >
          Go to my plan
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-stone-2 bg-white p-8 shadow-card">
      <input type="hidden" name="wedding_id" value={weddingId} />

      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[1.4fr_1fr]">
            <label className="block">
              <span className="sr-only">Email address for person {i + 1}</span>
              <input
                name={`email_${i}`}
                type="email"
                disabled={pending}
                placeholder="their@email.com"
                className={field}
              />
            </label>
            <label className="block">
              <span className="sr-only">Role for person {i + 1}</span>
              <select
                name={`role_${i}`}
                defaultValue={FIRST_INVITE_ROLES[i] ?? "bridesmaid"}
                disabled={pending}
                className={field}
              >
                {INVITE_ROLE_LABELS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ))}
      </div>

      {rows < MAX_INVITES_PER_SUBMIT && (
        <button
          type="button"
          onClick={() => setRows((n) => Math.min(n + 1, MAX_INVITES_PER_SUBMIT))}
          className="mt-3 text-sm font-medium text-brand-text hover:underline"
        >
          + Add another
        </button>
      )}

      {state.error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {/* Submitted with every row blank. Treated as a skip, and said plainly,
          rather than an error for not filling in an optional step. */}
      {state.submitted && state.outcomes.length === 0 && !state.error && (
        <p className="mt-4 rounded-lg bg-stone-4 px-4 py-3 text-sm text-ink-soft/80">
          No addresses yet — no problem. You can invite your team any time from
          the Team tab.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70"
      >
        {pending ? "Sending…" : "Send invitations"}
      </button>

      <Link
        href={skipHref}
        className="mt-4 block text-center text-sm font-medium text-ink-soft/75 hover:text-brand-text"
      >
        Skip for now
      </Link>
    </form>
  );
}
