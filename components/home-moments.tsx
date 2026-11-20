"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Moment } from "@/lib/home-moments";

export type MomentTile = Moment & { cls: string; pos: string };

/** How often one tile changes. One at a time, so the grid never flickers all at once. */
const EVERY_MS = 4500;

function sizesFor(cls: string) {
  return cls.includes("col-span-2") ? "(max-width: 768px) 100vw, 600px" : "(max-width: 768px) 50vw, 300px";
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * The "Moments worth planning for" mosaic. Renders the hand-picked tiles first
 * (so the server HTML, first paint and no-JS view are unchanged), then swaps
 * one tile at a time for a photo from the Inspiration feed.
 *
 * The tile's shape (its spans) stays put and only the photo changes, so the
 * mosaic keeps tiling. Rotation is off for prefers-reduced-motion and pauses
 * while the tab is hidden.
 */
export default function HomeMoments({ tiles, pool: feed }: { tiles: MomentTile[]; pool: Moment[] }) {
  // The feed also carries some of the hand-picked photos; one copy is enough.
  const pool = useMemo(() => {
    const picked = new Set(tiles.map((t) => t.src));
    return feed.filter((m) => !picked.has(m.src));
  }, [tiles, feed]);
  const [shown, setShown] = useState<Moment[]>(tiles);
  const shownRef = useRef(shown);
  shownRef.current = shown;

  useEffect(() => {
    if (pool.length === 0) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // Everything not on screen, shuffled; refilled from whatever has rotated
    // out once it runs dry, so every photo gets a turn before any repeats.
    let queue = shuffle(pool);
    let lastTile = -1;

    const id = window.setInterval(() => {
      if (document.hidden) return;
      const current = shownRef.current;
      const onScreen = new Set(current.map((m) => m.src));

      if (queue.length === 0) {
        queue = shuffle([...tiles, ...pool].filter((m) => !onScreen.has(m.src)));
      }
      const nextIdx = queue.findIndex((m) => !onScreen.has(m.src));
      if (nextIdx < 0) return;
      const [next] = queue.splice(nextIdx, 1);

      let tile = Math.floor(Math.random() * current.length);
      if (tile === lastTile) tile = (tile + 1) % current.length;
      lastTile = tile;

      setShown((s) => s.map((m, i) => (i === tile ? next : m)));
    }, EVERY_MS);

    return () => window.clearInterval(id);
  }, [pool, tiles]);

  return (
    <ul className="mt-6 grid grid-flow-dense auto-rows-[150px] grid-cols-2 gap-3 sm:auto-rows-[190px] md:grid-cols-4 md:auto-rows-[210px]">
      {tiles.map((t, i) => (
        <MomentCard key={i} moment={shown[i] ?? t} cls={t.cls} pos={shown[i]?.src === t.src ? t.pos : "object-center"} />
      ))}
    </ul>
  );
}

/**
 * One tile. Keeps the outgoing photo underneath until the incoming one has
 * loaded, then fades the new one in over it, so a slow image never leaves a
 * blank tile.
 */
function MomentCard({ moment, cls, pos }: { moment: Moment; cls: string; pos: string }) {
  const [layers, setLayers] = useState<{ cur: Moment; prev: Moment | null; loaded: boolean }>({
    cur: moment,
    prev: null,
    loaded: true,
  });

  if (moment.src !== layers.cur.src) {
    // Underlay whatever is actually visible: if the last swap never loaded
    // (a failed image), that's still the photo before it, never a blank.
    const visible = layers.loaded || !layers.prev ? layers.cur : layers.prev;
    setLayers({ cur: moment, prev: visible, loaded: false });
  }

  const { cur, prev, loaded } = layers;
  const label = loaded || !prev ? cur : prev;

  return (
    <li className={`group relative overflow-hidden rounded-2xl bg-brand-soft shadow-card ${cls}`}>
      {prev && !loaded && (
        <Image src={prev.src} alt="" aria-hidden fill sizes={sizesFor(cls)} className="object-cover object-center" />
      )}
      <Image
        key={cur.src}
        src={cur.src}
        alt={`${cur.caption}, ${cur.where}`}
        fill
        sizes={sizesFor(cls)}
        onLoad={() => setLayers((l) => (l.cur.src === cur.src ? { ...l, loaded: true, prev: null } : l))}
        className={`object-cover ${pos} transition-[opacity,transform] duration-700 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
      <span className="absolute inset-x-0 bottom-0 p-3 text-white">
        <span className="block truncate text-sm font-medium">{label.caption}</span>
        {/* Says whose photo it is, so stock is never mistaken for a real wedding. Phone tiles get the short form. */}
        <span className="hidden truncate text-[11px] text-white/80 sm:block">{label.where}</span>
        <span className="block truncate text-[11px] text-white/80 sm:hidden">{label.where.split(" · ")[0]}</span>
      </span>
    </li>
  );
}
