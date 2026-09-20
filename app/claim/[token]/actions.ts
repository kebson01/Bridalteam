"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type ClaimState = { error: string | null };

/**
 * A vendor claims the listing we pre-created for them during outreach.
 *
 * The token is the whole authorization, so it is never taken from a form
 * field a page could be tricked into posting from elsewhere — it comes from
 * the route segment and is bound at render time.
 */
export async function claimListing(
  token: string,
  _prev: ClaimState,
  _formData: FormData,
): Promise<ClaimState> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first, then claim your listing." };

  const { data, error } = await supabase.rpc("claim_vendor_listing", { p_token: token });

  if (error) {
    // The RPC raises with a message written for the vendor, so pass the known
    // ones straight through rather than flattening every failure into
    // "something went wrong" — "you already have a workspace" is actionable
    // and the generic version is not.
    if (/already been claimed|expired|not valid|already has a workspace/i.test(error.message)) {
      return { error: error.message };
    }
    console.error("claimListing failed:", error.code, error.message);
    return { error: "Something went wrong. Please try again." };
  }

  if (!data) return { error: "That claim link is not valid." };
  redirect("/vendor");
}
