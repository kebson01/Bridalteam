"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { createInvite, type InviteOutcome } from "@/lib/invites";
import { parseInviteRows } from "@/lib/invite-roles";

export type InviteTeamState = {
  /** A problem with the submission as a whole, not with one row. */
  error: string | null;
  /** Per-person results, in the order submitted. Empty until something is sent. */
  outcomes: InviteOutcome[];
  /** True once a submit has been processed, even if every row was blank. */
  submitted: boolean;
};

export const EMPTY_INVITE_TEAM_STATE: InviteTeamState = {
  error: null,
  outcomes: [],
  submitted: false,
};

/**
 * Creates the first batch of wedding-party invites, from the onboarding step.
 *
 * **Deliberately sends nothing.** It mints the invites and hands the couple
 * their join links to share themselves. This is the first minute of a
 * stranger's account and one click could fan out to five addresses, which is
 * the shape of traffic that costs a domain its sending reputation — and this
 * domain carries the signup confirmations and password resets the product
 * depends on. The team page, where a couple invites one person at a time from
 * inside the product, does send. See lib/invites.ts.
 *
 * Reports per person rather than failing as a unit. One mistyped address among
 * four must not discard the other three — at this point in the flow the couple
 * has just typed them from memory and would have to recall them all again.
 *
 * Capped at MAX_INVITES_PER_SUBMIT: more rows than that is a guest list, not a
 * wedding party, and the guest list has its own import.
 */
export async function inviteTeam(
  _prev: InviteTeamState,
  formData: FormData,
): Promise<InviteTeamState> {
  const weddingId = String(formData.get("wedding_id") ?? "");
  if (!weddingId) return { error: "Missing wedding.", outcomes: [], submitted: true };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You need to be signed in.", outcomes: [], submitted: true };

  // Row parsing — blank-skipping, de-duplication, dropping the caller's own
  // address and the cap — lives in parseInviteRows so each of those rules can
  // be tested rather than only described.
  const rows = parseInviteRows((key) => formData.get(key), user.email);

  if (rows.length === 0) return { error: null, outcomes: [], submitted: true };

  // Sequential. Nothing is emailed here, so this is only a handful of inserts —
  // but keeping them ordered means the results list reads back in the order the
  // couple typed, which is how they will check it.
  const outcomes: InviteOutcome[] = [];
  for (const row of rows) {
    outcomes.push(await createInvite(weddingId, row.email, row.role, { send: false }));
  }

  return { error: null, outcomes, submitted: true };
}
