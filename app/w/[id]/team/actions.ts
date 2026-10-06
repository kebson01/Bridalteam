"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { createAndSendInvite } from "@/lib/invites";

export type InviteState = { error: string | null; link: string | null; emailed: boolean };

/**
 * Invites one person to the wedding by email.
 *
 * The create-and-send logic lives in lib/invites.ts so this and the onboarding
 * step cannot drift apart. That move also fixed re-inviting: this action used
 * to upsert on (wedding_id, email), and `wedding_invites` has no UPDATE policy,
 * so the conflict branch failed RLS and every re-invite was reported to the
 * couple as "Couldn't create the invite."
 *
 * The link is returned whether or not the email sent, because RESEND_API_KEY
 * may not be configured and the couple can always share it by hand.
 */
export async function inviteByEmail(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const weddingId = String(formData.get("wedding_id") ?? "");
  const outcome = await createAndSendInvite(
    weddingId,
    String(formData.get("email") ?? ""),
    String(formData.get("role") ?? "helper"),
  );

  if (!outcome.ok) return { error: outcome.error, link: null, emailed: false };

  revalidatePath(`/w/${weddingId}/team`);
  return { error: null, link: outcome.link, emailed: outcome.emailed };
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
