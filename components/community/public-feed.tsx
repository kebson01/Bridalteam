import Link from "next/link";
import type { FeedPost } from "@/app/community/actions";

/**
 * Read-only community feed shown to signed-out visitors. Public posts are
 * viewable (and indexable) without an account; every action nudges toward
 * signing up. The full interactive experience (posting, liking, commenting,
 * groups, events) lives in the authenticated <Community> component.
 */

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" className="h-11 w-11 flex-none rounded-full object-cover" />;
  return (
    <span className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-base font-semibold text-white">
      {(name || "?").charAt(0).toUpperCase()}
    </span>
  );
}

export default function PublicFeed({ feed }: { feed: FeedPost[] }) {
  const signup = "/auth/signup?next=/community";
  const login = "/auth/login?next=/community";

  return (
    <section className="mx-auto max-w-2xl px-4 py-8">
      <header className="mb-6 rounded-2xl border border-stone-2 bg-gradient-to-br from-brand/5 to-transparent p-6 text-center">
        <h1 className="text-2xl font-bold text-ink">The Bridal Team Community</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft/80">
          Real weddings, advice, and inspiration from couples and vendors. Browse freely —
          create a free account to post, like, and join the conversation.
        </p>
        <div className="mt-4 flex items-center justify-center gap-3">
          <Link
            href={signup}
            className="rounded-xl bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_-12px_rgba(243,103,5,0.85)]"
          >
            Join free
          </Link>
          <Link href={login} className="text-sm font-semibold text-ink-soft transition-colors hover:text-brand-text">
            Log in
          </Link>
        </div>
      </header>

      {feed.length === 0 ? (
        <p className="py-16 text-center text-sm text-ink-soft/60">No posts yet. Be the first — join the community!</p>
      ) : (
        <div className="space-y-4">
          {feed.map((post) => (
            <article key={post.id} className="rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <Avatar name={post.author_name} url={post.author_avatar} />
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
                <Link href={login} className="ml-auto text-xs font-semibold text-brand-text hover:underline">
                  Log in to like &amp; comment
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-8 rounded-2xl bg-stone-1 p-6 text-center">
        <p className="text-sm font-semibold text-ink">Want to share your own wedding journey?</p>
        <Link
          href={signup}
          className="mt-3 inline-block rounded-xl bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-bold text-white"
        >
          Create your free account
        </Link>
      </div>
    </section>
  );
}
