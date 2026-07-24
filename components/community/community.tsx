"use client";

import { useRef, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downscaleImage } from "@/lib/image";
import PostComments from "@/components/community/post-comments";
import {
  createGroup,
  createPost,
  deletePost,
  joinGroup,
  listFeed,
  togglePostLike,
  type FeedPost,
  type PostGroup,
} from "@/app/community/actions";

type Viewer = { id: string; name: string; avatar: string };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const secs = Math.max(0, Math.round((Date.now() - then) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  const cls = "flex-none rounded-full object-cover";
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={cls} style={{ width: size, height: size }} />;
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full bg-brand/15 font-semibold text-brand-dark"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

export default function Community({
  viewer,
  initialGroups,
  initialFeed,
}: {
  viewer: Viewer;
  initialGroups: PostGroup[];
  initialFeed: FeedPost[];
}) {
  const [groups, setGroups] = useState<PostGroup[]>(initialGroups);
  const [scope, setScope] = useState<string>("public");
  const [feed, setFeed] = useState<FeedPost[]>(initialFeed);
  const [loadingFeed, startFeed] = useTransition();

  // Composer
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string>("public");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [posting, startPost] = useTransition();
  const [composerError, setComposerError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Groups panel
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [groupMsg, setGroupMsg] = useState<string | null>(null);
  const [groupBusy, startGroup] = useTransition();

  // Track which posts have their replies expanded.
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  function switchScope(next: string) {
    setScope(next);
    setAudience(next === "public" ? "public" : next);
    startFeed(async () => setFeed(await listFeed(next)));
  }

  function refreshFeed() {
    startFeed(async () => setFeed(await listFeed(scope)));
  }

  async function handleImage(file: File) {
    setComposerError(null);
    if (!file.type.startsWith("image/")) {
      setComposerError("Please choose an image file.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setComposerError("Photo must be under 15 MB.");
      return;
    }
    setUploading(true);
    try {
      const processed = await downscaleImage(file, 1600);
      const supabase = supabaseBrowser();
      const path = `${viewer.id}/${crypto.randomUUID()}.${processed.ext}`;
      const { error } = await supabase.storage
        .from("post-media")
        .upload(path, processed.blob, { cacheControl: "3600", upsert: false, contentType: processed.type });
      if (error) {
        setComposerError("Upload failed. Please try again.");
        return;
      }
      const { data } = supabase.storage.from("post-media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    } catch {
      setComposerError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function submitPost() {
    setComposerError(null);
    if (!body.trim() && !imageUrl) {
      setComposerError("Write something or add a photo.");
      return;
    }
    const visibility = audience === "public" ? "public" : "group";
    startPost(async () => {
      const res = await createPost({
        body,
        imageUrl: imageUrl || null,
        visibility,
        groupId: visibility === "group" ? audience : null,
      });
      if (!res.ok) {
        setComposerError(res.error ?? "Couldn't post that.");
        return;
      }
      setBody("");
      setImageUrl("");
      // If we posted to the scope we're viewing (or to public while on public), refresh.
      if (audience === scope || (audience === "public" && scope === "public")) refreshFeed();
      else switchScope(audience);
    });
  }

  function toggleLike(post: FeedPost) {
    const nextLiked = !post.liked_by_me;
    setFeed((f) =>
      f.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: nextLiked, like_count: p.like_count + (nextLiked ? 1 : -1) }
          : p,
      ),
    );
    togglePostLike(post.id, post.liked_by_me);
  }

  function removePost(id: string) {
    if (!confirm("Delete this post?")) return;
    setFeed((f) => f.filter((p) => p.id !== id));
    deletePost(id);
  }

  function toggleComments(id: string) {
    setOpenComments((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bumpCommentCount(id: string, delta: number) {
    setFeed((f) => f.map((p) => (p.id === id ? { ...p, comment_count: Math.max(0, p.comment_count + delta) } : p)));
  }

  function doCreateGroup() {
    setGroupMsg(null);
    startGroup(async () => {
      const res = await createGroup(newGroupName);
      if (!res.ok || !res.group) {
        setGroupMsg(res.error ?? "Couldn't create group.");
        return;
      }
      setGroups((g) => [...g, res.group!]);
      setNewGroupName("");
      setGroupMsg(`Created “${res.group.name}”. Share code ${res.group.join_code} to invite people.`);
    });
  }

  function doJoinGroup() {
    setGroupMsg(null);
    startGroup(async () => {
      const res = await joinGroup(joinCode);
      if (!res.ok || !res.group) {
        setGroupMsg(res.error ?? "Couldn't join.");
        return;
      }
      setGroups((g) => (g.some((x) => x.id === res.group!.id) ? g : [...g, res.group!]));
      setJoinCode("");
      setGroupMsg(`Joined “${res.group.name}”.`);
      switchScope(res.group.id);
    });
  }

  const activeGroup = groups.find((g) => g.id === scope);

  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Sidebar: scopes + groups */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          <button
            type="button"
            onClick={() => switchScope("public")}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-left text-sm font-medium transition-colors ${
              scope === "public" ? "bg-brand text-white" : "text-ink-soft hover:bg-stone-4"
            }`}
          >
            🌍 Public feed
          </button>
          {groups.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => switchScope(g.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-left text-sm font-medium transition-colors ${
                scope === g.id ? "bg-brand text-white" : "text-ink-soft hover:bg-stone-4"
              }`}
            >
              {g.name}
            </button>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => setShowGroups((v) => !v)}
          className="mt-3 w-full rounded-full border border-stone-2 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
        >
          {showGroups ? "Close groups" : "Groups & invites"}
        </button>

        {showGroups && (
          <div className="mt-3 space-y-4 rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
            <div>
              <p className="text-sm font-semibold text-ink">Create a group</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g. Bridal party"
                  maxLength={60}
                  className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={doCreateGroup}
                  disabled={groupBusy || !newGroupName.trim()}
                  className="flex-none rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Join with a code</p>
              <div className="mt-2 flex gap-2">
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full rounded-lg border border-stone-2 px-3 py-2 text-sm uppercase tracking-widest outline-none focus:border-brand"
                />
                <button
                  type="button"
                  onClick={doJoinGroup}
                  disabled={groupBusy || !joinCode.trim()}
                  className="flex-none rounded-lg border border-stone-2 px-3 py-2 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-50"
                >
                  Join
                </button>
              </div>
            </div>
            {groupMsg && <p className="text-xs text-ink-soft/80">{groupMsg}</p>}
          </div>
        )}
      </aside>

      {/* Main column: composer + feed */}
      <div className="min-w-0">
        {/* Composer */}
        <div className="rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
          <div className="flex gap-3">
            <Avatar name={viewer.name} url={viewer.avatar || null} />
            <div className="min-w-0 flex-1">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
                maxLength={3000}
                placeholder={
                  audience === "public"
                    ? "Share something with the community…"
                    : `Post to ${activeGroup?.name ?? "your group"}…`
                }
                className="w-full resize-none rounded-lg border border-stone-2 px-3 py-2 text-sm outline-none focus:border-brand"
              />
              {imageUrl && (
                <div className="mt-2 overflow-hidden rounded-lg border border-stone-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt="Attached" className="max-h-72 w-full object-cover" />
                </div>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="rounded-full border border-stone-2 px-3 py-1.5 text-sm font-medium text-ink-soft hover:border-brand disabled:opacity-60"
                >
                  {uploading ? "Uploading…" : imageUrl ? "Change photo" : "📷 Photo"}
                </button>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-sm text-ink-soft/60 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImage(f);
                    e.target.value = "";
                  }}
                />
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="rounded-full border border-stone-2 px-3 py-1.5 text-sm text-ink-soft outline-none focus:border-brand"
                  aria-label="Who can see this"
                >
                  <option value="public">🌍 Public</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      🔒 {g.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={submitPost}
                  disabled={posting || uploading || (!body.trim() && !imageUrl)}
                  className="ml-auto rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {posting ? "Posting…" : "Post"}
                </button>
              </div>
              {composerError && (
                <p role="alert" className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {composerError}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scope heading */}
        <p className="mt-6 mb-3 text-sm font-semibold uppercase tracking-wide text-ink-soft/50">
          {scope === "public" ? "Public feed" : activeGroup?.name ?? "Group"}
          {activeGroup && (
            <span className="ml-2 font-normal normal-case tracking-normal text-ink-soft/50">
              · invite code {activeGroup.join_code}
            </span>
          )}
        </p>

        {/* Feed */}
        {loadingFeed ? (
          <p className="py-10 text-center text-sm text-ink-soft/50">Loading…</p>
        ) : feed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-10 text-center">
            <p className="text-sm text-ink-soft/70">
              {scope === "public"
                ? "No posts yet — be the first to share something."
                : "No posts in this group yet. Start the conversation."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {feed.map((p) => (
              <article key={p.id} className="rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <Avatar name={p.author_name} url={p.author_avatar} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{p.author_name}</p>
                      <span className="text-xs text-ink-soft/50">· {timeAgo(p.created_at)}</span>
                      {p.visibility === "group" && (
                        <span className="rounded-full bg-stone-4 px-2 py-0.5 text-[11px] font-medium text-ink-soft/70">
                          🔒 Group
                        </span>
                      )}
                    </div>
                    {p.body && <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{p.body}</p>}
                  </div>
                  {p.author_id === viewer.id && (
                    <button
                      type="button"
                      onClick={() => removePost(p.id)}
                      aria-label="Delete post"
                      className="flex-none text-ink-soft/30 hover:text-red-600"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {p.image_url && (
                  <div className="mt-3 overflow-hidden rounded-xl border border-stone-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image_url} alt="" className="max-h-[32rem] w-full object-cover" />
                  </div>
                )}

                <div className="mt-3 flex items-center gap-4 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleLike(p)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      p.liked_by_me ? "text-brand-dark" : "text-ink-soft/60 hover:text-brand-dark"
                    }`}
                  >
                    <span>{p.liked_by_me ? "♥" : "♡"}</span>
                    {p.like_count > 0 && <span>{p.like_count}</span>}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleComments(p.id)}
                    className="flex items-center gap-1.5 text-ink-soft/60 transition-colors hover:text-brand-dark"
                  >
                    <span>💬</span>
                    <span>{p.comment_count > 0 ? p.comment_count : "Reply"}</span>
                  </button>
                </div>

                {openComments.has(p.id) && (
                  <PostComments
                    postId={p.id}
                    userId={viewer.id}
                    onCountChange={(d) => bumpCommentCount(p.id, d)}
                  />
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
