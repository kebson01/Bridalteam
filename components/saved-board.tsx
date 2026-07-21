"use client";

import { useTransition } from "react";
import { unsaveInspiration } from "@/app/inspiration/actions";
import { MediaBadge } from "@/components/inspiration-gallery";

export interface SavedItem {
  id: string;
  image_url: string;
  title: string;
  theme: string | null;
  colors: string[];
  media_type: string;
  media_url: string | null;
}

/** The couple's saved mood board — the whole party can view; editors can remove. */
export default function SavedBoard({
  items,
  weddingId,
}: {
  items: SavedItem[];
  weddingId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <figure key={it.id} className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-card">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={it.image_url} alt={it.title} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent" />
          <MediaBadge type={it.media_type} />
          <figcaption className="absolute inset-x-0 bottom-0 p-5 text-white">
            <p className="text-lg font-medium">{it.title}</p>
            <p className="text-sm text-white/75">
              {[it.theme, it.colors.join(", ")].filter(Boolean).join(" · ")}
            </p>
          </figcaption>
          <button
            type="button"
            onClick={() => startTransition(() => unsaveInspiration(it.id, weddingId))}
            disabled={pending}
            aria-label={`Remove "${it.title}"`}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow transition-colors hover:text-red-600 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </figure>
      ))}
    </div>
  );
}
