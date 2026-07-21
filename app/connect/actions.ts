"use server";

import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type ConnectState = { error: string | null };

/** A planner redeems a couple's connect code to join their wedding. */
export async function connectToWedding(
  _prev: ConnectState,
  formData: FormData,
): Promise<ConnectState> {
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  if (!code) return { error: "Enter the code your couple gave you." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Please sign in first." };

  const { data, error } = await supabase.rpc("redeem_connect_code", { p_code: code });

  if (error) {
    // no_data_found -> the code didn't match anything.
    if (error.code === "P0002" || /valid/i.test(error.message)) {
      return { error: "That code isn't valid. Double-check it with your couple." };
    }
    console.error("connectToWedding failed:", error.code, error.message);
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/w/${data}`);
}
