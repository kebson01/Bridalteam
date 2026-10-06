import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { INVITE_ROLES, isEmailish, normalizeEmail } from "@/lib/invite-roles";

/**
 * Creating and sending one wedding invite.
 *
 * Extracted so the team page and the onboarding step share an implementation
 * rather than two. They would have diverged immediately: the onboarding step
 * sends several at once and has to report per-person outcomes, which the
 * single-invite action never needed.
 *
 * ── Why this inserts instead of upserting ───────────────────────────────────
 * The team page used `.upsert(..., { onConflict: "wedding_id,email" })` with a
 * comment saying re-inviting the same email just refreshes the invite. It does
 * not. `wedding_invites` has RLS enabled with policies for INSERT, SELECT and
 * DELETE and **none for UPDATE**, so the moment ON CONFLICT takes the update
 * branch the row-level check fails and the whole call errors — which is to say
 * re-inviting anyone has been broken, and reported to the couple as "Couldn't
 * create the invite. Please try again."
 *
 * So: plain insert, and a unique violation (23505) is read for what it means —
 * this person already has a pending invite. Their existing token is fetched
 * (SELECT is permitted) and the email is re-sent, which is the behaviour the
 * original comment promised. Nothing is updated, so no policy is needed.
 */

export type InviteOutcome =
  | {
      ok: true;
      email: string;
      link: string;
      /**
       * Whether an email actually went out. False when the caller asked not to
       * send, when RESEND_API_KEY is unset, or when the send failed — the three
       * cases are the same to the couple, who has to share the link by hand.
       */
      emailed: boolean;
      /** They already had a pending invite; this returned that one rather than making a second. */
      resent: boolean;
    }
  | { ok: false; email: string; error: string };

async function inviteLinkFor(weddingId: string, email: string): Promise<string | null> {
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("wedding_invites")
    .select("token")
    .eq("wedding_id", weddingId)
    .eq("email", email)
    .maybeSingle();
  if (error || !data) {
    if (error) console.error("inviteLinkFor failed:", error.code, error.message);
    return null;
  }
  return `${SITE_URL}/invite/${data.token}`;
}

/** The couple's names, for the invitation copy. Falls back rather than failing. */
export async function coupleNameFor(weddingId: string): Promise<string> {
  const supabase = await supabaseServer();
  const { data } = await supabase
    .from("weddings")
    .select("partner_one, partner_two")
    .eq("id", weddingId)
    .maybeSingle();
  return [data?.partner_one, data?.partner_two].filter(Boolean).join(" & ") || "a couple";
}

/**
 * Creates the invite (or finds the existing one) and returns its join link,
 * emailing it only when asked to.
 *
 * ── Why sending is a decision and not a default ─────────────────────────────
 * This domain carries the transactional mail the product depends on: signup
 * confirmations and password resets. Its sending reputation has already been
 * put at risk once (M9 in SECURITY-AUDIT-MAIN.md), and those confirmations are
 * the first thing to land in spam when reputation goes.
 *
 * So the two callers differ deliberately. The team page sends: a couple already
 * inside the product, inviting one person at a time, is indistinguishable from
 * a human writing an email. The onboarding step does not: it is the first
 * minute of a stranger's account and can fan out to five addresses on one
 * click, which is the shape of traffic that costs a domain its reputation.
 * There it creates the invites and hands the couple the links to send
 * themselves.
 *
 * Flipping that back is one argument at the call site, so this is a posture,
 * not a limitation.
 *
 * Never throws: every caller is reporting a row in a list, and one bad address
 * must not take down the others.
 */
export async function createInvite(
  weddingId: string,
  rawEmail: string,
  role: string,
  opts: { send: boolean; coupleName?: string },
): Promise<InviteOutcome> {
  const email = normalizeEmail(rawEmail);

  if (!weddingId) return { ok: false, email, error: "Missing wedding." };
  if (!isEmailish(email)) return { ok: false, email, error: "That doesn't look like an email address." };
  if (!INVITE_ROLES.has(role)) return { ok: false, email, error: "Pick a role for this person." };

  const supabase = await supabaseServer();

  const { data: inserted, error } = await supabase
    .from("wedding_invites")
    .insert({ wedding_id: weddingId, email, role })
    .select("token")
    .single();

  let link: string | null = inserted ? `${SITE_URL}/invite/${inserted.token}` : null;
  let resent = false;

  if (error) {
    // 23505: unique_violation on (wedding_id, email) — already invited.
    if (error.code === "23505") {
      resent = true;
      link = await inviteLinkFor(weddingId, email);
    } else {
      console.error("createAndSendInvite insert failed:", error.code, error.message);
      return { ok: false, email, error: "Couldn't create the invite. Please try again." };
    }
  }

  if (!link) return { ok: false, email, error: "Couldn't create the invite. Please try again." };

  if (!opts.send) return { ok: true, email, link, emailed: false, resent };

  const couple = opts.coupleName ?? (await coupleNameFor(weddingId));
  const { sent } = await sendEmail({
    to: email,
    subject: `You're invited to help plan ${couple}'s wedding`,
    html: emailLayout(
      `You're invited to help plan ${couple}'s wedding`,
      `You've been invited to join <strong>${couple}</strong>'s wedding on Bridal Team. Click below to accept and start helping with the plan, budget and vendors.`,
      { label: "Accept the invitation", url: link },
    ),
  });

  return { ok: true, email, link, emailed: sent, resent };
}
