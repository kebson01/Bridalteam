"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

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
