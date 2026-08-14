"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveInspiration, reportImage } from "@/app/inspiration/actions";
import LikeButton from "@/components/like-button";
import ShareButton from "@/components/share-button";
import { SIGNUP_URL } from "@/lib/config";
import InspirationComments from "@/components/inspiration-comments";
import { posterFor, isDirectVideoFile } from "@/lib/media";

export interface InspirationImage {
  id: string;
  image_url: string;
  title: string;
  theme: string | null;
  colors: string[];
  media_type: string;
  media_url: string | null;
  like_count?: number;
}

/** Small badge shown on non-photo tiles. */
export function MediaBadge({ type }: { type: string }) {
  if (type === "video") {
    return (
      <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </span>
    );
  }
  if (type === "audio") {
    return (
      <span className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
      </span>
    );
  }
  return null;
}

/** Renders the playable media for the lightbox by type. */
export function MediaPlayer({ item }: { item: InspirationImage }) {
  const still = posterFor(item);
  if (item.media_type === "video" && item.media_url) {
    const embed = toEmbed(item.media_url);
    if (embed) {
      return (
        <div className="aspect-video w-full bg-black">
          <iframe src={embed} title={item.title} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen className="h-full w-full" />
        </div>
      );
    }
    return (
      // eslint-disable-next-line jsx-a11y/media-has-caption
      <video controls poster={still ?? undefined} src={item.media_url} className="h-full max-h-[80vh] w-full bg-black object-contain" />
    );
  }
  if (item.media_type === "audio" && item.media_url) {
    return (
      <div className="flex h-full flex-col">
        {still ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={still} alt={item.title} className="h-full w-full object-cover" />
        ) : (
          <MediaPlaceholder type="audio" />
        )}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio controls src={item.media_url} className="w-full" />
      </div>
    );
  }
  // photo (or video/audio missing its source): show the image if we have one.
  if (still) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={still} alt={item.title} className="h-full w-full object-cover" />;
  }
  return <MediaPlaceholder type={item.media_type} />;
}

/** Neutral stand-in when an item has no usable still image. */
export function MediaPlaceholder({ type }: { type: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-3 to-stone-4 text-white/70">
      {type === "audio" ? (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
      ) : (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      )}
    </div>
  );
}

/** The still shown on a grid tile: a poster image, a video first frame, or a placeholder. */
export function TileVisual({ item }: { item: InspirationImage }) {
  const poster = posterFor(item);
  if (poster) {
    return (
      <Image src={poster} alt={item.title} fill unoptimized
        sizes="(max-width: 1024px) 100vw, 33vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105" />
    );
  }
  if (item.media_type === "video" && isDirectVideoFile(item.media_url)) {
    return (
      // Muted first-frame preview stands in for a poster.
      <video src={item.media_url ?? undefined} muted playsInline preload="metadata"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
    );
  }
  return <MediaPlaceholder type={item.media_type} />;
}

/** Converts a YouTube/Vimeo watch URL to its embed URL; null for direct files. */
function toEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vim = url.match(/vimeo\.com\/(\d+)/);
  if (vim) return `https://player.vimeo.com/video/${vim[1]}`;
  return null;
}

const SWATCH: Record<string, string> = {
  Blush: "#e8b4b8", Coral: "#f28f6b", Sage: "#9caf88",
  Navy: "#2f3b52", Champagne: "#e6d3ac", Burgundy: "#6e2233",
};

const chipBase = "rounded-full border px-4 py-2 text-sm transition-colors";

