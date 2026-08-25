"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleLike } from "@/app/inspiration/actions";
import { SIGNUP_URL } from "@/lib/config";

/**
 * Heart + count. Optimistically flips, then persists. Signed-out users get a
 * gentle nudge to sign up rather than a dead button.
 */
export default function LikeButton({
  imageId,
  initialLiked,
  initialCount,
  signedIn,
  className = "",
}: {
  imageId: string;
  initialLiked: boolean;
  initialCount: number;
  signedIn: boolean;
  className?: string;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [prompt, setPrompt] = useState(false);
  const [, startTransition] = useTransition();

  function onClick() {
    if (!signedIn) {
      setPrompt(true);
      return;
    }
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    startTransition(() => {
      void toggleLike(imageId, liked);
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={liked}
        aria-label={liked ? "Unlike" : "Like"}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-sm font-semibold text-ink shadow backdrop-blur transition-colors hover:text-brand-text"
      >
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill={liked ? "#e0245e" : "none"} stroke={liked ? "#e0245e" : "currentColor"} strokeWidth="2">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
        {count > 0 && <span>{count}</span>}
      </button>
      {prompt && (
        <p className="mt-1 text-xs text-ink-soft/70">
          <Link href={SIGNUP_URL} className="font-semibold text-brand-text">Sign up</Link> to like &amp; save ideas.
        </p>
      )}
    </div>
  );
}
