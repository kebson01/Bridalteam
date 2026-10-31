"use client";

import { useState, useTransition } from "react";
import { checkWeddingSlug, claimWeddingSlug, setWeddingWebsite } from "@/app/wedding/actions";
import { toSlug } from "@/lib/custom-site/slug";

export default function WebsiteManager({
  weddingId,
  initialPublished,
  initialWelcome,
  initialSlug,
  suggestedSlug,
  siteUrl,
}: {
  weddingId: string;
  initialPublished: boolean;
  initialWelcome: string;
  initialSlug: string | null;
  /** Shown before the couple has an address, e.g. "gene-and-john". */
  suggestedSlug: string;
  siteUrl: string;
}) {
  const [published, setPublished] = useState(initialPublished);
  const [welcome, setWelcome] = useState(initialWelcome);
  const [slug, setSlug] = useState<string | null>(initialSlug);
  const [msg, setMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [slugInput, setSlugInput] = useState(initialSlug ?? suggestedSlug);
  const [slugMsg, setSlugMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const host = siteUrl.replace(/^https?:\/\//, "");
  const typedSlug = toSlug(slugInput);
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

  function checkSlug() {
    if (!typedSlug || typedSlug === slug) return;
    start(async () => {
      const r = await checkWeddingSlug(weddingId, typedSlug);
      setSlugMsg(r.problem ? { ok: false, text: r.problem } : { ok: true, text: `${host}/wedding/${r.slug} is available.` });
    });
  }

  function saveSlug() {
    setSlugMsg(null);
    start(async () => {
      const r = await claimWeddingSlug(weddingId, typedSlug);
      if (!r.ok) {
        setSlugMsg({ ok: false, text: r.error });
        return;
      }
      const moved = slug !== null;
      setSlug(r.slug);
      setSlugInput(r.slug);
      setSlugMsg({
        ok: true,
        text: moved ? "Address changed. Old links will send guests here for the next 30 days." : "Address saved.",
      });
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

      <div className="mt-5">
        <label htmlFor="wedding-slug" className="block text-sm font-semibold text-ink">
          Web address
        </label>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-[1_1_16rem] items-center rounded-lg border border-stone-2 focus-within:border-brand">
            <span className="whitespace-nowrap pl-3 text-sm text-ink-soft/60">{host}/wedding/</span>
            <input
              id="wedding-slug"
              value={slugInput}
              onChange={(e) => {
                setSlugInput(e.target.value);
                setSlugMsg(null);
              }}
              onBlur={checkSlug}
              maxLength={60}
              spellCheck={false}
              autoCapitalize="none"
              className="min-w-0 flex-1 bg-transparent py-2.5 pr-3 text-sm text-ink outline-none"
            />
          </div>
          <button
            type="button"
            onClick={saveSlug}
            disabled={pending || !typedSlug || typedSlug === slug}
            className="flex-none rounded-full border border-stone-2 px-4 py-2 text-sm font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-text disabled:opacity-50"
          >
            {slug ? "Change address" : "Save address"}
          </button>
        </div>
        <p className={`mt-1.5 text-xs ${slugMsg && !slugMsg.ok ? "text-red-700" : "text-ink-soft/60"}`} role={slugMsg ? "status" : undefined}>
          {slugMsg?.text ??
            (typedSlug && typedSlug !== slugInput.trim()
              ? `Will be saved as ${typedSlug}.`
              : slug
                ? "If you change it, old links send guests to the new address for 30 days."
                : "Pick one now, or we'll use your names when you publish.")}
        </p>
      </div>

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
