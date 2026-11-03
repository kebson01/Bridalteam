"use client";

import Image from "next/image";
import Link from "next/link";
import { Fragment, useMemo, useState, useTransition } from "react";
import { saveInspiration, reportImage, toggleLike } from "@/app/inspiration/actions";
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
  source?: string;
  is_seed?: boolean | null;
  retired_at?: string | null;
}

/** Label for Bridal Team's own starter content (see lib/seed-content.ts). */
export const SEED_LABEL = "Bridal Team Ideas";

export function SeedBadge() {
  return (
    <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-ink shadow">
      {SEED_LABEL}
    </span>
  );
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

const chip =
  "inline-flex flex-none items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors";
const chipOn = "border-ink bg-ink text-white";
const chipOff = "border-stone-2 bg-white text-ink-soft hover:border-brand";

/** How many looks show before "Load more", and how many each click adds. */
export const PAGE_SIZE = 12;
/** The mood board card goes in after this many tiles (when there are more). */
const PROMO_AFTER = 6;

function Heart({ filled, className = "h-[18px] w-[18px]" }: { filled: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true"
      fill={filled ? "#e0245e" : "none"} stroke={filled ? "#e0245e" : "currentColor"} strokeWidth="2">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

export default function InspirationGallery({
  images,
  signedIn,
  likedIds = [],
  userId = null,
  promo = null,
}: {
  images: InspirationImage[];
  signedIn: boolean;
  likedIds?: string[];
  userId?: string | null;
  /** A full-width card placed inside the grid, e.g. the mood board call to action. */
  promo?: React.ReactNode;
}) {
  const [theme, setTheme] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [open, setOpen] = useState<InspirationImage | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [liked, setLiked] = useState<Set<string>>(() => new Set(likedIds));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [nudge, setNudge] = useState(false);
  const [, startTransition] = useTransition();

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
  const visible = shown.slice(0, limit);

  function pickTheme(t: string | null) {
    setTheme(t);
    setLimit(PAGE_SIZE);
  }
  function pickColor(c: string | null) {
    setColor(c);
    setLimit(PAGE_SIZE);
  }

  /** The heart on a tile: the same like as in the detail view. */
  function toggle(it: InspirationImage) {
    if (!signedIn) {
      setNudge(true);
      return;
    }
    const was = liked.has(it.id);
    setLiked((prev) => {
      const next = new Set(prev);
      if (was) next.delete(it.id);
      else next.add(it.id);
      return next;
    });
    setCounts((c) => ({ ...c, [it.id]: (c[it.id] ?? it.like_count ?? 0) + (was ? -1 : 1) }));
    startTransition(() => {
      void toggleLike(it.id, was);
    });
  }

  return (
    <>
      {/* Filters: one scrolling row each, so a phone isn't half chips */}
      <div className="-mx-5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
        <div className="flex gap-2 sm:flex-wrap sm:justify-center">
          <button type="button" onClick={() => pickTheme(null)} aria-pressed={theme === null}
            className={`${chip} ${theme === null ? chipOn : chipOff}`}>
            All themes
          </button>
          {themes.map((t) => (
            <button key={t} type="button" onClick={() => pickTheme(t === theme ? null : t)} aria-pressed={t === theme}
              className={`${chip} ${t === theme ? chipOn : chipOff}`}>
              {t}
            </button>
          ))}
        </div>
      </div>
      {colors.length > 0 && (
        <div className="-mx-5 mt-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none]">
          <div className="flex gap-2 sm:flex-wrap sm:justify-center">
            <button type="button" onClick={() => pickColor(null)} aria-pressed={color === null}
              className={`${chip} py-1.5 text-[13px] ${color === null ? "border-brand bg-brand-wash text-ink" : chipOff}`}>
              <span className="h-3 w-3 rounded-full bg-[conic-gradient(#e8b4b8,#e6d3ac,#9caf88,#2f3b52,#6e2233,#f28f6b,#e8b4b8)]" />
              All colors
            </button>
            {colors.map((c) => (
              <button key={c} type="button" onClick={() => pickColor(c === color ? null : c)} aria-pressed={c === color}
                className={`${chip} py-1.5 text-[13px] ${c === color ? "border-brand bg-brand-wash text-ink" : chipOff}`}>
                <span className="h-3 w-3 rounded-full ring-1 ring-black/10" style={{ backgroundColor: SWATCH[c] ?? "#ccc" }} />
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {shown.length !== images.length && (
        <p className="mt-5 text-center text-sm text-ink-soft/60">
          {shown.length} of {images.length} looks
        </p>
      )}

      {/* Grid: tiles open a detail view; the heart likes without opening */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
        {visible.map((it, i) => {
          const isLiked = liked.has(it.id);
          const tag = [it.theme, it.colors[0]].filter(Boolean).join(" · ");
          return (
            <Fragment key={it.id}>
              {promo && i === PROMO_AFTER && <div className="col-span-full">{promo}</div>}
              <div className="group relative aspect-[3/4] overflow-hidden rounded-2xl shadow-card">
                <button
                  type="button"
                  onClick={() => setOpen(it)}
                  aria-label={`Open ${it.title}`}
                  className="absolute inset-0 text-left"
                >
                  <TileVisual item={it} />
                  <span className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/5 to-transparent" />
                  {tag && (
                    <span className="absolute left-2.5 top-2.5 max-w-[70%] truncate rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[10px]">
                      {tag}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-4">
                    <span className="block truncate font-display text-[15px] font-medium leading-snug sm:text-lg">{it.title}</span>
                    <span className="block truncate text-[11px] text-white/75 sm:text-xs">
                      {it.is_seed ? SEED_LABEL : it.colors.join(", ") || it.theme}
                    </span>
                  </span>
                </button>
                {it.media_type !== "photo" && (
                  <span className="pointer-events-none absolute inset-0 [&>span]:left-auto [&>span]:right-14 [&>span]:top-2.5">
                    <MediaBadge type={it.media_type} />
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => toggle(it)}
                  aria-pressed={isLiked}
                  aria-label={isLiked ? `Unsave ${it.title}` : `Save ${it.title}`}
                  className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition-transform hover:scale-105 sm:right-2.5 sm:top-2.5"
                >
                  <Heart filled={isLiked} />
                </button>
              </div>
            </Fragment>
          );
        })}
        {promo && visible.length > 0 && visible.length <= PROMO_AFTER && (
          <div className="col-span-full">{promo}</div>
        )}
      </div>

      {shown.length === 0 && (
        <p className="mt-10 text-center text-sm text-ink-soft/70">
          No looks match that combination yet.{" "}
          <button type="button" onClick={() => { pickTheme(null); pickColor(null); }} className="font-semibold text-brand-text">
            Clear filters
          </button>
        </p>
      )}

      {shown.length > visible.length && (
        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-full border border-stone-2 bg-white px-6 py-3 text-sm font-semibold text-ink shadow-sm hover:border-brand"
          >
            Load more looks
          </button>
          <p className="mt-3 text-xs text-ink-soft/60">
            Showing {visible.length} of {shown.length} looks
          </p>
        </div>
      )}

      {/* Saved looks, always in reach */}
      {(liked.size > 0 || nudge) && (
        <div className="fixed bottom-4 right-4 z-40 print:hidden">
          {nudge && !signedIn ? (
            <div className="flex items-center gap-3 rounded-full bg-ink py-2 pl-4 pr-2 text-sm text-white shadow-lg">
              <span>Sign up free to save looks</span>
              <Link href={SIGNUP_URL} className="rounded-full bg-gradient-to-r from-brand to-brand-dark px-4 py-1.5 font-semibold">
                Sign up
              </Link>
              <button type="button" onClick={() => setNudge(false)} aria-label="Dismiss" className="px-1 text-white/60 hover:text-white">
                ✕
              </button>
            </div>
          ) : (
            <Link
              href="/planner"
              className="flex items-center gap-2.5 rounded-full bg-ink py-2.5 pl-3 pr-4 text-white shadow-lg"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
                <Heart filled className="h-4 w-4" />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-semibold">
                  {liked.size} {liked.size === 1 ? "look" : "looks"} saved
                </span>
                <span className="block text-[11px] text-white/70">Build a mood board</span>
              </span>
            </Link>
          )}
        </div>
      )}

      {open && (
        <Lightbox
          image={{ ...open, like_count: counts[open.id] ?? open.like_count }}
          signedIn={signedIn}
          userId={userId}
          liked={liked.has(open.id)}
          onLikeChange={(on) => {
            setLiked((prev) => {
              const next = new Set(prev);
              if (on) next.add(open.id);
              else next.delete(open.id);
              return next;
            });
            setCounts((c) => ({ ...c, [open.id]: (c[open.id] ?? open.like_count ?? 0) + (on ? 1 : -1) }));
          }}
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
  onLikeChange,
  onClose,
}: {
  image: InspirationImage;
  signedIn: boolean;
  userId: string | null;
  liked: boolean;
  onLikeChange?: (liked: boolean) => void;
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
          {image.is_seed && (
            <p className="mt-2 text-xs text-ink-soft/60">
              {SEED_LABEL}: a look picked by the Bridal Team, not a couple&apos;s or vendor&apos;s own wedding.
            </p>
          )}

          <div className="mt-3 flex items-center gap-2">
            <LikeButton
              imageId={image.id}
              initialLiked={liked}
              initialCount={image.like_count ?? 0}
              signedIn={signedIn}
              onChange={onLikeChange}
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
