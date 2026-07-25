"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { moderateImage } from "@/lib/moderation";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { VALID_GROUP_KINDS } from "@/lib/community";

export type PostGroup = { id: string; name: string; join_code: string; owner_id: string; kind: string };

export type GroupMember = { user_id: string; name: string; avatar: string | null; is_owner: boolean };

export type FeedPost = {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  body: string | null;
  image_url: string | null;
  media_type: string | null;
  visibility: "public" | "group";
  group_id: string | null;
  like_count: number;
  created_at: string;
  liked_by_me: boolean;
  comment_count: number;
  saved_by_me: boolean;
};

// Columns selected for every feed query — keep in sync with FeedPost's stored fields.
const POST_COLUMNS =
  "id, author_id, author_name, author_avatar, body, image_url, media_type, visibility, group_id, like_count, created_at";

type PostRow = Omit<FeedPost, "liked_by_me" | "comment_count" | "saved_by_me">;

/** Adds per-viewer flags (liked/saved) and comment counts to a set of post rows. */
async function enrichPosts(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  userId: string,
  rows: PostRow[],
): Promise<FeedPost[]> {
  const ids = rows.map((p) => p.id);
  if (ids.length === 0) return [];
  const [{ data: likes }, { data: comments }, { data: saved }] = await Promise.all([
    supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", ids),
  ]);
  const likedSet = new Set((likes ?? []).map((l) => l.post_id));
  const savedSet = new Set((saved ?? []).map((s) => s.post_id));
  const commentCounts = new Map<string, number>();
  for (const c of comments ?? []) commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);
  return rows.map((p) => ({
    ...p,
    liked_by_me: likedSet.has(p.id),
    saved_by_me: savedSet.has(p.id),
    comment_count: commentCounts.get(p.id) ?? 0,
  }));
}

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
    .select("id, name, join_code, owner_id, kind")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listGroups failed:", error.code, error.message);
    return [];
  }
  return (data ?? []) as PostGroup[];
}

export async function createGroup(
  name: string,
  kind = "custom",
): Promise<{ ok: boolean; group?: PostGroup; error?: string }> {
  const clean = name?.trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Give your group a name." };
  const safeKind = VALID_GROUP_KINDS.has(kind) ? kind : "custom";
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  // Short, unambiguous join code (no easily-confused characters).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");

  const { data, error } = await supabase
    .from("post_groups")
    .insert({ owner_id: user.id, name: clean, join_code: code, kind: safeKind })
    .select("id, name, join_code, owner_id, kind")
    .single();
  if (error || !data) {
    console.error("createGroup failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't create that group. Please try again." };
  }
  revalidatePath("/community");
  return { ok: true, group: data as PostGroup };
}

/** Members of a group (caller must be a member). */
export async function listGroupMembers(groupId: string): Promise<GroupMember[]> {
  if (!groupId) return [];
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data, error } = await supabase.rpc("list_group_members", { gid: groupId });
  if (error) {
    console.error("listGroupMembers failed:", error.message);
    return [];
  }
  return (data ?? []) as GroupMember[];
}

/**
 * Owner adds people to a group by email — one or many at once. Emails that
 * already have an account are added immediately; the rest get an invite email
 * with the group's join code.
 */
export async function addGroupMembers(
  groupId: string,
  emailsRaw: string,
): Promise<{ ok: boolean; added?: number; invited?: number; error?: string }> {
  if (!groupId) return { ok: false, error: "Missing group." };
  const emails = emailsRaw
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  if (emails.length === 0) return { ok: false, error: "Enter at least one valid email." };

  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  const { data, error } = await supabase.rpc("add_group_members_by_email", {
    gid: groupId,
    emails,
  });
  if (error) {
    const msg = /not_owner/.test(error.message)
      ? "Only the group's owner can add members."
      : "Couldn't add members. Please try again.";
    return { ok: false, error: msg };
  }

  const result = (data ?? {}) as { added?: number; not_found?: string[] };
  const notFound = result.not_found ?? [];

  // Invite the ones who don't have an account yet, with the group's join code.
  if (notFound.length > 0) {
    const { data: group } = await supabase
      .from("post_groups")
      .select("name, join_code")
      .eq("id", groupId)
      .maybeSingle();
    if (group) {
      const inviterName =
        (user.user_metadata?.full_name as string | undefined)?.trim() ||
        user.email?.split("@")[0] ||
        "A friend";
      await Promise.all(
        notFound.map((to) =>
          sendEmail({
            to,
            subject: `${inviterName} invited you to “${group.name}” on Bridal Team`,
            html: emailLayout(
              `You're invited to “${group.name}”`,
              `${inviterName} added you to their private group on Bridal Team. ` +
                `Create a free account, then join with code <strong>${group.join_code}</strong>.`,
              { label: "Join on Bridal Team", url: `${SITE_URL}/auth/signup?next=/community` },
            ),
          }).catch(() => undefined),
        ),
      );
    }
  }

  revalidatePath("/community");
  return { ok: true, added: result.added ?? 0, invited: notFound.length };
}

