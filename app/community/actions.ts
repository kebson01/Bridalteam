"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer } from "@/lib/supabase/server";
import { moderateImage } from "@/lib/moderation";
import { sendEmail, emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";
import { VALID_GROUP_KINDS } from "@/lib/community";
import { overRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export type PostGroup = {
  id: string;
  name: string;
  join_code: string;
  owner_id: string;
  kind: string;
  is_public: boolean;
};

export type SuggestedGroup = { id: string; name: string; kind: string; member_count: number };

export type GroupMember = { user_id: string; name: string; avatar: string | null; is_owner: boolean };

export type PollOption = { id: string; label: string; votes: number };
export type Poll = { options: PollOption[]; total: number; my_vote: string | null };

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
  poll: Poll | null;
};

// Columns selected for every feed query — keep in sync with FeedPost's stored fields.
const POST_COLUMNS =
  "id, author_id, author_name, author_avatar, body, image_url, media_type, visibility, group_id, like_count, created_at";

type PostRow = Omit<FeedPost, "liked_by_me" | "comment_count" | "saved_by_me" | "poll">;

/** Adds per-viewer flags (liked/saved), comment counts and poll data to post rows. */
async function enrichPosts(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  userId: string | null,
  rows: PostRow[],
): Promise<FeedPost[]> {
  const ids = rows.map((p) => p.id);
  if (ids.length === 0) return [];
  const [{ data: comments }, { data: pollOpts }, { data: pollVotes }] = await Promise.all([
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    supabase.from("poll_options").select("id, post_id, label, position").in("post_id", ids).order("position", { ascending: true }),
    supabase.from("poll_votes").select("post_id, option_id, user_id").in("post_id", ids),
  ]);

  // Per-viewer flags only make sense for a signed-in user. Anonymous readers
  // get everything unliked/unsaved (they can't like or save without an account).
  let likedSet = new Set<string>();
  let savedSet = new Set<string>();
  if (userId) {
    const [{ data: likes }, { data: saved }] = await Promise.all([
      supabase.from("post_likes").select("post_id").eq("user_id", userId).in("post_id", ids),
      supabase.from("saved_posts").select("post_id").eq("user_id", userId).in("post_id", ids),
    ]);
    likedSet = new Set((likes ?? []).map((l) => l.post_id));
    savedSet = new Set((saved ?? []).map((s) => s.post_id));
  }
  const commentCounts = new Map<string, number>();
  for (const c of comments ?? []) commentCounts.set(c.post_id, (commentCounts.get(c.post_id) ?? 0) + 1);

  // Poll options grouped by post (already position-ordered), vote tallies, and this user's pick.
  const optsByPost = new Map<string, { id: string; label: string }[]>();
  for (const o of pollOpts ?? []) {
    const arr = optsByPost.get(o.post_id) ?? [];
    arr.push({ id: o.id, label: o.label });
    optsByPost.set(o.post_id, arr);
  }
  const votesByOption = new Map<string, number>();
  const myVoteByPost = new Map<string, string>();
  for (const v of pollVotes ?? []) {
    votesByOption.set(v.option_id, (votesByOption.get(v.option_id) ?? 0) + 1);
    if (v.user_id === userId) myVoteByPost.set(v.post_id, v.option_id);
  }

  return rows.map((p) => {
    const opts = optsByPost.get(p.id);
    const poll: Poll | null =
      opts && opts.length > 0
        ? {
            options: opts.map((o) => ({ id: o.id, label: o.label, votes: votesByOption.get(o.id) ?? 0 })),
            total: opts.reduce((s, o) => s + (votesByOption.get(o.id) ?? 0), 0),
            my_vote: myVoteByPost.get(p.id) ?? null,
          }
        : null;
    return {
      ...p,
      liked_by_me: likedSet.has(p.id),
      saved_by_me: savedSet.has(p.id),
      comment_count: commentCounts.get(p.id) ?? 0,
      poll,
    };
  });
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

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * What the list* helpers return.
 *
 * `[]` means the query ran and there is genuinely nothing there. `null` means
 * the query failed. These used to be the same thing — every one of them
 * swallowed its error and returned `[]` — so a broken query rendered "No posts
 * yet, be the first to share something." A brand-new community looked exactly
 * like a broken one, and nobody would ever report it.
 *
 * Callers coalesce `null` to an empty array for rendering and use the null-ness
 * to show "couldn't load" in place of the empty state. Signed-out still returns
 * `[]`, because that is not a failure — there is simply nothing to show.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Groups the signed-in user belongs to (owner or member). */
export async function listGroups(): Promise<PostGroup[] | null> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data, error } = await supabase
    .from("post_groups")
    .select("id, name, join_code, owner_id, kind, is_public")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listGroups failed:", error.code, error.message);
    return null;
  }
  return (data ?? []) as PostGroup[];
}

