"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import {
  listNotifications,
  markNotificationsRead,
  type AppNotification,
} from "@/app/community/actions";

function label(n: AppNotification): string {
  if (n.type === "group_post") return `${n.actor_name} posted in your group`;
  if (n.type === "reply") return `${n.actor_name} replied to your post`;
  return `${n.actor_name} liked your post`;
}

function timeAgo(iso: string): string {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return "now";
  const m = Math.round(secs / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/**
 * Header notification bell. Loads recent notifications, shows an unread badge,
 * and subscribes to Supabase Realtime so new ones arrive live. Opening the
 * panel marks everything read.
 */
export default function NotificationsBell({ userId }: { userId: string }) {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    listNotifications().then(({ items, unread }) => {
      if (!active) return;
      setItems(items);
      setUnread(unread);
    });

    const supabase = supabaseBrowser();
    const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          setItems((prev) => [payload.new as AppNotification, ...prev].slice(0, 30));
          setUnread((u) => u + 1);
        },
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
      markNotificationsRead();
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-stone-4 hover:text-brand-dark"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-[18px] text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-2xl border border-stone-2 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-stone-2 px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <Link href="/community" onClick={() => setOpen(false)} className="text-xs font-medium text-brand-dark">
              Open community
            </Link>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-soft/50">Nothing yet.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href="/community"
                  onClick={() => setOpen(false)}
                  className={`block border-b border-stone-2/60 px-4 py-3 transition-colors hover:bg-stone-4 ${
                    n.read ? "" : "bg-brand/5"
                  }`}
                >
                  <p className="text-sm text-ink">{label(n)}</p>
                  {n.preview && (
                    <p className="mt-0.5 truncate text-xs text-ink-soft/70">“{n.preview}”</p>
                  )}
                  <p className="mt-0.5 text-xs text-ink-soft/50">{timeAgo(n.created_at)}</p>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