export default function InspirationGallery({
  images,
  signedIn,
  likedIds = [],
  userId = null,
}: {
  images: InspirationImage[];
  signedIn: boolean;
  likedIds?: string[];
  userId?: string | null;
}) {
  const [theme, setTheme] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [open, setOpen] = useState<InspirationImage | null>(null);
  const likedSet = useMemo(() => new Set(likedIds), [likedIds]);

  const themes = useMemo(
    () => [...new Set(images.map((i) => i.theme).filter(Boolean))] as string[],
    [images],
  );
  const colors = useMemo(
    () => [...new Set(images.flatMap((i) => i.colors))].sort(),
    [images],
  );

  const shown = useMemo(
    () =>
      images.filter(
        (it) =>
          (!theme || it.theme === theme) && (!color || it.colors.includes(color)),
      ),
    [images, theme, color],
  );

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setTheme(null)} aria-pressed={theme === null}
          className={`${chipBase} ${theme === null ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
          All themes
        </button>
        {themes.map((t) => (
          <button key={t} type="button" onClick={() => setTheme(t === theme ? null : t)} aria-pressed={t === theme}
            className={`${chipBase} ${t === theme ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
            {t}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setColor(null)} aria-pressed={color === null}
          className={`${chipBase} ${color === null ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
          All colors
        </button>
        {colors.map((c) => (
          <button key={c} type="button" onClick={() => setColor(c === color ? null : c)} aria-pressed={c === color}
            className={`${chipBase} inline-flex items-center gap-2 ${c === color ? "border-brand bg-brand text-white" : "border-stone-2 bg-white text-ink-soft hover:border-brand"}`}>
            <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: SWATCH[c] ?? "#ccc" }} />
            {c}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-ink-soft/60">
        {shown.length === images.length ? `${images.length} looks` : `${shown.length} of ${images.length} looks`}
      </p>

      {/* Grid — tiles open a detail view */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => setOpen(it)}
            className="group relative aspect-[4/5] overflow-hidden rounded-2xl text-left shadow-card"
          >
            <TileVisual item={it} />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
            <MediaBadge type={it.media_type} />
            <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
              <p className="text-lg font-medium">{it.title}</p>
              <p className="text-sm text-white/75">
                {[it.theme, it.colors.join(", ")].filter(Boolean).join(" · ")}
              </p>
            </figcaption>
          </button>
        ))}
      </div>

      {open && (
        <Lightbox
          image={open}
          signedIn={signedIn}
          userId={userId}
          liked={likedSet.has(open.id)}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

function Lightbox({
  image,
  signedIn,
  userId,
  liked,
  onClose,
}: {
  image: InspirationImage;
  signedIn: boolean;
  userId: string | null;
  liked: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "signin" | "pick" | "error">("idle");
  const [report, setReport] = useState<"idle" | "open" | "sent">("idle");
  const [reportReason, setReportReason] = useState("");

  function submitReport() {
    startTransition(async () => {
      await reportImage(image.id, reportReason);
      setReport("sent");
      setReportReason("");
    });
  }

  function save() {
    if (!signedIn) {
      setStatus("signin");
      return;
    }
    startTransition(async () => {
      const res = await saveInspiration(image.id);
      if (res.ok) setStatus("saved");
      else if (res.error === "sign_in") setStatus("signin");
      else if (res.error === "pick_wedding") setStatus("pick");
      else if (res.error === "no_wedding") setStatus("pick");
      else setStatus("error");
    });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-stone-4 sm:aspect-auto sm:w-2/3">
          <MediaPlayer item={image} />
        </div>

        <div className="flex w-full flex-col p-6 sm:w-1/3">
          <h2 className="text-xl font-medium text-ink">{image.title}</h2>
          {image.theme && <p className="mt-1 text-sm text-ink-soft/70">{image.theme}</p>}

          <div className="mt-3 flex items-center gap-2">
            <LikeButton
              imageId={image.id}
              initialLiked={liked}
              initialCount={image.like_count ?? 0}
              signedIn={signedIn}
            />
            <ShareButton
              url={typeof window !== "undefined" ? `${window.location.origin}/i/${image.id}` : `/i/${image.id}`}
              title={image.title}
            />
          </div>

          {image.colors.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {image.colors.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full border border-stone-2 px-3 py-1 text-xs text-ink-soft">
                  <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ backgroundColor: SWATCH[c] ?? "#ccc" }} />
                  {c}
                </span>
              ))}
            </div>
          )}

          <InspirationComments
            imageId={image.id}
            signedIn={signedIn}
            userId={userId}
            onNeedSignin={() => setStatus("signin")}
          />

          <div className="pt-4">
            {status === "saved" ? (
              <p className="rounded-full bg-green-100 px-5 py-3 text-center text-sm font-semibold text-green-800">
                ♥ Saved to your wedding
              </p>
            ) : status === "signin" ? (
              <div className="text-center">
                <p className="text-sm text-ink-soft/75">Sign up free to save ideas to your wedding.</p>
                <Link href={SIGNUP_URL} className="mt-3 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white">
                  Sign up to save
                </Link>
              </div>
            ) : status === "pick" ? (
              <p className="text-center text-sm text-ink-soft/75">
                Open a specific wedding to save this idea to it.
              </p>
            ) : (
              <button
                type="button"
                onClick={save}
                disabled={pending}
                className="w-full rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white disabled:opacity-70"
              >
                {pending ? "Saving…" : "♥ Save this idea"}
              </button>
            )}
            {status === "error" && (
              <p className="mt-2 text-center text-sm text-red-600">Couldn&rsquo;t save. Try again.</p>
            )}
          </div>

          {/* Report */}
          <div className="mt-4 border-t border-stone-2 pt-3 text-center">
            {report === "sent" ? (
              <p className="text-xs text-ink-soft/60">Thanks — we&rsquo;ll review this image.</p>
            ) : report === "open" ? (
              <div className="space-y-2">
                <input
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="What's wrong with this image? (optional)"
                  maxLength={500}
                  className="w-full rounded-lg border border-stone-2 px-3 py-2 text-xs outline-none focus:border-brand"
                />
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={submitReport}
                    disabled={pending}
                    className="rounded-full bg-red-600 px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {pending ? "Sending…" : "Submit report"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setReport("idle")}
                    className="text-xs text-ink-soft/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setReport("open")}
                className="text-xs text-ink-soft/50 hover:text-red-600"
              >
                ⚑ Report this image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
