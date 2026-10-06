"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { coupleNameFor, createAndSendInvite, type InviteOutcome } from "@/lib/invites";
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
 * Sends the first batch of wedding-party invites, from the onboarding step.
 *
 * Reports per person rather than failing as a unit. One mistyped address among
 * four must not discard the other three — at this point in the flow the couple
 * has just typed them from memory and would have to recall them all again.
 *
 * Capped at MAX_INVITES_PER_SUBMIT. That is partly interface (more rows than
 * this is a guest list, not a wedding party, and the guest list has its own
 * import) and partly deliverability: this domain carries transactional mail
 * whose reputation was already put at risk once by a burst of automated sends
 * (M9 in SECURITY-AUDIT-MAIN.md), so a single click cannot fan out further
 * than a person plausibly would.
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

  // Looked up once and passed down, rather than re-queried per invite.
  const couple = await coupleNameFor(weddingId);

  // Sequential on purpose. These are a handful of emails through one provider,
  // and firing them in parallel buys milliseconds while making a rate-limit
  // response from Resend hit every row at once instead of one.
  const outcomes: InviteOutcome[] = [];
  for (const row of rows) {
    outcomes.push(await createAndSendInvite(weddingId, row.email, row.role, couple));
  }

  return { error: null, outcomes, submitted: true };
}