/** Owner removes a member, or a member removes themselves. */
export async function removeGroupMember(
  groupId: string,
  targetUserId: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!groupId || !targetUserId) return { ok: false };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };
  const { error } = await supabase.rpc("remove_group_member", { gid: groupId, target: targetUserId });
  if (error) {
    const msg = /cannot_remove_owner/.test(error.message)
      ? "The group owner can't be removed."
      : /not_allowed/.test(error.message)
        ? "You don't have permission to do that."
        : "Couldn't remove that member.";
    return { ok: false, error: msg };
  }
  revalidatePath("/community");
  return { ok: true };
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
    .select(POST_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);

  query = scope === "public" ? query.eq("visibility", "public") : query.eq("group_id", scope);

  const { data: posts, error } = await query;
  if (error) {
    console.error("listFeed failed:", error.code, error.message);
    return [];
  }
  return enrichPosts(supabase, user.id, (posts ?? []) as PostRow[]);
}

/** Trending: public posts from the last 7 days, ranked by likes + comments. */
export async function listTrendingFeed(): Promise<FeedPost[]> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("visibility", "public")
    .gte("created_at", since)
    .order("like_count", { ascending: false })
    .limit(60);
  if (error) {
    console.error("listTrendingFeed failed:", error.code, error.message);
    return [];
  }
  const enriched = await enrichPosts(supabase, user.id, (posts ?? []) as PostRow[]);
  return enriched
    .sort((a, b) => b.like_count + b.comment_count - (a.like_count + a.comment_count))
    .slice(0, 30);
}

/** Posts the signed-in user has saved (bookmarked), newest-saved first. */
export async function listSavedFeed(): Promise<FeedPost[]> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data: saved, error } = await supabase
    .from("saved_posts")
    .select("post_id, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("listSavedFeed failed:", error.code, error.message);
    return [];
  }
  const order = (saved ?? []).map((s) => s.post_id);
  if (order.length === 0) return [];
  // RLS on posts still applies — posts the user can no longer see just drop out.
  const { data: posts } = await supabase.from("posts").select(POST_COLUMNS).in("id", order);
  const enriched = await enrichPosts(supabase, user.id, (posts ?? []) as PostRow[]);
  const rank = new Map(order.map((id, i) => [id, i]));
  return enriched.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
}

/** A single post by id, for its shareable permalink page. */
export async function getPost(postId: string): Promise<FeedPost | null> {
  if (!postId) return null;
  const { supabase, user } = await authed();
  if (!user) return null;
  const { data: post } = await supabase.from("posts").select(POST_COLUMNS).eq("id", postId).maybeSingle();
  if (!post) return null;
  const [enriched] = await enrichPosts(supabase, user.id, [post as PostRow]);
  return enriched ?? null;
}

/** Save or unsave (bookmark) a post for the signed-in user. */
export async function toggleSavePost(postId: string, saved: boolean): Promise<{ saved: boolean }> {
  const { supabase, user } = await authed();
  if (!user || !postId) return { saved };
  if (saved) {
    await supabase.from("saved_posts").delete().eq("post_id", postId).eq("user_id", user.id);
    return { saved: false };
  }
  await supabase
    .from("saved_posts")
    .upsert({ post_id: postId, user_id: user.id }, { onConflict: "user_id,post_id", ignoreDuplicates: true });
  return { saved: true };
}

export async function createPost(input: {
  body: string;
  imageUrl?: string | null;
  mediaType?: "photo" | "video";
  visibility: "public" | "group";
  groupId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const body = input.body?.trim().slice(0, 3000) ?? "";
  const mediaUrl = input.imageUrl?.trim() || null;
  const isVideo = input.mediaType === "video";
  if (!body && !mediaUrl) return { ok: false, error: "Write something or add a photo." };
  if (input.visibility === "group" && !input.groupId)
    return { ok: false, error: "Pick a group to post to." };

  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  // AI safety check on any image before it goes live. Fails open if unavailable.
  // (Video moderation isn't supported yet, so videos are posted as-is.)
  if (mediaUrl && !isVideo) {
    const moderation = await moderateImage(mediaUrl);
    if (!moderation.allowed) {
      // Best-effort cleanup of the just-uploaded file (user owns their folder).
      const path = mediaUrl.split("/post-media/")[1];
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
    image_url: mediaUrl,
    media_type: mediaUrl ? (isVideo ? "video" : "photo") : "text",
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

export type AppNotification = {
  id: string;
  type: "group_post" | "reply" | "like";
  actor_name: string;
  post_id: string | null;
  group_id: string | null;
  preview: string | null;
  read: boolean;
  created_at: string;
};

/** Recent notifications for the signed-in user, plus the unread count. */
export async function listNotifications(): Promise<{ items: AppNotification[]; unread: number }> {
  const { supabase, user } = await authed();
  if (!user) return { items: [], unread: 0 };
  const [{ data }, { count }] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, actor_name, post_id, group_id, preview, read, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("read", false),
  ]);
  return { items: (data ?? []) as AppNotification[], unread: count ?? 0 };
}

/** Marks notifications read — all of them, or a specific set. */
export async function markNotificationsRead(ids?: string[]): Promise<{ ok: boolean }> {
  const { supabase, user } = await authed();
  if (!user) return { ok: false };
  let q = supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
  if (ids && ids.length > 0) q = q.in("id", ids);
  const { error } = await q;
  if (error) {
    console.error("markNotificationsRead failed:", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}
