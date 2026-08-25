"use client";

import { useState, useTransition } from "react";
import { markInquiryRead, type Inquiry } from "@/app/vendor/inquiry-actions";

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "just now";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Vendor lead inbox (Pro+). Lists inquiries and lets the vendor mark them read. */
export default function VendorInquiries({ initial }: { initial: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [, startTransition] = useTransition();
  const unread = items.filter((i) => !i.read).length;

  function markRead(id: string) {
    setItems((list) => list.map((i) => (i.id === id ? { ...i, read: true } : i)));
    startTransition(() => {
      markInquiryRead(id);
    });
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-ink">Inquiries</h2>
        {unread > 0 && (
          <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">{unread} new</span>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft/60">
          No inquiries yet. Couples who view your profile can message you here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i) => (
            <li
              key={i.id}
              className={`rounded-xl border p-4 ${i.read ? "border-stone-2" : "border-brand/40 bg-brand/5"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{i.from_name}</p>
                  <a href={`mailto:${i.from_email}`} className="text-xs text-brand-text hover:underline">
                    {i.from_email}
                  </a>
                </div>
                <span className="flex-none text-xs text-ink-soft/50">{timeAgo(i.created_at)}</span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-soft/85">{i.message}</p>
              {!i.read && (
                <button
                  type="button"
                  onClick={() => markRead(i.id)}
                  className="mt-2 text-xs font-semibold text-ink-soft/60 hover:text-brand-text"
                >
                  Mark as read
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
