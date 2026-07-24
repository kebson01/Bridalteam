"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { notifySlack } from "@/lib/slack";
import { SITE_URL } from "@/lib/site";

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

export type InspirationComment = {
  id: string;
  body: string;
  author_name: string;
  author_avatar: string | null;
  user_id: string;
  created_at: string;
};

/** Public list of comments on a piece of inspiration, oldest first. */
export async function listComments(imageId: string): Promise<InspirationComment[]> {
  if (!imageId) return [];
  const supabase = await supabaseServer();
  const { data, error } = await supabase
    .from("inspiration_comments")
    .select("id, body, author_name, author_avatar, user_id, created_at")
    .eq("image_id", imageId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listComments failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as InspirationComment[];
}

export type CommentResult =
  | { ok: true; comment: InspirationComment }
  | { ok: false; error: "sign_in" | "empty" | "failed" };

/** Adds the signed-in user's comment to a piece of inspiration. */
export async function addComment(imageId: string, body: string): Promise<CommentResult> {
  const text = body?.trim();
  if (!imageId) return { ok: false, error: "failed" };
  if (!text) return { ok: false, error: "empty" };

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "sign_in" };

  const authorName =
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Guest";
  const authorAvatar = (user.user_metadata?.avatar_url as string | undefined)?.trim() || null;

  const { data, error } = await supabase
    .from("inspiration_comments")
    .insert({
      image_id: imageId,
      user_id: user.id,
      author_name: authorName,
      author_avatar: authorAvatar,
      body: text.slice(0, 1000),
    })
    .select("id, body, author_name, author_avatar, user_id, created_at")
    .single();

  if (error || !data) {
    console.error("addComment failed:", error?.code, error?.message);
    return { ok: false, error: "failed" };
  }
  return { ok: true, comment: data as InspirationComment };
}

/** Deletes a comment (RLS allows only the author). */
export async function deleteComment(commentId: string): Promise<{ ok: boolean }> {
  if (!commentId) return { ok: false };
  const supabase = await supabaseServer();
  const { error } = await supabase.from("inspiration_comments").delete().eq("id", commentId);
  if (error) {
    console.error("deleteComment failed:", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}

/**
 * Lets any visitor report an inspiration image as inappropriate. Records the
 * report for admin review and pings Slack (if configured). Deliberately
 * low-friction — no sign-in required.
 */
export async function reportImage(imageId: string, reason: string): Promise<{ ok: boolean }> {
  if (!imageId) return { ok: false };
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("inspiration_reports").insert({
    image_id: imageId,
    reason: reason?.trim().slice(0, 500) || null,
    reporter_user_id: user?.id ?? null,
  });
  if (error) {
    console.error("reportImage failed:", error.code, error.message);
    return { ok: false };
  }

  // Best-effort Slack notification for admin review.
  const { data: img } = await supabase
    .from("inspiration_images")
    .select("title, image_url")
    .eq("id", imageId)
    .maybeSingle();

  await notifySlack(
    `:triangular_flag_on_post: *Inspiration image reported*\n` +
      `• Title: ${img?.title ?? "(unknown)"}\n` +
      (reason?.trim() ? `• Reason: ${reason.trim().slice(0, 300)}\n` : "") +
      (user?.email ? `• By: ${user.email}\n` : `• By: anonymous\n`) +
      (img?.image_url ? `• Image: ${img.image_url}\n` : "") +
      `• Review: ${SITE_URL}/admin`,
  );

  return { ok: true };
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