export async function createGroup(
  name: string,
  kind = "custom",
  isPublic = false,
): Promise<{ ok: boolean; group?: PostGroup; error?: string }> {
  const clean = name?.trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Give your group a name." };
  const safeKind = VALID_GROUP_KINDS.has(kind) ? kind : "custom";
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  if (await overRateLimit(supabase, "post_groups", "owner_id", user.id, RATE_LIMITS.group)) {
    return { ok: false, error: "You're creating groups too fast. Please wait a moment and try again." };
  }

  // Short, unambiguous join code (no easily-confused characters).
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const code = Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join("");

  const { data, error } = await supabase
    .from("post_groups")
    .insert({ owner_id: user.id, name: clean, join_code: code, kind: safeKind, is_public: isPublic })
    .select("id, name, join_code, owner_id, kind, is_public")
    .single();
  if (error || !data) {
    console.error("createGroup failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't create that group. Please try again." };
  }
  revalidatePath("/community");
  return { ok: true, group: data as PostGroup };
}

/** Public groups the signed-in user could discover and join (not already in). */
export async function listSuggestedGroups(): Promise<SuggestedGroup[] | null> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data, error } = await supabase.rpc("list_suggested_groups", { lim: 6 });
  if (error) {
    console.error("listSuggestedGroups failed:", error.message);
    return null;
  }
  return ((data ?? []) as { id: string; name: string; kind: string; member_count: number | string }[]).map(
    (g) => ({ id: g.id, name: g.name, kind: g.kind, member_count: Number(g.member_count) }),
  );
}

/** Join a public group (no code needed). Refuses private groups. */
export async function joinPublicGroup(
  groupId: string,
): Promise<{ ok: boolean; group?: PostGroup; error?: string }> {
  if (!groupId) return { ok: false, error: "Missing group." };
  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };
  const { data, error } = await supabase.rpc("join_public_group", { gid: groupId });
  if (error) {
    const msg = /not_public/.test(error.message)
      ? "That group isn't open to join."
      : "Couldn't join that group. Please try again.";
    return { ok: false, error: msg };
  }
  revalidatePath("/community");
  return { ok: true, group: data as PostGroup };
}

/** Members of a group (caller must be a member). */
export async function listGroupMembers(groupId: string): Promise<GroupMember[] | null> {
  if (!groupId) return [];
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data, error } = await supabase.rpc("list_group_members", { gid: groupId });
  if (error) {
    console.error("listGroupMembers failed:", error.message);
    return null;
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
export async function listFeed(scope: string): Promise<FeedPost[] | null> {
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
    return null;
  }
  return enrichPosts(supabase, user.id, (posts ?? []) as PostRow[]);
}

/** Trending: public posts from the last 7 days, ranked by likes + comments. */
export async function listTrendingFeed(): Promise<FeedPost[] | null> {
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
    return null;
  }
  const enriched = await enrichPosts(supabase, user.id, (posts ?? []) as PostRow[]);
  return enriched
    .sort((a, b) => b.like_count + b.comment_count - (a.like_count + a.comment_count))
    .slice(0, 30);
}

/** Posts the signed-in user has saved (bookmarked), newest-saved first. */
export async function listSavedFeed(): Promise<FeedPost[] | null> {
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
    return null;
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

/**
 * Public feed for anonymous visitors — only `public` posts, newest first, with
 * no per-viewer flags. Works without a session: it relies on the anon-role RLS
 * policy that exposes public posts (and their comments/polls) to everyone.
 */
export async function listPublicFeed(): Promise<FeedPost[] | null> {
  const supabase = await supabaseServer();
  const { data: posts, error } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("visibility", "public")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) {
    console.error("listPublicFeed failed:", error.code, error.message);
    return null;
  }
  return enrichPosts(supabase, null, (posts ?? []) as PostRow[]);
}

