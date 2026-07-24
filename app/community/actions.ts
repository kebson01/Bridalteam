"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { moderateImage } from "@/lib/moderation";

export type PostGroup = { id: string; name: string; join_code: string; owner_id: string };

export type FeedPost = {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  body: string | null;
  image_url: string | null;
  visibility: "public" | "group";
  group_id: string | null;
  like_count: number;
  created_at: string;
  liked_by_me: boolean;
  comment_count: number;
};

async function authed() {
  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function displayName(user: {
  email?: string;
  user_metadata?: { full_name?: string };
}): string {
  return (
    (user.user_metadata?.full_name as string | undefined)?.trim() ||
    user.email?.split("@")[0] ||
    "Guest"
  );
}

/** Groups the signed-in user belongs to (owner or member). */
export async function listGroups(): Promise<PostGroup[]> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data, error } = await supabase
    .from("post_groups")
    .select("id, name, join_code, owner_id")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listGroups failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as PostGroup[];
}

export async function createGroup(name: string): Promise<{ ok: boolean; group?: PostGroup; error?: string }> {
  const clean = name?.trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Give your group a name." };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  // Short, unambiguous join code (no easily-confused characters).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");

  const { data, error } = await supabase
    .from("post_groups")
    .insert({ owner_id: user.id, name: clean, join_code: code })
    .select("id, name, join_code, owner_id")
    .single();
  if (error || !data) {
    console.error("createGroup failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't create that group. Please try again." };
  }
  revalidatePath("/community");
  return { ok: true, group: data as PostGroup };
}

export async function joinGroup(code: string): Promise<{ ok: boolean; group?: PostGroup; error?: string }> {
  const clean = code?.trim().toUpperCase();
  if (!clean) return { ok: false, error: "Enter a join code." };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  const { data, error } = await supabase.rpc("join_post_group", { code: clean });
  if (error) {
    const msg = /invalid_code/.test(error.message)
      ? "That join code doesn't match any group."
      : "Couldn't join that group. Please try again.";
    return { ok: false, error: msg };
  }
  revalidatePath("/community");
  return { ok: true, group: data as PostGroup };
}

/** Feed for a scope: "public" or a group id. Newest first. */
export async function listFeed(scope: string): Promise<FeedPost[]> {
  const { supabase, user } = await authed();
  if (!user) return [];

  let query = supabase
    .from("posts")
    .select("id, author_id, author_name, author_avatar, body, image_url, visibility, group_id, like_count, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  query = scope === "public" ? query.eq("visibility", "public") : query.eq("group_id", scope);

  const { data: posts, error } = await query;
  if (error) {
    console.error("listFeed failed:", error.code, error.message);
    return [];
  }
  const rows = posts ?? [];
  const ids = rows.map((p) => p.id);
  if (ids.length === 0) return [];

  // Which of these the current user has liked, and how many comments each has.
  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
  ]);
  const likedSet = new Set((likes ?? []).map((l) => l.post_id));
  const commentCounts = new Map<string, number>();
  for (const c of comments ?? []) commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);

  return rows.map((p) => ({
    ...(p as Omit<FeedPost, "liked_by_me" | "comment_count">),
    liked_by_me: likedSet.has(p.id),
    comment_count: commentCounts.get(p.id) ?? 0,
  }));
}

export async function createPost(input: {
  body: string;
  imageUrl?: string | null;
  visibility: "public" | "group";
  groupId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const body = input.body?.trim().slice(0, 3000) ?? "";
  const imageUrl = input.imageUrl?.trim() || null;
  if (!body && !imageUrl) return { ok: false, error: "Write something or add a photo." };
  if (input.visibility === "group" && !input.groupId)
    return { ok: false, error: "Pick a group to post to." };

  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  // AI safety check on any image before it goes live. Fails open if unavailable.
  if (imageUrl) {
    const moderation = await moderateImage(imageUrl);
    if (!moderation.allowed) {
      // Best-effort cleanup of the just-uploaded file (user owns their folder).
      const path = imageUrl.split("/post-media/")[1];
      if (path) await supabase.storage.from("post-media").remove([path]);
      return {
        ok: false,
        error:
          "That image looks inappropriate and wasn't posted." +
          (moderation.reason ? ` (${moderation.reason})` : ""),
      };
    }
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    author_name: displayName(user),
    author_avatar: (user.user_metadata?.avatar_url as string | undefined)?.trim() || null,
    body: body || null,
    image_url: imageUrl,
    media_type: imageUrl ? "photo" : "text",
    visibility: input.visibility,
    group_id: input.visibility === "group" ? input.groupId : null,
  });
  if (error) {
    console.error("createPost failed:", error.code, error.message);
    return { ok: false, error: "Couldn't post that. Please try again." };
  }
  revalidatePath("/community");
  return { ok: true };
}

export async function deletePost(postId: string): Promise<{ ok: boolean }> {
  if (!postId) return { ok: false };
  const { supabase, user } = await authed();
  if (!user) return { ok: false };
  const { error } = await supabase.from("posts").delete().eq("id", postId);
  if (error) {
    console.error("deletePost failed:", error.code, error.message);
    return { ok: false };
  }
  revalidatePath("/community");
  return { ok: true };
}

export async function togglePostLike(postId: string, liked: boolean): Promise<{ liked: boolean }> {
  const { supabase, user } = await authed();
  if (!user || !postId) return { liked };
  if (liked) {
    await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    return { liked: false };
  }
  await supabase
    .from("post_likes")
    .upsert({ post_id: postId, user_id: user.id }, { onConflict: "post_id,user_id", ignoreDuplicates: true });
  return { liked: true };
}

export type PostComment = {
  id: string;
  body: string;
  author_name: string;
  author_avatar: string | null;
  user_id: string;
  created_at: string;
};

export async function listPostComments(postId: string): Promise<PostComment[]> {
  if (!postId) return [];
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, body, author_name, author_avatar, user_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listPostComments failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as PostComment[];
}

export async function addPostComment(
  postId: string,
  body: string,
): Promise<{ ok: true; comment: PostComment } | { ok: false; error: string }> {
  const text = body?.trim();
  if (!postId) return { ok: false, error: "failed" };
  if (!text) return { ok: false, error: "empty" };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      user_id: user.id,
      author_name: displayName(user),
      author_avatar: (user.user_metadata?.avatar_url as string | undefined)?.trim() || null,
      body: text.slice(0, 1000),
    })
    .select("id, body, author_name, author_avatar, user_id, created_at")
    .single();
  if (error || !data) {
    console.error("addPostComment failed:", error?.code, error?.message);
    return { ok: false, error: "failed" };
  }
  return { ok: true, comment: data as PostComment };
}

export async function deletePostComment(commentId: string): Promise<{ ok: boolean }> {
  if (!commentId) return { ok: false };
  const { supabase } = await authed();
  const { error } = await supabase.from("post_comments").delete().eq("id", commentId);
  if (error) {
    console.error("deletePostComment failed:", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}
