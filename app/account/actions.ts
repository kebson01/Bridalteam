"use server";

import { supabaseServer } from "@/lib/supabase/server";

/**
 * Permanently deletes the signed-in user's account.
 *
 * Delegates to the delete_my_account() RPC, which is atomic: it hands off any
 * co-planned weddings the user owns to another member (keeping the shared plan),
 * deletes solo plans, removes emptied couple orgs, and finally deletes the
 * auth.users row — all in one transaction. It refuses (error
 * 'active_vendor_subscription') if the user is the sole member of a vendor org
 * with a live subscription, so billing is cancelled first.
 *
 * Returns a structured result; the client redirects home on success.
 */
export async function deleteMyAccount(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not_signed_in" };

  const { error } = await supabase.rpc("delete_my_account");
  if (error) {
    const code = error.message.includes("active_vendor_subscription")
      ? "active_vendor_subscription"
      : "failed";
    return { ok: false, error: code };
  }

  // The account row is already gone; clear the local session cookies too.
  try {
    await supabase.auth.signOut();
  } catch {
    // Session is already invalid — nothing to do.
  }
  return { ok: true };
}
