"use client";

import { useState, useTransition } from "react";
import { setWeddingWebsite } from "@/app/wedding/actions";

export default function WebsiteManager({
  weddingId,
  initialPublished,
  initialWelcome,
  initialSlug,
  siteUrl,
}: {
  weddingId: string;
  initialPublished: boolean;
  initialWelcome: string;
  initialSlug: string | null;
  siteUrl: string;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [welcome, setWelcome] = useState(initialWelcome);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const url = slug ? `${siteUrl}/wedding/${slug}` : null;

  function save(nextPublished: boolean) {
    setMsg(null);
    start(async () => {
      const res = await setWeddingWebsite({ weddingId, published: nextPublished, welcome });
      if (!res.ok) {
        setMsg(res.error ?? "Couldn't save.");
        return;
      }
      setPublished(Boolean(res.published));
      if (res.slug) setSlug(res.slug);
      setMsg(nextPublished ? "Your site is live." : "Saved.");
    });
  }

  function copy() {
    if (!url) return;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Guest website</h2>
          <p className="text-sm text-ink-soft/70">A shareable page where guests can RSVP.</p>
        </div>
        <span
          className={`flex-none rounded-full px-3 py-1 text-xs font-semibold ${
            published ? "bg-brand/10 text-brand-text" : "bg-stone-4 text-ink-soft/70"
          }`}
        >
          {published ? "Live" : "Draft"}
        </span>
      </div>

      {published && url && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-stone-2 bg-stone-4 p-2">
          <span className="min-w-0 flex-1 truncate px-2 text-sm text-ink-soft">{url}</span>
          <button
            type="button"
            onClick={copy}
            className="flex-none rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-brand-text shadow-sm"
          >
            {copied ? "Copied!" : "Copy link"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-none rounded-md border border-stone-2 px-3 py-1.5 text-xs font-semibold text-ink-soft hover:border-brand"
          >
            View
          </a>
        </div>
      )}

      <label className="mt-5 block text-sm font-semibold text-ink">Welcome message</label>
      <textarea
        value={welcome}
        onChange={(e) => setWelcome(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Tell your guests a little about your day…"
        className="mt-2 w-full resize-none rounded-lg border border-stone-2 px-3 py-2.5 text-sm outline-none focus:border-brand"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {published ? (
          <>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={pending}
              className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              onClick={() => save(false)}
              disabled={pending}
              className="rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand disabled:opacity-50"
            >
              Unpublish
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => save(true)}
            disabled={pending}
            className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Publishing…" : "Publish site"}
          </button>
        )}
        {msg && <span className="text-sm text-ink-soft/70">{msg}</span>}
      </div>
    </div>
  );
}
