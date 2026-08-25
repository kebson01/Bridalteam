import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getPost, getPublicPost } from "@/app/community/actions";
import { supabaseServer } from "@/lib/supabase/server";
import { SHOW_PLANNER_APP } from "@/lib/flags";

export const metadata: Metadata = {
  title: "Post — Community",
  description: "A post shared from the Bridal Team community.",
};

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/**
 * Shareable permalink for a single community post. RLS still applies inside
 * getPost, so a private group post only resolves for its members.
 */
export default async function CommunityPostPage({ params }: { params: Promise<{ id: string }> }) {
  if (!SHOW_PLANNER_APP) notFound();
  const { id } = await params;

  const supabase = await supabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Signed-out visitors can view public posts; anything else sends them to log
  // in (a private group post may resolve once they're signed in).
  const post = user ? await getPost(id) : await getPublicPost(id);
  if (!post) {
    if (!user) redirect(`/auth/login?next=/community/p/${id}`);
    notFound();
  }

  const initial = (post.author_name || "?").charAt(0).toUpperCase();

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/community"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft transition-colors hover:text-brand-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to Community
      </Link>

      <article className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
        <div className="flex items-center gap-3">
          {post.author_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.author_avatar} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />
          ) : (
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-base font-semibold text-white">
              {initial}
            </span>
          )}
          <div className="leading-tight">
            <p className="text-[15px] font-semibold text-ink">{post.author_name}</p>
            <p className="text-xs text-ink-soft/50">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {post.body && (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed text-ink">{post.body}</p>
        )}

        {post.image_url &&
          (post.media_type === "video" ? (
            <video
              src={post.image_url}
              controls
              playsInline
              className="mt-4 max-h-[34rem] w-full rounded-xl border border-stone-2 bg-black object-contain"
            />
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-stone-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt="" className="max-h-[34rem] w-full object-cover" />
            </div>
          ))}

        <div className="mt-5 flex items-center gap-5 border-t border-stone-2 pt-4 text-sm text-ink-soft/70">
          <span className="flex items-center gap-1.5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {post.like_count} {post.like_count === 1 ? "like" : "likes"}
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M21 11.5a8.4 8.4 0 0 1-12.8 7.5L3 21l1.9-5.2A8.4 8.4 0 1 1 21 11.5z" />
            </svg>
            {post.comment_count} {post.comment_count === 1 ? "comment" : "comments"}
          </span>
        </div>
      </article>

      <Link
        href={user ? "/community" : "/auth/signup?next=/community"}
        className="mt-5 block w-full rounded-xl bg-gradient-to-r from-brand to-brand-dark py-3 text-center text-sm font-bold text-white shadow-[0_12px_26px_-12px_rgba(243,103,5,0.85)]"
      >
        {user ? "Open in Community" : "Join free to like & comment"}
      </Link>
    </section>
  );
}
