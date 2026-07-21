"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { saveInspiration } from "@/app/inspiration/actions";

export interface InspirationImage {
  id: string;
  image_url: string;
  title: string;
  theme: string | null;
  colors: string[];
}

const SWATCH: Record<string, string> = {
  Blush: "#e8b4b8", Coral: "#f28f6b", Sage: "#9caf88",
  Navy: "#2f3b52", Champagne: "#e6d3ac", Burgundy: "#6e2233",
};

const chipBase = "rounded-full border px-4 py-2 text-sm transition-colors";

export default function InspirationGallery({
  images,
  signedIn,
}: {
  images: InspirationImage[];
  signedIn: boolean;
}) {
  const [theme, setTheme] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [open, setOpen] = useState<InspirationImage | null>(null);

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
            <Image src={it.image_url} alt={it.title} fill unoptimized
              sizes="(max-width: 1024px) 100vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
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
        <Lightbox image={open} signedIn={signedIn} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

function Lightbox({
  image,
  signedIn,
  onClose,
}: {
  image: InspirationImage;
  signedIn: boolean;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | "signin" | "pick" | "error">("idle");

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

        <div className="relative aspect-[4/5] w-full bg-stone-4 sm:w-2/3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.image_url} alt={image.title} className="h-full w-full object-cover" />
        </div>

        <div className="flex w-full flex-col p-6 sm:w-1/3">
          <h2 className="text-xl font-medium text-ink">{image.title}</h2>
          {image.theme && <p className="mt-1 text-sm text-ink-soft/70">{image.theme}</p>}
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

          <div className="mt-auto pt-6">
            {status === "saved" ? (
              <p className="rounded-full bg-green-100 px-5 py-3 text-center text-sm font-semibold text-green-800">
                ♥ Saved to your wedding
              </p>
            ) : status === "signin" ? (
              <div className="text-center">
                <p className="text-sm text-ink-soft/75">Sign up free to save ideas to your wedding.</p>
                <Link href="/signup" className="mt-3 inline-flex rounded-full bg-gradient-to-r from-brand to-brand-dark px-6 py-3 text-sm font-semibold text-white">
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
        </div>
      </div>
    </div>
  );
}
