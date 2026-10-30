"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { deleteLayout, saveLayout } from "@/app/w/[id]/layout/actions";
import FloorSetup, { type FloorResult } from "@/components/layout/floor-setup";
import LayoutDrawing, {
  ALL_LAYERS,
  LAYER_LABELS,
  MARGIN,
  type Layers,
  type PieceHandlers,
} from "@/components/layout/layout-drawing";
import {
  PIECES,
  PIECE_GROUPS,
  PIECE_KINDS,
  MAX_PIECE_FT,
  MAX_SEATS,
  findClashes,
  isApproximate,
  newItem,
  normalizeRotation,
  overlaps,
  rescaleItems,
  seatTotal,
  tableCount,
  tableKey,
  type FloorSource,
  type LayoutItem,
  type PieceDef,
  type PieceKind,
} from "@/lib/venue-layout";

const INPUT =
  "mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand";
const TOOL =
  "rounded-full border border-stone-2 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-40";

const ZOOMS = [1, 1.5, 2, 3, 4];
const HISTORY = 60;

type SaveStatus = "saved" | "pending" | "saving" | "error";

// `before` is what undo goes back to; it's only remembered once the piece
// actually moves, so a plain click to select adds nothing to the history.
type Drag = { id: string; before: LayoutItem[]; moved: boolean } & (
  | { mode: "move"; dx: number; dy: number }
  | { mode: "rotate" }
);

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/**
 * The overhead layout editor: the room (a floor plan, a straightened photo or
 * a plain grid) drawn to scale in an SVG whose units are feet, with pieces
 * dragged, rotated and labelled on top.
 *
 * SVG rather than a canvas library because the drawing is a few hundred simple
 * shapes, it stays crisp at any zoom, every piece is a real element that can
 * take focus and a label for keyboard and screen-reader users, and it adds no
 * dependency.
 *
 * Changes autosave about a second after they stop, sending the whole layout;
 * the server action re-validates every field (lib/venue-layout.ts).
 */