/** A single public post by id, viewable without an account (for its permalink). */
export async function getPublicPost(postId: string): Promise<FeedPost | null> {
  if (!postId) return null;
  const supabase = await supabaseServer();
  const { data: post } = await supabase
    .from("posts")
    .select(POST_COLUMNS)
    .eq("id", postId)
    .eq("visibility", "public")
    .maybeSingle();
  if (!post) return null;
  const [enriched] = await enrichPosts(supabase, null, [post as PostRow]);
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
  poll?: string[];
  visibility: "public" | "group";
  groupId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const body = input.body?.trim().slice(0, 3000) ?? "";
  const mediaUrl = input.imageUrl?.trim() || null;
  const isVideo = input.mediaType === "video";
  const pollLabels = (input.poll ?? []).map((s) => s.trim()).filter(Boolean).slice(0, 4);
  const wantsPoll = pollLabels.length >= 2;
  if (wantsPoll && !body) return { ok: false, error: "Add a question for your poll." };
  if (!body && !mediaUrl && !wantsPoll) return { ok: false, error: "Write something or add a photo." };
  if (input.visibility === "group" && !input.groupId)
    return { ok: false, error: "Pick a group to post to." };

  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  if (await overRateLimit(supabase, "posts", "author_id", user.id, RATE_LIMITS.post)) {
    return { ok: false, error: "You're posting too fast. Please wait a moment and try again." };
  }

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

  const { data: inserted, error } = await supabase
    .from("posts")
    .insert({
      author_id: user.id,
      author_name: displayName(user),
      author_avatar: (user.user_metadata?.avatar_url as string | undefined)?.trim() || null,
      body: body || null,
      image_url: mediaUrl,
      media_type: wantsPoll ? "poll" : mediaUrl ? (isVideo ? "video" : "photo") : "text",
      visibility: input.visibility,
      group_id: input.visibility === "group" ? input.groupId : null,
    })
    .select("id")
    .single();
  if (error || !inserted) {
    console.error("createPost failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't post that. Please try again." };
  }

  if (wantsPoll) {
    const rows = pollLabels.map((label, i) => ({
      post_id: inserted.id,
      label: label.slice(0, 80),
      position: i,
    }));
    const { error: pollErr } = await supabase.from("poll_options").insert(rows);
    if (pollErr) console.error("createPost poll options failed:", pollErr.code, pollErr.message);
  }

  revalidatePath("/community");
  return { ok: true };
}

/** Cast (or change) the signed-in user's vote in a poll. One vote per poll. */
export async function votePoll(postId: string, optionId: string): Promise<{ ok: boolean }> {
  const { supabase, user } = await authed();
  if (!user || !postId || !optionId) return { ok: false };
  const { error } = await supabase
    .from("poll_votes")
    .upsert({ post_id: postId, option_id: optionId, user_id: user.id }, { onConflict: "post_id,user_id" });
  if (error) {
    console.error("votePoll failed:", error.code, error.message);
    return { ok: false };
  }
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

export async function listPostComments(postId: string): Promise<PostComment[] | null> {
  if (!postId) return [];
  const { supabase } = await authed();
  const { data, error } = await supabase
    .from("post_comments")
    .select("id, body, author_name, author_avatar, user_id, created_at")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listPostComments failed:", error.code, error.message);
    return null;
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

  if (await overRateLimit(supabase, "post_comments", "user_id", user.id, RATE_LIMITS.comment)) {
    return { ok: false, error: "You're commenting too fast. Please wait a moment and try again." };
  }

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

export type AppEvent = {
  id: string;
  title: string;
  location: string | null;
  starts_at: string;
  creator_id: string;
  going_count: number;
  rsvped_by_me: boolean;
};

/** Upcoming community events (soonest first), with RSVP counts for the viewer. */
export async function listUpcomingEvents(): Promise<AppEvent[] | null> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, location, starts_at, creator_id")
    .gte("starts_at", new Date().toISOString())
    .order("starts_at", { ascending: true })
    .limit(6);
  if (error) {
    console.error("listUpcomingEvents failed:", error.code, error.message);
    return null;
  }
  const rows = events ?? [];
  const ids = rows.map((e) => e.id);
  if (ids.length === 0) return [];
  const { data: rsvps } = await supabase.from("event_rsvps").select("event_id, user_id").in("event_id", ids);
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of rsvps ?? []) {
    counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
    if (r.user_id === user.id) mine.add(r.event_id);
  }
  return rows.map((e) => ({
    ...(e as Omit<AppEvent, "going_count" | "rsvped_by_me">),
    going_count: counts.get(e.id) ?? 0,
    rsvped_by_me: mine.has(e.id),
  }));
}

