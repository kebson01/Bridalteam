"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  deleteVendorReview,
  submitVendorReview,
  type VendorReview,
} from "@/app/vendor/review-actions";

function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24" fill={n <= Math.round(value) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" className="text-brand">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

export default function VendorReviews({
  vendorOrgId,
  viewerId,
  initialReviews,
}: {
  vendorOrgId: string;
  viewerId: string | null;
  initialReviews: VendorReview[];
}) {
  const [reviews, setReviews] = useState<VendorReview[]>(initialReviews);
  const mine = viewerId ? reviews.find((r) => r.reviewer_id === viewerId) : undefined;
  const [rating, setRating] = useState(mine?.rating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState(mine?.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const { avg, count } = useMemo(() => {
    if (reviews.length === 0) return { avg: 0, count: 0 };
    return { avg: reviews.reduce((s, r) => s + r.rating, 0) / reviews.length, count: reviews.length };
  }, [reviews]);

  function submit() {
    setError(null);
    if (rating < 1) {
      setError("Pick a star rating.");
      return;
    }
    start(async () => {
      const res = await submitVendorReview({ vendorOrgId, rating, body });
      if (!res.ok || !res.review) {
        setError(res.error === "sign_in" ? "Please log in to leave a review." : res.error ?? "Something went wrong.");
        return;
      }
      setReviews((list) => {
        const without = list.filter((r) => r.reviewer_id !== res.review!.reviewer_id);
        return [res.review!, ...without];
      });
    });
  }

  function removeMine() {
    if (!mine) return;
    if (!confirm("Delete your review?")) return;
    setReviews((list) => list.filter((r) => r.id !== mine.id));
    setRating(0);
    setBody("");
    deleteVendorReview(mine.id);
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-medium text-ink">Reviews</h2>
        {count > 0 && (
          <span className="flex items-center gap-1.5 text-sm text-ink-soft/70">
            <Stars value={avg} />
            <b className="text-ink">{avg.toFixed(1)}</b>
            <span>· {count} {count === 1 ? "review" : "reviews"}</span>
          </span>
        )}
      </div>

      {/* Write / edit form */}
      {viewerId ? (
        <div className="mt-4 rounded-2xl border border-stone-2 bg-white p-5 shadow-card">
          <p className="text-sm font-semibold text-ink">{mine ? "Your review" : "Leave a review"}</p>
          <div className="mt-2 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} star${n > 1 ? "s" : ""}`}
                className="p-0.5 text-brand"
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill={n <= (hover || rating) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Share your experience with this vendor…"
            className="mt-3 w-full resize-none rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand"
          />
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : mine ? "Update review" : "Post review"}
            </button>
            {mine && (
              <button type="button" onClick={removeMine} className="text-sm text-ink-soft/60 hover:text-red-600">
                Delete
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-5 text-sm text-ink-soft/70">
          <Link href="/auth/login?next=/vendors" className="font-semibold text-brand-text hover:underline">
            Log in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft/60">No reviews yet — be the first.</p>
      ) : (
        <ul className="mt-6 space-y-5">
          {reviews.map((r) => (
            <li key={r.id} className="border-b border-stone-2 pb-5 last:border-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-ink">{r.author_name}</p>
                <Stars value={r.rating} size={14} />
              </div>
              {r.body && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft/85">{r.body}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
