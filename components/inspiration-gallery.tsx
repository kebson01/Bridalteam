"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import {
  INSPIRATION,
  COLORS,
  THEMES,
  type Color,
  type Theme,
} from "@/lib/inspiration";

// Small swatch so the colour filters read as colours, not just words.
const SWATCH: Record<Color, string> = {
  Blush: "#e8b4b8",
  Coral: "#f28f6b",
  Sage: "#9caf88",
  Navy: "#2f3b52",
  Champagne: "#e6d3ac",
  Burgundy: "#6e2233",
};

const chipBase =
  "rounded-full border px-4 py-2 text-sm transition-colors";

export default function InspirationGallery() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [color, setColor] = useState<Color | null>(null);

  const items = useMemo(
    () =>
      INSPIRATION.filter(
        (it) =>
          (!theme || it.theme === theme) &&
          (!color || it.colors.includes(color)),
      ),
    [theme, color],
  );

  const hasFilter = theme !== null || color !== null;

  return (
    <>
      {/* Theme filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTheme(null)}
          aria-pressed={theme === null}
          className={`${chipBase} ${
            theme === null
              ? "border-brand bg-brand text-white"
              : "border-stone-2 bg-white text-ink-soft hover:border-brand"
          }`}
        >
          All themes
        </button>
        {THEMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t === theme ? null : t)}
            aria-pressed={t === theme}
            className={`${chipBase} ${
              t === theme
                ? "border-brand bg-brand text-white"
                : "border-stone-2 bg-white text-ink-soft hover:border-brand"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Colour filters */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setColor(null)}
          aria-pressed={color === null}
          className={`${chipBase} ${
            color === null
              ? "border-brand bg-brand text-white"
              : "border-stone-2 bg-white text-ink-soft hover:border-brand"
          }`}
        >
          All colors
        </button>
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c === color ? null : c)}
            aria-pressed={c === color}
            className={`${chipBase} inline-flex items-center gap-2 ${
              c === color
                ? "border-brand bg-brand text-white"
                : "border-stone-2 bg-white text-ink-soft hover:border-brand"
            }`}
          >
            <span
              className="h-3 w-3 rounded-full ring-1 ring-black/10"
              style={{ backgroundColor: SWATCH[c] }}
            />
            {c}
          </button>
        ))}
      </div>

      <p className="mt-6 text-sm text-ink-soft/60">
        {items.length === INSPIRATION.length
          ? `${INSPIRATION.length} looks`
          : `${items.length} of ${INSPIRATION.length} looks`}
        {hasFilter && (
          <button
            type="button"
            onClick={() => {
              setTheme(null);
              setColor(null);
            }}
            className="ml-3 font-semibold text-brand-dark hover:text-brand-deep"
          >
            Clear
          </button>
        )}
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-stone-2 bg-stone-4 p-12 text-center text-ink-soft/75">
          No looks match that combination yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <figure
              key={it.id}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card"
            >
              <Image
                src={it.img}
                alt={it.title}
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                // External placeholders serve straight from their CDN rather
                // than through Next's optimizer — they're already sized, and it
                // avoids a server-side fetch per image. Local brand images stay
                // optimized. Real hosted photos can drop this later.
                unoptimized={it.img.startsWith("http")}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-lg font-medium">{it.title}</p>
                <p className="text-sm text-white/75">
                  {it.theme} · {it.colors.join(", ")}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  );
}