/** Any member can create an event. */
export async function createEvent(input: {
  title: string;
  location?: string;
  startsAt: string;
}): Promise<{ ok: boolean; event?: AppEvent; error?: string }> {
  const title = input.title?.trim().slice(0, 120);
  if (!title) return { ok: false, error: "Give your event a name." };
  const t = Date.parse(input.startsAt);
  if (!input.startsAt || Number.isNaN(t)) return { ok: false, error: "Pick a date and time." };

  const { supabase, user } = await authed();
  if (!user) return { ok: false, error: "sign_in" };

  if (await overRateLimit(supabase, "events", "creator_id", user.id, RATE_LIMITS.event)) {
    return { ok: false, error: "You're creating events too fast. Please wait a moment and try again." };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      creator_id: user.id,
      creator_name: displayName(user),
      title,
      location: input.location?.trim().slice(0, 120) || null,
      starts_at: new Date(t).toISOString(),
    })
    .select("id, title, location, starts_at, creator_id")
    .single();
  if (error || !data) {
    console.error("createEvent failed:", error?.code, error?.message);
    return { ok: false, error: "Couldn't create that event. Please try again." };
  }
  return {
    ok: true,
    event: { ...(data as Omit<AppEvent, "going_count" | "rsvped_by_me">), going_count: 0, rsvped_by_me: false },
  };
}

/** RSVP to (or cancel RSVP from) an event. `going` is the current state. */
export async function toggleEventRsvp(eventId: string, going: boolean): Promise<{ ok: boolean }> {
  const { supabase, user } = await authed();
  if (!user || !eventId) return { ok: false };
  if (going) {
    await supabase.from("event_rsvps").delete().eq("event_id", eventId).eq("user_id", user.id);
    return { ok: true };
  }
  await supabase
    .from("event_rsvps")
    .upsert({ event_id: eventId, user_id: user.id }, { onConflict: "event_id,user_id", ignoreDuplicates: true });
  return { ok: true };
}

/** Events the signed-in user created (any date), soonest first — for managing them. */
export async function listMyEvents(): Promise<AppEvent[] | null> {
  const { supabase, user } = await authed();
  if (!user) return [];
  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, location, starts_at, creator_id")
    .eq("creator_id", user.id)
    .order("starts_at", { ascending: true })
    .limit(50);
  if (error) {
    console.error("listMyEvents failed:", error.code, error.message);
    return null;
  }
  const rows = events ?? [];
  const ids = rows.map((e) => e.id);
  if (ids.length === 0) return [];
  const { data: rsvps } = await supabase.from("event_rsvps").select("event_id, user_id").in("event_id", ids);
  const counts = new Map<string, number>();
  const mine = new Set<string>();
  for (const r of rsvps ?? []) {
    counts.set(r.event_id, (counts.get(r.event_id) ?? 0) + 1);
    if (r.user_id === user.id) mine.add(r.event_id);
  }
  return rows.map((e) => ({
    ...(e as Omit<AppEvent, "going_count" | "rsvped_by_me">),
    going_count: counts.get(e.id) ?? 0,
    rsvped_by_me: mine.has(e.id),
  }));
}

/** Delete an event (creator only — enforced by RLS). */
export async function deleteEvent(eventId: string): Promise<{ ok: boolean }> {
  if (!eventId) return { ok: false };
  const { supabase, user } = await authed();
  if (!user) return { ok: false };
  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) {
    console.error("deleteEvent failed:", error.code, error.message);
    return { ok: false };
  }
  return { ok: true };
}
