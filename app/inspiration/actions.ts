"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";

export type SaveResult = { ok: boolean; error?: string; weddingId?: string };

/**
 * Saves an inspiration image to the signed-in couple's wedding mood board.
 *
 * If the user belongs to exactly one wedding we save there automatically. If
 * they're on several (a planner), we can't guess — callers pass an explicit
 * weddingId. RLS enforces that they can actually edit the target wedding.
 */
export async function saveInspiration(imageId: string, weddingId?: string): Promise<SaveResult> {
  if (!imageId) return { ok: false, error: "Missing image." };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in" };

  let target = weddingId;
  if (!target) {
    // Weddings this user can reach (RLS-scoped).
    const { data: weddings } = await supabase.from("weddings").select("id").limit(2);
    if (!weddings || weddings.length === 0) return { ok: false, error: "no_wedding" };
    if (weddings.length > 1) return { ok: false, error: "pick_wedding" };
    target = weddings[0].id;
  }

  const { error } = await supabase
    .from("saved_inspiration")
    .upsert(
      { wedding_id: target, image_id: imageId, saved_by: user.id },
      { onConflict: "wedding_id,image_id", ignoreDuplicates: true },
    );

  if (error) {
    console.error("saveInspiration failed:", error.code, error.message);
    return { ok: false, error: "failed" };
  }

  revalidatePath(`/w/${target}/ideas`);
  return { ok: true, weddingId: target };
}

/** Toggles the signed-in user's like on a piece of inspiration. */
export async function toggleLike(imageId: string, liked: boolean): Promise<{ liked: boolean }> {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !imageId) return { liked };

  if (liked) {
    await supabase.from("inspiration_likes").delete().eq("image_id", imageId).eq("user_id", user.id);
    return { liked: false };
  }
  await supabase
    .from("inspiration_likes")
    .upsert({ image_id: imageId, user_id: user.id }, { onConflict: "image_id,user_id", ignoreDuplicates: true });
  return { liked: true };
}

export async function unsaveInspiration(imageId: string, weddingId: string) {
  if (!imageId || !weddingId) return;
  const supabase = await supabaseServer();
  const { error } = await supabase
    .from("saved_inspiration")
    .delete()
    .eq("wedding_id", weddingId)
    .eq("image_id", imageId);
  if (error) console.error("unsaveInspiration failed:", error.code, error.message);
  revalidatePath(`/w/${weddingId}/ideas`);
}
