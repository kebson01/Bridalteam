"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { sanitizeTools } from "@/lib/wedding-tools";

// RLS enforces edit access: the weddings UPDATE policy is can_edit_wedding(id),
// so a viewer without edit rights gets 0 rows back rather than a silent write.

export interface SaveToolsResult {
  ok: boolean;
  error?: string;
  tools?: string[];
}

/** Saves which tools appear on a wedding's dashboard. */
export async function saveEnabledTools(
  weddingId: string,
  keys: string[],
): Promise<SaveToolsResult> {
  if (!weddingId || !Array.isArray(keys)) return { ok: false, error: "Missing wedding." };

  const tools = sanitizeTools(keys.map(String));
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("weddings")
    .update({ enabled_tools: tools, updated_at: new Date().toISOString() })
    .eq("id", weddingId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("saveEnabledTools failed:", error.code, error.message);
    return { ok: false, error: "Couldn't save your tools. Please try again." };
  }
  if (!data) return { ok: false, error: "Only editors can change this dashboard." };

  // The nav on every wedding page reads this, so refresh the whole workspace.
  revalidatePath(`/w/${weddingId}`, "layout");
  return { ok: true, tools };
}
