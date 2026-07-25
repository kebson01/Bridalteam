"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downscaleImage } from "@/lib/image";
import PostComments from "@/components/community/post-comments";
import GroupMembers from "@/components/community/group-members";
import {
  createEvent,
  createGroup,
  createPost,
  deletePost,
  joinGroup,
  joinPublicGroup,
  listFeed,
  listSavedFeed,
  listTrendingFeed,
  togglePostLike,
  toggleEventRsvp,
  toggleSavePost,
  votePoll,
  type AppEvent,
  type FeedPost,
  type PostGroup,
  type SuggestedGroup,
} from "@/app/community/actions";
import { GROUP_PRESETS } from "@/lib/community";

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

function eventWhen(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} · ${time}`;
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  const cls = "flex-none rounded-full object-cover";
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className={cls} style={{ width: size, height: size }} />;
  return (
    <span
      className="flex flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep font-semibold text-white"
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
  initialEvents,
  initialSuggested,
}: {
  viewer: Viewer;
  initialGroups: PostGroup[];
  initialFeed: FeedPost[];
  initialEvents: AppEvent[];
  initialSuggested: SuggestedGroup[];
}) {
  const [groups, setGroups] = useState<PostGroup[]>(initialGroups);
  const [scope, setScope] = useState<string>("public");
  const [feed, setFeed] = useState<FeedPost[]>(initialFeed);
  const [loadingFeed, startFeed] = useTransition();

  // Composer
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<string>("public");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [mediaType, setMediaType] = useState<"photo" | "video" | "">("");
  const [uploading, setUploading] = useState(false);
  const [posting, startPost] = useTransition();
  const [composerError, setComposerError] = useState<string | null>(null);
  const [pollMode, setPollMode] = useState(false);
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  // Groups panel
  const [showGroups, setShowGroups] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupKind, setNewGroupKind] = useState("custom");
  const [newGroupPublic, setNewGroupPublic] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [suggested, setSuggested] = useState<SuggestedGroup[]>(initialSuggested);
  const [groupMsg, setGroupMsg] = useState<string | null>(null);
  const [groupBusy, startGroup] = useTransition();

  // Members panel (per active group) + image lightbox + share feedback.
  const [showMembers, setShowMembers] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Track which posts have their replies expanded.
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());

  // Upcoming events (right rail)
  const [events, setEvents] = useState<AppEvent[]>(initialEvents);
  const [showEventForm, setShowEventForm] = useState(false);
  const [evTitle, setEvTitle] = useState("");
  const [evLocation, setEvLocation] = useState("");
  const [evWhen, setEvWhen] = useState("");
  const [evMsg, setEvMsg] = useState<string | null>(null);
  const [evBusy, startEvent] = useTransition();

  function doCreateEvent() {
    setEvMsg(null);
    startEvent(async () => {
      const res = await createEvent({ title: evTitle, location: evLocation, startsAt: evWhen });
      if (!res.ok || !res.event) {
        setEvMsg(res.error ?? "Couldn't create event.");
        return;
      }
      setEvents((list) => [...list, res.event!].sort((a, b) => a.starts_at.localeCompare(b.starts_at)));
      setEvTitle("");
      setEvLocation("");
      setEvWhen("");
      setShowEventForm(false);
    });
  }

  function toggleRsvp(ev: AppEvent) {
    const nextGoing = !ev.rsvped_by_me;
    setEvents((list) =>
      list.map((e) =>
        e.id === ev.id
          ? { ...e, rsvped_by_me: nextGoing, going_count: e.going_count + (nextGoing ? 1 : -1) }
          : e,
      ),
    );
    toggleEventRsvp(ev.id, ev.rsvped_by_me);
  }

  const isView = scope === "trending" || scope === "saved"; // read-only feed views
  const postable = !isView;

  function loadFor(s: string): Promise<FeedPost[]> {
    if (s === "trending") return listTrendingFeed();
    if (s === "saved") return listSavedFeed();
    return listFeed(s);
  }

  function switchScope(next: string) {
    setScope(next);
    setAudience(next === "public" || next === "trending" || next === "saved" ? "public" : next);
    setShowMembers(false);
    startFeed(async () => setFeed(await loadFor(next)));
  }

  function refreshFeed() {
    startFeed(async () => setFeed(await loadFor(scope)));
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
      setMediaType("photo");
    } catch {
      setComposerError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleVideo(file: File) {
    setComposerError(null);
    if (!file.type.startsWith("video/")) {
      setComposerError("Please choose a video file.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setComposerError("Video must be under 50 MB.");
      return;
    }
    setUploading(true);
    try {
      const supabase = supabaseBrowser();
      const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
      const path = `${viewer.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("post-media")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) {
        setComposerError("Upload failed. Please try again.");
        return;
      }
      const { data } = supabase.storage.from("post-media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
      setMediaType("video");
    } catch {
      setComposerError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function clearMedia() {
    setImageUrl("");
    setMediaType("");
  }

  function submitPost() {
    setComposerError(null);
    const pollLabels = pollMode ? pollOptions.map((o) => o.trim()).filter(Boolean) : [];
    if (pollMode) {
      if (!body.trim()) {
        setComposerError("Add a question for your poll.");
        return;
      }
      if (pollLabels.length < 2) {
        setComposerError("Add at least two poll options.");
        return;
      }
    } else if (!body.trim() && !imageUrl) {
      setComposerError("Write something or add a photo.");
      return;
    }
    const visibility = audience === "public" ? "public" : "group";
    startPost(async () => {
      const res = await createPost({
        body,
        imageUrl: pollMode ? null : imageUrl || null,
        mediaType: mediaType === "video" ? "video" : "photo",
        poll: pollMode ? pollLabels : undefined,
        visibility,
        groupId: visibility === "group" ? audience : null,
      });
      if (!res.ok) {
        setComposerError(res.error ?? "Couldn't post that.");
        return;
      }
      setBody("");
      clearMedia();
      setPollMode(false);
      setPollOptions(["", ""]);
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

  function toggleSave(post: FeedPost) {
    const nextSaved = !post.saved_by_me;
    setFeed((f) => f.map((p) => (p.id === post.id ? { ...p, saved_by_me: nextSaved } : p)));
    // On the Saved view, un-saving should drop the card immediately.
    if (scope === "saved" && !nextSaved) setFeed((f) => f.filter((p) => p.id !== post.id));
    toggleSavePost(post.id, post.saved_by_me);
  }

  function sharePost(post: FeedPost) {
    const url = `${window.location.origin}/community/p/${post.id}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        setCopiedId(post.id);
        setTimeout(() => setCopiedId((c) => (c === post.id ? null : c)), 1800);
      })
      .catch(() => undefined);
  }

  function votePollOption(post: FeedPost, optionId: string) {
    if (!post.poll || post.poll.my_vote === optionId) return;
    const prev = post.poll.my_vote;
    setFeed((f) =>
      f.map((p) => {
        if (p.id !== post.id || !p.poll) return p;
        const options = p.poll.options.map((o) => ({
          ...o,
          votes: o.votes + (o.id === optionId ? 1 : 0) - (o.id === prev ? 1 : 0),
        }));
        return { ...p, poll: { options, total: prev ? p.poll.total : p.poll.total + 1, my_vote: optionId } };
      }),
    );
    votePoll(post.id, optionId);
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
      const res = await createGroup(newGroupName, newGroupKind, newGroupPublic);
      if (!res.ok || !res.group) {
        setGroupMsg(res.error ?? "Couldn't create group.");
        return;
      }
      setGroups((g) => [...g, res.group!]);
      setNewGroupName("");
      setNewGroupKind("custom");
      setNewGroupPublic(false);
      setGroupMsg(
        res.group.is_public
          ? `Created “${res.group.name}”. It's discoverable — others can find and join it. Code: ${res.group.join_code}.`
          : `Created “${res.group.name}”. Add people below or share code ${res.group.join_code}.`,
      );
      switchScope(res.group.id);
      setShowMembers(true);
    });
  }

  function joinSuggested(g: SuggestedGroup) {
    setGroupMsg(null);
    startGroup(async () => {
      const res = await joinPublicGroup(g.id);
      if (!res.ok || !res.group) {
        setGroupMsg(res.error ?? "Couldn't join that group.");
        return;
      }
      setGroups((list) => (list.some((x) => x.id === res.group!.id) ? list : [...list, res.group!]));
      setSuggested((s) => s.filter((x) => x.id !== g.id));
      switchScope(res.group.id);
    });
  }

  function handleLeft(groupId: string) {
    setGroups((g) => g.filter((x) => x.id !== groupId));
    setShowMembers(false);
    switchScope("public");
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

  // Live updates for the scope currently in view (only for public / group feeds).
  useEffect(() => {
    if (scope === "trending" || scope === "saved") return;
    const supabase = supabaseBrowser();
    const topic = `community:${scope}`;

    // channel(topic) returns an already-subscribed channel if one with this
    // topic is still registered on the shared client (e.g. switching scope and
    // back, or a re-mount). Adding .on("postgres_changes", …) to it then throws
    // "cannot add postgres_changes callbacks … after subscribe()". Clear any
    // stale channel of this topic first.
    supabase
      .getChannels()
      .filter((c) => c.topic === `realtime:${topic}`)
      .forEach((c) => supabase.removeChannel(c));

    const channel = supabase
      .channel(topic)
      // New posts (RLS ensures group posts only reach members).
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "posts" }, (payload) => {
        const row = payload.new as FeedPost;
        // Our own posts are already reflected locally; skip to avoid duplicates.
        if (row.author_id === viewer.id) return;
        const inScope =
          scope === "public" ? row.visibility === "public" : row.group_id === scope;
        if (!inScope) return;
        setFeed((f) =>
          f.some((p) => p.id === row.id)
            ? f
            : [{ ...row, liked_by_me: false, comment_count: 0, saved_by_me: false, poll: null }, ...f],
        );
      })
      // Like counts change on the posts row.
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "posts" }, (payload) => {
        const row = payload.new as FeedPost;
        setFeed((f) => f.map((p) => (p.id === row.id ? { ...p, like_count: row.like_count } : p)));
      })
      // New replies bump the comment count (skip our own — already counted).
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments" }, (payload) => {
        const row = payload.new as { post_id: string; user_id: string };
        if (row.user_id === viewer.id) return;
        setFeed((f) =>
          f.map((p) => (p.id === row.post_id ? { ...p, comment_count: p.comment_count + 1 } : p)),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [scope, viewer.id]);

  const activeGroup = groups.find((g) => g.id === scope);
  const scopeTitle =
    scope === "public"
      ? "Public Feed"
      : scope === "trending"
        ? "Trending"
        : scope === "saved"
          ? "Saved Posts"
          : activeGroup?.name ?? "Group";

  const navItem =
    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[14.5px] font-medium transition-colors";
  const navActive =
    "bg-gradient-to-br from-brand to-brand-dark text-white shadow-[0_10px_22px_-12px_rgba(243,103,5,0.8)]";
  const navIdle = "text-ink-soft hover:bg-stone-4";

  return (
    <>
      <div className="mx-auto grid max-w-6xl items-start gap-6 px-4 py-6 lg:grid-cols-[216px_minmax(0,1fr)_288px]">
        {/* ---------------- LEFT RAIL ---------------- */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <h2 className="hidden font-display text-[22px] font-semibold text-ink lg:block">Navigation</h2>
          <p className="mb-4 hidden text-xs text-ink-soft/60 lg:block">Browse the community</p>

          <nav className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0">
            <button
              type="button"
              onClick={() => switchScope("public")}
              className={`${navItem} whitespace-nowrap ${scope === "public" ? navActive : navIdle}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              Public Feed
            </button>

            {groups.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => switchScope(g.id)}
                className={`${navItem} whitespace-nowrap ${scope === g.id ? navActive : navIdle}`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                <span className="truncate">{g.name}</span>
              </button>
            ))}

            <button
              type="button"
              onClick={() => switchScope("saved")}
              className={`${navItem} whitespace-nowrap ${scope === "saved" ? navActive : navIdle}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
              Saved Posts
            </button>
            <button
              type="button"
              onClick={() => switchScope("trending")}
              className={`${navItem} whitespace-nowrap ${scope === "trending" ? navActive : navIdle}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M23 6l-9.5 9.5-5-5L1 18" />
                <path d="M17 6h6v6" />
              </svg>
              Trending
            </button>
          </nav>

          <button
            type="button"
            onClick={() => setShowGroups((v) => !v)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ink px-3 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {showGroups ? "Close" : "Create New Group"}
          </button>

          {showGroups && (
            <div className="mt-3 space-y-4 rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
              <div>
                <p className="text-sm font-semibold text-ink">Create a group</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {GROUP_PRESETS.map((p) => (
                    <button
                      key={p.kind}
                      type="button"
                      onClick={() => {
                        setNewGroupKind(p.kind);
                        setNewGroupName(p.label);
                      }}
                      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                        newGroupKind === p.kind
                          ? "border-brand bg-brand/10 text-brand-dark"
                          : "border-stone-2 text-ink-soft hover:border-brand"
                      }`}
                    >
                      {p.emoji} {p.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={newGroupName}
                    onChange={(e) => {
                      setNewGroupName(e.target.value);
                      setNewGroupKind("custom");
                    }}
                    placeholder="Group name"
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
                <label className="mt-2 flex items-start gap-2 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={newGroupPublic}
                    onChange={(e) => setNewGroupPublic(e.target.checked)}
                    className="mt-0.5 accent-brand"
                  />
                  <span>
                    <span className="font-semibold text-ink">Make discoverable</span> — anyone can find
                    it under Suggested Groups and join without a code. Leave off for a private,
                    invite-only group.
                  </span>
                </label>
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

        {/* ---------------- CENTER FEED ---------------- */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Hero */}
          <div
            className="overflow-hidden rounded-2xl px-7 py-9 text-center text-white shadow-card"
            style={{
              background:
                "radial-gradient(120% 140% at 85% 15%, rgba(243,103,5,0.32), transparent 55%), linear-gradient(160deg, #2f2622, #1c1512)",
            }}
          >
            <p className="mb-2 font-display text-xs font-semibold tracking-[0.28em] text-brand">COMMUNITY</p>
            <h1 className="mb-3 text-balance font-display text-4xl font-semibold tracking-wide">SHARE &amp; CONNECT</h1>
            <p className="mx-auto max-w-md text-[15px] leading-relaxed text-white/75">
              Post updates and photos with the whole community, or privately with a group you create.
            </p>
          </div>

          {/* Composer — hidden on read-only views (Trending / Saved) */}
          {postable && (
            <div className="rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
              <div className="flex gap-3">
                <Avatar name={viewer.name} url={viewer.avatar || null} size={44} />
                <div className="min-w-0 flex-1">
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={2}
                    maxLength={3000}
                    placeholder={
                      pollMode
                        ? "Ask a question…"
                        : audience === "public"
                          ? "Share something with the community…"
                          : `Post to ${activeGroup?.name ?? "your group"}…`
                    }
                    className="w-full resize-none rounded-xl border border-stone-2 bg-stone-4 px-4 py-3 text-sm outline-none focus:border-brand focus:bg-white"
                  />
                  {pollMode && (
                    <div className="mt-3 space-y-2 rounded-xl border border-stone-2 bg-stone-4 p-3">
                      {pollOptions.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input
                            value={opt}
                            onChange={(e) =>
                              setPollOptions((o) => o.map((x, j) => (j === i ? e.target.value : x)))
                            }
                            placeholder={`Option ${i + 1}`}
                            maxLength={80}
                            className="w-full rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                          />
                          {pollOptions.length > 2 && (
                            <button
                              type="button"
                              onClick={() => setPollOptions((o) => o.filter((_, j) => j !== i))}
                              aria-label="Remove option"
                              className="flex-none text-ink-soft/50 hover:text-red-600"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      {pollOptions.length < 4 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions((o) => [...o, ""])}
                          className="text-sm font-semibold text-brand-dark hover:underline"
                        >
                          + Add option
                        </button>
                      )}
                    </div>
                  )}
                  {imageUrl && (
                    <div className="mt-2 overflow-hidden rounded-lg border border-stone-2">
                      {mediaType === "video" ? (
                        <video src={imageUrl} controls playsInline className="max-h-72 w-full bg-black object-contain" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="Attached" className="max-h-72 w-full object-cover" />
                      )}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-1">
                    {!pollMode && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-stone-4 disabled:opacity-60"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                          {uploading ? "Uploading…" : mediaType === "photo" ? "Change photo" : "Photo"}
                        </button>
                        <button
                          type="button"
                          onClick={() => videoRef.current?.click()}
                          disabled={uploading}
                          className="flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-stone-4 disabled:opacity-60"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" />
                          </svg>
                          {mediaType === "video" ? "Change video" : "Video"}
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setPollMode((v) => {
                          const next = !v;
                          if (next) clearMedia();
                          return next;
                        });
                      }}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                        pollMode ? "bg-brand/10 text-brand-dark" : "text-ink-soft hover:bg-stone-4"
                      }`}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M18 20V10M12 20V4M6 20v-6" />
                      </svg>
                      Poll
                    </button>
                    {imageUrl && (
                      <button
                        type="button"
                        onClick={clearMedia}
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
                    <input
                      ref={videoRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleVideo(f);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={submitPost}
                      disabled={
                        posting ||
                        uploading ||
                        (pollMode
                          ? !body.trim() || pollOptions.filter((o) => o.trim()).length < 2
                          : !body.trim() && !imageUrl)
                      }
                      className="ml-auto rounded-xl bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_-12px_rgba(243,103,5,0.85)] disabled:opacity-50"
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
          )}

          {/* Feed heading */}
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="font-display text-xl font-semibold text-ink">{scopeTitle}</h2>
            {activeGroup ? (
              <button
                type="button"
                onClick={() => setShowMembers((v) => !v)}
                className="rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-dark"
              >
                {showMembers ? "Hide members" : "Members & invites"}
              </button>
            ) : scope === "public" ? (
              <span className="text-[13px] text-ink-soft/60">
                Sort by: <b className="font-semibold text-brand-dark">Recent</b>
              </span>
            ) : scope === "trending" ? (
              <span className="text-[13px] text-ink-soft/60">Most engaging this week</span>
            ) : (
              <span className="text-[13px] text-ink-soft/60">Only you can see this</span>
            )}
          </div>

          {activeGroup && showMembers && (
            <div className="-mt-2">
              <GroupMembers group={activeGroup} viewerId={viewer.id} onLeft={handleLeft} />
            </div>
          )}

          {/* Feed */}
          {loadingFeed ? (
            <p className="py-10 text-center text-sm text-ink-soft/50">Loading…</p>
          ) : feed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-10 text-center">
              <p className="text-sm text-ink-soft/70">
                {scope === "public"
                  ? "No posts yet — be the first to share something."
                  : scope === "trending"
                    ? "Nothing trending yet — the most-liked and most-discussed posts of the week show up here."
                    : scope === "saved"
                      ? "No saved posts yet. Tap Save on any post to bookmark it here."
                      : "No posts in this group yet. Start the conversation."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {feed.map((p) => (
                <article key={p.id} className="rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
                  <div className="flex items-start gap-3">
                    <Avatar name={p.author_name} url={p.author_avatar} />
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="flex items-center gap-2">
                        <p className="text-[14.5px] font-semibold text-ink">{p.author_name}</p>
                        {p.visibility === "group" && (
                          <span className="rounded-full bg-stone-4 px-2 py-0.5 text-[11px] font-medium text-ink-soft/70">
                            🔒 Group
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft/50">{timeAgo(p.created_at)}</p>
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

                  {p.body && <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-ink">{p.body}</p>}

                  {p.poll && (
                    <div className="mt-3 flex flex-col gap-2">
                      {p.poll.options.map((o) => {
                        const total = p.poll!.total;
                        const pct = total ? Math.round((o.votes / total) * 100) : 0;
                        const mine = p.poll!.my_vote === o.id;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => votePollOption(p, o.id)}
                            className={`relative overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                              mine ? "border-brand" : "border-stone-2 hover:border-brand/60"
                            }`}
                          >
                            <span
                              className="absolute inset-y-0 left-0 bg-brand/10"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="relative flex items-center justify-between gap-2">
                              <span className={mine ? "font-semibold text-brand-dark" : "text-ink"}>
                                {o.label}
                                {mine && " ✓"}
                              </span>
                              <span className="text-xs font-medium text-ink-soft/60">{pct}%</span>
                            </span>
                          </button>
                        );
                      })}
                      <p className="text-xs text-ink-soft/50">
                        {p.poll.total} {p.poll.total === 1 ? "vote" : "votes"}
                        {p.poll.my_vote ? " · tap to change" : " · tap an option to vote"}
                      </p>
                    </div>
                  )}

                  {p.image_url &&
                    (p.media_type === "video" ? (
                      <video
                        src={p.image_url}
                        controls
                        playsInline
                        className="mt-3 max-h-[32rem] w-full rounded-xl border border-stone-2 bg-black object-contain"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setLightbox(p.image_url)}
                        className="mt-3 block w-full overflow-hidden rounded-xl border border-stone-2"
                        aria-label="View photo"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image_url}
                          alt=""
                          className="max-h-[32rem] w-full cursor-zoom-in object-cover"
                        />
                      </button>
                    ))}

                  {(p.like_count > 0 || p.comment_count > 0) && (
                    <p className="mt-3 text-right text-xs text-ink-soft/50">
                      {p.like_count > 0 && `${p.like_count} Like${p.like_count === 1 ? "" : "s"}`}
                      {p.like_count > 0 && p.comment_count > 0 && " · "}
                      {p.comment_count > 0 && `${p.comment_count} Comment${p.comment_count === 1 ? "" : "s"}`}
                    </p>
                  )}

                  <div className="mt-2 flex items-center gap-1 border-t border-stone-2 pt-2">
                    <button
                      type="button"
                      onClick={() => toggleLike(p)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13.5px] font-semibold transition-colors hover:bg-stone-4 ${
                        p.liked_by_me ? "text-brand-dark" : "text-ink-soft hover:text-brand-dark"
                      }`}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={p.liked_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
                      </svg>
                      Like
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleComments(p.id)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-stone-4 hover:text-brand-dark"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 11.5a8.4 8.4 0 0 1-12.8 7.5L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" />
                      </svg>
                      Comment
                    </button>
                    <button
                      type="button"
                      onClick={() => sharePost(p)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13.5px] font-semibold text-ink-soft transition-colors hover:bg-stone-4 hover:text-brand-dark"
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="18" cy="5" r="3" />
                        <circle cx="6" cy="12" r="3" />
                        <circle cx="18" cy="19" r="3" />
                        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
                      </svg>
                      {copiedId === p.id ? "Copied!" : "Share"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleSave(p)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13.5px] font-semibold transition-colors hover:bg-stone-4 ${
                        p.saved_by_me ? "text-brand-dark" : "text-ink-soft hover:text-brand-dark"
                      }`}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill={p.saved_by_me ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                      {p.saved_by_me ? "Saved" : "Save"}
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

        {/* ---------------- RIGHT RAIL ---------------- */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
            <h3 className="font-display text-[21px] font-semibold text-ink">Discovery</h3>
            <p className="mb-5 text-xs text-ink-soft/60">Expand your circle</p>

            {/* Suggested groups */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-dark">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v8M8 12h8" />
                </svg>
                Suggested Groups
              </div>
              {suggested.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-2 p-3 text-center text-xs text-ink-soft/60">
                  No public groups to join yet. Tick “Make discoverable” when you create one.
                </p>
              ) : (
                <div className="space-y-3">
                  {suggested.map((g) => (
                    <div key={g.id} className="flex items-center gap-3">
                      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand to-brand-deep text-white">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                      </span>
                      <span className="min-w-0 leading-tight">
                        <b className="block truncate text-[13.5px] text-ink">{g.name}</b>
                        <small className="block text-[11.5px] text-ink-soft/60">
                          {g.member_count} {g.member_count === 1 ? "member" : "members"}
                        </small>
                      </span>
                      <button
                        type="button"
                        onClick={() => joinSuggested(g)}
                        disabled={groupBusy}
                        className="ml-auto flex-none rounded-full border border-stone-2 px-3 py-1 text-xs font-semibold text-brand-dark transition-colors hover:border-brand disabled:opacity-50"
                      >
                        Join
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming events */}
            <div className="mb-6">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-bold text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-brand-dark">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                Upcoming Events
                <button
                  type="button"
                  onClick={() => setShowEventForm((v) => !v)}
                  className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-lg leading-none text-brand-dark hover:bg-brand/10"
                  aria-label={showEventForm ? "Close event form" : "Add event"}
                >
                  {showEventForm ? "×" : "+"}
                </button>
              </div>

              {showEventForm && (
                <div className="mb-3 space-y-2 rounded-xl border border-stone-2 bg-stone-4 p-3">
                  <input
                    value={evTitle}
                    onChange={(e) => setEvTitle(e.target.value)}
                    placeholder="Event name"
                    maxLength={120}
                    className="w-full rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    value={evLocation}
                    onChange={(e) => setEvLocation(e.target.value)}
                    placeholder="Location (optional)"
                    maxLength={120}
                    className="w-full rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="datetime-local"
                    value={evWhen}
                    onChange={(e) => setEvWhen(e.target.value)}
                    className="w-full rounded-lg border border-stone-2 bg-white px-3 py-2 text-sm text-ink-soft outline-none focus:border-brand"
                  />
                  <button
                    type="button"
                    onClick={doCreateEvent}
                    disabled={evBusy || !evTitle.trim() || !evWhen}
                    className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {evBusy ? "Adding…" : "Add event"}
                  </button>
                  {evMsg && <p className="text-xs text-red-600">{evMsg}</p>}
                </div>
              )}

              {events.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-2 p-3 text-center text-xs text-ink-soft/60">
                  No upcoming events yet. Tap + to add one.
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((ev) => (
                    <div key={ev.id} className="rounded-xl border border-stone-2 bg-stone-4 p-3">
                      <p className="text-[10.5px] font-bold tracking-wide text-brand-dark">
                        {eventWhen(ev.starts_at)}
                        {ev.location ? ` · ${ev.location.toUpperCase()}` : ""}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-ink">{ev.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11.5px] text-ink-soft/60">
                          {ev.going_count} going
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleRsvp(ev)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                            ev.rsvped_by_me
                              ? "bg-brand text-white"
                              : "border border-stone-2 text-ink-soft hover:border-brand hover:text-brand-dark"
                          }`}
                        >
                          {ev.rsvped_by_me ? "Going ✓" : "RSVP"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-4 border-t border-stone-2 pt-4 text-xs text-ink-soft/60">
              <a href="/privacy" className="hover:text-brand-dark">Privacy</a>
              <a href="/terms" className="hover:text-brand-dark">Terms</a>
              <a href="/guides" className="hover:text-brand-dark">Guides</a>
            </div>
            <p className="mt-2 text-[11px] text-ink-soft/40">© 2026 Bridal Team Inc.</p>
          </div>
        </aside>
      </div>

      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-label="Photo"
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </>
  );
}
