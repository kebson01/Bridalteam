"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addComment,
  deleteComment,
  listComments,
  type InspirationComment,
} from "@/app/inspiration/actions";

/**
 * Comments thread for a piece of inspiration, shown in the lightbox. Loads on
 * open; signed-in couples can add a comment and delete their own. Keeps the
 * social layer consistent with likes/save/share on the same item.
 */
export default function InspirationComments({
  imageId,
  signedIn,
  userId,
  onNeedSignin,
}: {
  imageId: string;
  signedIn: boolean;
  userId: string | null;
  onNeedSignin?: () => void;
}) {
  const [comments, setComments] = useState<InspirationComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    setLoading(true);
    listComments(imageId).then((c) => {
      if (active) {
        setComments(c);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [imageId]);

  function submit() {
    if (!signedIn) {
      onNeedSignin?.();
      return;
    }
    const body = text.trim();
    if (!body) return;
    startTransition(async () => {
      const res = await addComment(imageId, body);
      if (res.ok) {
        setComments((cs) => [...cs, res.comment]);
        setText("");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const res = await deleteComment(id);
      if (res.ok) setComments((cs) => cs.filter((c) => c.id !== id));
    });
  }

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col border-t border-stone-2 pt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft/50">
        Comments{comments.length > 0 ? ` (${comments.length})` : ""}
      </p>

      <div className="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm text-ink-soft/50">Loading…</p>
        ) : comments.length === 0 ? (
          <p className="text-sm text-ink-soft/50">No comments yet. Start the conversation.</p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="group flex items-start gap-2">
              {c.author_avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.author_avatar}
                  alt=""
                  className="mt-0.5 h-7 w-7 flex-none rounded-full object-cover"
                />
              ) : (
                <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand/15 text-xs font-semibold text-brand-dark">
                  {c.author_name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink">
                  <span className="font-semibold">{c.author_name}</span>{" "}
                  <span className="text-ink-soft/85">{c.body}</span>
                </p>
              </div>
              {userId && c.user_id === userId && (
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  disabled={pending}
                  aria-label="Delete comment"
                  className="flex-none text-ink-soft/30 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100 disabled:opacity-40"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {signedIn ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="Add a comment…"
            maxLength={1000}
            disabled={pending}
            className="w-full rounded-full border border-stone-2 px-4 py-2 text-sm outline-none focus:border-brand disabled:opacity-60"
          />
          <button
            type="button"
            onClick={submit}
            disabled={pending || !text.trim()}
            className="flex-none rounded-full bg-gradient-to-r from-brand to-brand-dark px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Post
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onNeedSignin}
          className="mt-3 text-left text-sm text-brand-dark"
        >
          Sign in to comment
        </button>
      )}
    </div>
  );
}