export default function LayoutEditor({
  weddingId,
  layoutId,
  initialName,
  initialImageUrl,
  initialSource,
  initialWidth,
  initialLength,
  initialItems,
  seatedByTable,
  invitedSeats,
}: {
  weddingId: string;
  layoutId: string;
  initialName: string;
  initialImageUrl: string | null;
  initialSource: FloorSource | null;
  initialWidth: number;
  initialLength: number;
  initialItems: LayoutItem[];
  /** Guests seated per table, keyed by tableKey(). */
  seatedByTable: Record<string, number>;
  /** Seats across every invited household. */
  invitedSeats: number;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [name, setName] = useState(initialName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [source, setSource] = useState<FloorSource | null>(initialSource);
  const [layers, setLayers] = useState<Layers>(ALL_LAYERS);
  const [width, setWidth] = useState(initialWidth);
  const [length, setLength] = useState(initialLength);
  const [items, setItems] = useState<LayoutItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // A brand-new layout opens on the "what's the room?" step.
  const [settingUp, setSettingUp] = useState(!initialImageUrl && initialItems.length === 0);
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [photoStrength, setPhotoStrength] = useState(0.8);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const history = useRef<LayoutItem[][]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const clashes = useMemo(() => findClashes(items, width, length), [items, width, length]);
  const seats = seatTotal(items);
  const tables = tableCount(items);

  // ── History ───────────────────────────────────────────────────────────────
  const remember = useCallback((snapshot: LayoutItem[]) => {
    history.current.push(snapshot);
    if (history.current.length > HISTORY) history.current.shift();
    setCanUndo(true);
  }, []);

  /** A discrete change (add, delete, edit a field): remembered for undo. */
  const commit = useCallback(
    (next: LayoutItem[]) => {
      remember(items);
      setItems(next);
    },
    [items, remember],
  );

  function undo() {
    const prev = history.current.pop();
    if (prev) setItems(prev);
    setCanUndo(history.current.length > 0);
  }

  function patchSelected(patch: Partial<LayoutItem>) {
    if (!selected) return;
    commit(items.map((it) => (it.id === selected.id ? { ...it, ...patch } : it)));
  }

  // ── Autosave ──────────────────────────────────────────────────────────────
  // Compared as JSON so a re-render (or React's development double effect)
  // never sends a save that changes nothing.
  const payload = useMemo(
    () => ({ name, base_image_url: imageUrl, floor_source: source, width_ft: width, length_ft: length, items }),
    [name, imageUrl, source, width, length, items],
  );
  const lastSaved = useRef(JSON.stringify(payload));
  const saveSeq = useRef(0);

  useEffect(() => {
    const json = JSON.stringify(payload);
    if (json === lastSaved.current) return;
    setStatus("pending");
    const t = setTimeout(async () => {
      const seq = ++saveSeq.current;
      setStatus("saving");
      const res = await saveLayout(weddingId, layoutId, payload).catch(() => ({
        ok: false,
        error: "Couldn’t save. Check your connection and try again.",
      }));
      // A newer save has started since; let it report instead.
      if (seq !== saveSeq.current) return;
      if (res.ok) {
        lastSaved.current = json;
        setStatus("saved");
        setSaveError(null);
      } else {
        setStatus("error");
        setSaveError(res.error ?? "Couldn’t save.");
      }
    }, 900);
    return () => clearTimeout(t);
  }, [payload, weddingId, layoutId]);

  useEffect(() => {
    if (status === "saved") return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);

  function retrySave() {
    // Re-running the effect needs a payload it hasn't sent; forget the last one.
    lastSaved.current = "";
    setItems((cur) => [...cur]);
  }

  // ── Placing pieces ────────────────────────────────────────────────────────
  /**
   * Somewhere free near the middle of the room: tries the centre, then rings
   * outward, so adding ten tables doesn't stack ten tables on one spot.
   */
  function freeSpot(kind: PieceKind): { x: number; y: number } {
    const probe = newItem(kind, width / 2, length / 2, items, "probe");
    const step = Math.max(probe.w, probe.h) + 2;
    for (let ring = 0; ring < 12; ring++) {
      const n = ring === 0 ? 1 : ring * 8;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 2 * Math.PI;
        const x = round2(width / 2 + Math.cos(a) * ring * step);
        const y = round2(length / 2 + Math.sin(a) * ring * step);
        if (x < probe.w / 2 || y < probe.h / 2 || x > width - probe.w / 2 || y > length - probe.h / 2) continue;
        const cand = { ...probe, x, y };
        if (!items.some((it) => it.kind !== "stage" && overlaps(cand, it))) return { x, y };
      }
    }
    return { x: width / 2, y: length / 2 };
  }

  function add(kind: PieceKind) {
    const { x, y } = freeSpot(kind);
    const it = newItem(kind, x, y, items, crypto.randomUUID());
    commit([...items, it]);
    setSelectedId(it.id);
  }

  function duplicate() {
    if (!selected) return;
    const copy = {
      ...selected,
      id: crypto.randomUUID(),
      x: clamp(selected.x + 2, 0, width),
      y: clamp(selected.y + 2, 0, length),
      label: PIECES[selected.kind].isTable && /^\d+$/.test(selected.label)
        ? newItem(selected.kind, 0, 0, items, "n").label
        : selected.label,
    };
    commit([...items, copy]);
    setSelectedId(copy.id);
  }

  function remove() {
    if (!selected) return;
    commit(items.filter((it) => it.id !== selected.id));
    setSelectedId(null);
  }

  // ── Pointer handling ──────────────────────────────────────────────────────
  function toFeet(e: { clientX: number; clientY: number }): { x: number; y: number } | null {
    const svg = svgRef.current;
    const m = svg?.getScreenCTM();
    if (!svg || !m) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  }

  function startMove(e: React.PointerEvent, it: LayoutItem) {
    e.stopPropagation();
    setSelectedId(it.id);
    const p = toFeet(e);
    if (!p) return;
    svgRef.current?.setPointerCapture(e.pointerId);
    drag.current = { mode: "move", id: it.id, before: items, moved: false, dx: it.x - p.x, dy: it.y - p.y };
  }

  function startRotate(e: React.PointerEvent, it: LayoutItem) {
    e.stopPropagation();
    svgRef.current?.setPointerCapture(e.pointerId);
    drag.current = { mode: "rotate", id: it.id, before: items, moved: false };
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const p = toFeet(e);
    if (!p) return;
    if (!d.moved) {
      d.moved = true;
      remember(d.before);
    }
    setItems((cur) =>
      cur.map((it) => {
        if (it.id !== d.id) return it;
        if (d.mode === "move") {
          let x = p.x + d.dx;
          let y = p.y + d.dy;
          if (snap) {
            x = Math.round(x * 2) / 2;
            y = Math.round(y * 2) / 2;
          }
          return { ...it, x: round2(clamp(x, 0, width)), y: round2(clamp(y, 0, length)) };
        }
        // The handle sits straight above the piece, i.e. at −90°.
        let deg = (Math.atan2(p.y - it.y, p.x - it.x) * 180) / Math.PI + 90;
        if (snap) deg = Math.round(deg / 15) * 15;
        return { ...it, rotation: normalizeRotation(deg) };
      }),
    );
  }

  function endDrag() {
    drag.current = null;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undo();
      return;
    }
    if (!selected) return;
    const step = e.shiftKey ? 5 : 0.5;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      patchSelected({ x: round2(clamp(selected.x + dx, 0, width)), y: round2(clamp(selected.y + dy, 0, length)) });
    } else if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      remove();
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      patchSelected({ rotation: normalizeRotation(selected.rotation + (e.shiftKey ? -15 : 15)) });
    } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicate();
    } else if (e.key === "Escape") {
      setSelectedId(null);
    }
  }

  // ── Floor ─────────────────────────────────────────────────────────────────
  async function onFloor(r: FloorResult) {
    // Pieces keep their size but move with the picture (lib/venue-layout.ts).
    if (items.length && (r.width !== width || r.length !== length)) {
      commit(rescaleItems(items, r.width / width, r.length / length));
    }
    setImageUrl(r.imageUrl);
    setSource(r.source);
    setWidth(r.width);
    setLength(r.length);
    setSettingUp(false);
  }

  // ── Export ────────────────────────────────────────────────────────────────
  /**
   * Draws the layout to a PNG to send to the venue or rental company. The
   * picture underneath is painted onto the canvas separately: an SVG rendered
   * as an image may not load anything external, so the room photo would
   * otherwise come out blank.
   */
  async function exportPng() {
    const svg = svgRef.current;
    if (!svg) return;
    setExporting(true);
    try {
      const vbW = width + MARGIN * 2;
      const vbH = length + MARGIN * 2;
      const scale = Math.min(30, 3000 / Math.max(vbW, vbH));
      const W = Math.round(vbW * scale);
      const H = Math.round(vbH * scale);

      const clone = svg.cloneNode(true) as SVGSVGElement;
      clone.querySelectorAll("[data-export-skip]").forEach((n) => n.remove());
      clone.setAttribute("width", String(W));
      clone.setAttribute("height", String(H));
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.removeAttribute("style");
      const svgUrl = URL.createObjectURL(
        new Blob([new XMLSerializer().serializeToString(clone)], { type: "image/svg+xml" }),
      );

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, W, H);

      const load = (src: string, cors: boolean) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          if (cors) img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error("load"));
          img.src = src;
        });

      if (imageUrl && layers.photo) {
        try {
          const photo = await load(imageUrl, true);
          ctx.globalAlpha = photoStrength;
          ctx.drawImage(photo, MARGIN * scale, MARGIN * scale, width * scale, length * scale);
          ctx.globalAlpha = 1;
        } catch {
          // Export the layout without the picture rather than not at all.
        }
      }
      try {
        ctx.drawImage(await load(svgUrl, false), 0, 0, W, H);
      } finally {
        URL.revokeObjectURL(svgUrl);
      }

      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${name.replace(/[^\w\- ]+/g, "").trim() || "layout"}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    } finally {
      setExporting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  const statusText =
    status === "saved" ? "All changes saved" : status === "error" ? saveError : status === "saving" ? "Saving…" : "Unsaved changes";

  const groups = PIECE_GROUPS.map((g) => ({
    group: g,
    kinds: PIECE_KINDS.filter((k) => PIECES[k].group === g),
  }));

  const seatedAt = (it: LayoutItem) => seatedByTable[tableKey(it.label)] ?? 0;
  const approximate = isApproximate(source);
  const handlers: PieceHandlers = {
    onPointerDown: startMove,
    onRotateStart: startRotate,
    onFocus: (it) => setSelectedId(it.id),
  };

  const off = (Object.keys(layers) as (keyof Layers)[]).filter((k) => !layers[k]);
  const hiddenLayers = off.length ? `?hide=${off.join(",")}` : "";

  function toggleLayer(key: keyof Layers, on: boolean) {
    setLayers((l) => ({ ...l, [key]: on }));
    // A hidden piece can't be seen, so it shouldn't stay selected for the
    // arrow keys and Delete to act on.
    if (key === "room" && !on && selected && PIECES[selected.kind].group === "Room") setSelectedId(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block min-w-0 flex-1">
          <span className="sr-only">Layout name</span>
          <input
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className="w-full max-w-md border-b border-transparent bg-transparent text-3xl font-light uppercase tracking-wide text-ink outline-none hover:border-stone-2 focus:border-brand"
          />
        </label>
        <p
          role="status"
          className={`text-sm ${status === "error" ? "text-red-700" : "text-ink-soft/70"}`}
        >
          {statusText}
          {status === "error" && (
            <button type="button" onClick={retrySave} className="ml-2 font-semibold underline">
              Retry
            </button>
          )}
        </p>
      </div>

      {settingUp ? (
        <div className="mt-6">
          <FloorSetup
            weddingId={weddingId}
            initialWidth={width}
            initialLength={length}
            onDone={onFloor}
            onCancel={imageUrl || items.length ? () => setSettingUp(false) : undefined}
          />
        </div>
      ) : (
        <>
          <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
            <Stat label="Room" value={`${width} × ${length} ft`} />
            {approximate && (
              <span
                className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800"
                title="This floor was straightened from a photo, so sizes are estimates."
              >
                Approximate
              </span>
            )}
            <Stat label="Tables" value={String(tables)} />
            <Stat label="Seats" value={String(seats)} />
            {invitedSeats > 0 && (
              <Stat
                label="Invited"
                value={
                  seats >= invitedSeats
                    ? `${invitedSeats} · room for everyone${seats > invitedSeats ? ` (+${seats - invitedSeats})` : ""}`
                    : `${invitedSeats} · ${invitedSeats - seats} seats short`
                }
                tone={seats >= invitedSeats ? "text-emerald-700" : "text-red-700"}
              />
            )}
          </dl>
          {approximate && (
            <p className="mt-2 max-w-3xl text-sm text-amber-800">
              This floor comes from a photo, so its measurements are estimates. Before booking rentals, ask your venue
              for their floor plan and use <strong>Change floor</strong> to switch to it &mdash; your tables stay where
              they are.
            </p>
          )}
          {clashes.size > 0 && (
            <p className="mt-2 text-sm text-red-700">
              {clashes.size === 1 ? "1 piece overlaps" : `${clashes.size} pieces overlap`} another or runs off the
              floor &mdash; outlined in red.
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={TOOL} onClick={undo} disabled={!canUndo}>
              Undo
            </button>
            <button
              type="button"
              className={TOOL}
              onClick={() => setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)])}
              disabled={zoom === ZOOMS[0]}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="w-12 text-center text-sm text-ink-soft">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className={TOOL}
              onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)])}
              disabled={zoom === ZOOMS[ZOOMS.length - 1]}
              aria-label="Zoom in"
            >
              +
            </button>
            <label className="ml-1 flex items-center gap-1.5 text-sm text-ink-soft">
              <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-brand" />
              Snap
            </label>
            {imageUrl && layers.photo && (
              <label className="ml-1 flex items-center gap-1.5 text-sm text-ink-soft">
                Photo
                <input
                  type="range"
                  min={0.15}
                  max={1}
                  step={0.05}
                  value={photoStrength}
                  onChange={(e) => setPhotoStrength(Number(e.target.value))}
                  className="w-24 accent-brand"
                  aria-label="How strongly the floor plan shows"
                />
              </label>
            )}
            <span className="flex-1" />
            {/* The print page reads what's saved, so it waits for the save. */}
            <a
              href={`/w/${weddingId}/layout/${layoutId}/print${hiddenLayers}`}
              className={`${TOOL} ${status === "saved" ? "" : "pointer-events-none opacity-40"}`}
              aria-disabled={status !== "saved"}
            >
              Print / PDF
            </a>
            <button type="button" className={TOOL} onClick={() => setSettingUp(true)}>
              Change floor
            </button>
            <button type="button" className={TOOL} onClick={exportPng} disabled={exporting}>
              {exporting ? "Preparing…" : "Download image"}
            </button>
          </div>

          <fieldset className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
            <legend className="sr-only">Layers to show</legend>
            <span aria-hidden className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">
              Show
            </span>
            {LAYER_LABELS.filter(([key]) => key !== "photo" || imageUrl).map(([key, label]) => (
              <label key={key} className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={layers[key]}
                  onChange={(e) => toggleLayer(key, e.target.checked)}
                  className="accent-brand"
                />
                {label}
              </label>
            ))}
            <span className="text-xs text-ink-soft/50">Hidden layers stay saved and are left out of the image and print.</span>
          </fieldset>

          <div className="mt-4 grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)_240px]">
            {/* Palette */}
            <div className="order-3 lg:order-1">
              {groups.map(({ group, kinds }) => (
                <div key={group} className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">{group}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 lg:flex-col">
                    {kinds.map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => add(k)}
                        className="rounded-lg border border-stone-2 bg-white px-3 py-2 text-left text-sm text-ink hover:border-brand"
                      >
                        <span className="font-medium">{PIECES[k].label}</span>
                        {PIECES[k].seats > 0 && (
                          <span className="ml-1 text-xs text-ink-soft/60">· {PIECES[k].seats}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Canvas */}
            <div
              className="order-1 max-h-[75vh] self-start overflow-auto rounded-2xl border border-stone-2 bg-white shadow-card lg:order-2"
              onKeyDown={onKeyDown}
            >
              <LayoutDrawing
                svgRef={svgRef}
                idPrefix={uid}
                width={width}
                length={length}
                imageUrl={imageUrl}
                photoStrength={photoStrength}
                items={items}
                layers={layers}
                approximate={approximate}
                seatedByTable={seatedByTable}
                clashes={clashes}
                selectedId={selectedId}
                handlers={handlers}
                style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 100}%` : undefined }}
                className="block touch-none select-none"
                role="application"
                aria-label={`Overhead layout, ${width} by ${length} feet. Select a piece, then use arrow keys to move it, R to rotate, Delete to remove.`}
                onPointerDown={() => setSelectedId(null)}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              />
            </div>

            {/* Selected piece */}
            <div className="order-2 lg:order-3">
              {selected ? (
                <SelectedPanel
                  key={selected.id}
                  item={selected}
                  seated={PIECES[selected.kind].isTable ? seatedAt(selected) : null}
                  onChange={patchSelected}
                  onDuplicate={duplicate}
                  onDelete={remove}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-2 p-4 text-sm leading-relaxed text-ink-soft/70">
                  <p>Add pieces from the list, then drag them into place.</p>
                  <p className="mt-2">
                    Tap a piece to rename it, change its seats or turn it. Drag the round handle to rotate.
                  </p>
                  <p className="mt-2">
                    Name tables the way your guest list does (&ldquo;4&rdquo; matches &ldquo;Table 4&rdquo;) and each
                    shows how many guests are seated there.
                  </p>
                </div>
              )}
            </div>
          </div>

          <form
            action={deleteLayout.bind(null, weddingId, layoutId)}
            onSubmit={(e) => {
              if (!confirm(`Delete “${name}”? This can’t be undone.`)) e.preventDefault();
            }}
            className="mt-10"
          >
            <button className="text-sm font-semibold text-red-700 hover:text-red-800">Delete this layout</button>
          </form>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="text-ink-soft/60">{label}</dt>
      <dd className={`font-semibold ${tone ?? "text-ink"}`}>{value}</dd>
    </div>
  );
}

/**
 * Fields for the selected piece. Text and number inputs keep their own draft
 * and apply on blur or Enter, so typing "12" doesn't save "1" first and push
 * two steps onto the undo history.
 */
function SelectedPanel({
  item,
  seated,
  onChange,
  onDuplicate,
  onDelete,
}: {
  item: LayoutItem;
  seated: number | null;
  onChange: (p: Partial<LayoutItem>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const def: PieceDef = PIECES[item.kind];
  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft/50">{def.label}</p>

      <Field label={def.isTable ? "Table name or number" : "Label"} value={item.label} onCommit={(v) => onChange({ label: v.trim().slice(0, 40) || def.label })} />

      {def.isTable && (
        <>
          <Field
            label="Seats"
            numeric
            value={String(item.seats)}
            onCommit={(v) => {
              const n = Number.parseInt(v, 10);
              if (Number.isFinite(n)) onChange({ seats: clamp(n, 0, MAX_SEATS) });
            }}
          />
          {seated !== null && (
            <p className={`mt-1 text-xs ${seated > item.seats ? "text-red-700" : "text-ink-soft/60"}`}>
              {seated === 0
                ? "No guests seated here yet."
                : `${seated} guest${seated === 1 ? "" : "s"} seated here from your guest list.`}
            </p>
          )}
        </>
      )}

      {def.resizable && (
        <div className="grid grid-cols-2 gap-2">
          <Field
            label="Length (ft)"
            numeric
            value={String(item.w)}
            onCommit={(v) => {
              const n = Number.parseFloat(v);
              if (Number.isFinite(n)) onChange({ w: round2(clamp(n, 1, MAX_PIECE_FT)) });
            }}
          />
          <Field
            label="Width (ft)"
            numeric
            value={String(item.h)}
            onCommit={(v) => {
              const n = Number.parseFloat(v);
              if (Number.isFinite(n)) onChange({ h: round2(clamp(n, 1, MAX_PIECE_FT)) });
            }}
          />
        </div>
      )}

      <p className="mt-3 text-sm font-medium text-ink-soft">Turn</p>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" className={TOOL} onClick={() => onChange({ rotation: normalizeRotation(item.rotation - 15) })} aria-label="Turn left 15 degrees">
          ⟲
        </button>
        <span className="w-12 text-center text-sm text-ink">{item.rotation}°</span>
        <button type="button" className={TOOL} onClick={() => onChange({ rotation: normalizeRotation(item.rotation + 15) })} aria-label="Turn right 15 degrees">
          ⟳
        </button>
        {item.rotation !== 0 && (
          <button type="button" className="text-xs font-semibold text-brand-text" onClick={() => onChange({ rotation: 0 })}>
            Reset
          </button>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className={TOOL} onClick={onDuplicate}>
          Duplicate
        </button>
        <button type="button" className={`${TOOL} text-red-700 hover:border-red-300 hover:text-red-800`} onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  numeric,
  onCommit,
}: {
  label: string;
  value: string;
  numeric?: boolean;
  onCommit: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const apply = () => {
    if (draft !== value) onCommit(draft);
  };
  return (
    <label className="mt-3 block">
      <span className="text-sm font-medium text-ink-soft">{label}</span>
      <input
        value={draft}
        inputMode={numeric ? "decimal" : undefined}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={apply}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply();
          // Arrow keys and Delete mean "edit this text" here, not "move the piece".
          e.stopPropagation();
        }}
        className={INPUT}
      />
    </label>
  );
}
