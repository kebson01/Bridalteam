"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

const INVITE_ROLES = new Set([
  "partner", "maid_of_honor", "matron_of_honor", "best_man",
  "mother_of_bride", "father_of_bride", "mother_of_groom", "father_of_groom",
  "groomsman", "bridesmaid", "usher", "junior_bridesmaid", "flower_girl",
  "ring_bearer", "helper", "planner", "planner_staff",
]);

export type InviteState = { error: string | null; link: string | null; emailed: boolean };

/**
 * Invites someone to the wedding by email. Creates an invite record, emails a
 * join link (if RESEND_API_KEY is configured), and always returns the link so
 * the couple can share it manually even before auto-email is set up.
 */
export async function inviteByEmail(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const weddingId = String(formData.get("wedding_id") ?? "");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "helper");

  if (!weddingId) return { error: "Missing wedding.", link: null, emailed: false };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
    return { error: "Enter a valid email address.", link: null, emailed: false };
  if (!INVITE_ROLES.has(role))
    return { error: "Pick a role for this person.", link: null, emailed: false };

  const supabase = await supabaseServer();

  // Upsert so re-inviting the same email just refreshes the invite.
  const { data: invite, error } = await supabase
    .from("wedding_invites")
    .upsert(
      { wedding_id: weddingId, email, role, expires_at: new Date(Date.now() + 30 * 864e5).toISOString() },
      { onConflict: "wedding_id,email" },
    )
    .select("token")
    .single();

  if (error || !invite) {
    console.error("inviteByEmail failed:", error?.code, error?.message);
    return { error: "Couldn't create the invite. Please try again.", link: null, emailed: false };
  }

  // Wedding name for the email copy.
  const { data: wedding } = await supabase
    .from("weddings")
    .select("partner_one, partner_two")
    .eq("id", weddingId)
    .maybeSingle();
  const couple =
    [wedding?.partner_one, wedding?.partner_two].filter(Boolean).join(" & ") || "a couple";

  const link = `${SITE_URL}/invite/${invite.token}`;

  const { sent } = await sendEmail({
    to: email,
    subject: `You're invited to help plan ${couple}'s wedding`,
    html: emailLayout(
      `You're invited to help plan ${couple}'s wedding`,
      `You've been invited to join <strong>${couple}</strong>'s wedding on Bridal Team. Click below to accept and start helping with the plan, budget and vendors.`,
      { label: "Accept the invitation", url: link },
    ),
  });

  revalidatePath(`/w/${weddingId}/team`);
  return { error: null, link, emailed: sent };
}

export async function revokeInvite(weddingId: string, inviteId: string) {
  if (!weddingId || !inviteId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("wedding_invites").delete().eq("id", inviteId);
  if (error) console.error("revokeInvite failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}/team`);
}

/** Generates (or rotates) the connect code a couple shares with their planner. */
export async function generateConnectCode(weddingId: string): Promise<string | null> {
  if (!weddingId) return null;
  const supabase = await supabaseServer();
  const { data, error } = await supabase.rpc("generate_connect_code", { p_wedding_id: weddingId });
  if (error) {
    console.error("generateConnectCode failed:", error.code, error.message);
    return null;
  }
  revalidatePath(`/w/${weddingId}/team`);
  return data as string;
}

/** Removes a member (or lets someone remove themselves) from the wedding. */
export async function removeMember(weddingId: string, memberId: string) {
  if (!weddingId || !memberId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase.from("wedding_members").delete().eq("id", memberId);
  if (error) console.error("removeMember failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}/team`);
}
