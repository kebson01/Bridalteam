"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { deleteLayout, saveLayout, updateSeating } from "@/app/w/[id]/layout/actions";
import FloorSetup, { type FloorResult } from "@/components/layout/floor-setup";
import LayoutDrawing, {
  LAYER_LABELS,
  MARGIN,
  type Layers,
  type PieceHandlers,
} from "@/components/layout/layout-drawing";
import Icon, { type IconName } from "@/components/layout/icons";
import TableInspector, { CHIP_BTN, PANEL } from "@/components/layout/table-inspector";
import SeatingList from "@/components/layout/seating-list";
import {
  PIECES,
  PIECE_GROUPS,
  PIECE_KINDS,
  MAX_PIECE_FT,
  MAX_SEATS,
  CHAIR_DEPTH,
  PATHWAY_FT,
  findClashes,
  findTightSpots,
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
  type PieceGroup,
  type PieceKind,
} from "@/lib/venue-layout";
import {
  applySeatChanges,
  guestsByTable,
  seatTable,
  tableTitle,
  type SeatChange,
  type SeatGuest,
  type TableSeating,
} from "@/lib/seating";

const INPUT =
  "mt-1 w-full rounded-lg border border-stone-2 px-3 py-2 text-sm text-ink outline-none focus:border-brand";
const TOOL =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-soft hover:bg-stone-4 hover:text-ink disabled:opacity-40 disabled:hover:bg-transparent";

const ZOOMS = [1, 1.5, 2, 3, 4];
const HISTORY = 60;
const DRAG_TYPE = "application/x-bridalteam-piece";

type SaveStatus = "saved" | "pending" | "saving" | "error";

// `before` is what undo goes back to; it's only remembered once the piece
// actually moves, so a plain click to select adds nothing to the history.
type Drag = { id: string; before: LayoutItem[]; moved: boolean } & (
  | { mode: "move"; dx: number; dy: number }
  | { mode: "rotate" }
);

const round2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/** An icon for each piece in the library. */
function pieceIcon(kind: PieceKind): IconName {
  const def: PieceDef = PIECES[kind];
  if (def.shape === "round" && def.group === "Tables") return "round";
  if (kind === "banquet6" || kind === "banquet8") return "banquet";
  if (kind === "head" || kind === "sweetheart") return "head";
  if (def.group === "Floor") return "floor";
  if (def.group === "Service") return "service";
  return "room";
}

/** "10 guests" for a table, "16 × 16 ft" for the rest. */
function pieceNote(kind: PieceKind): string {
  const def: PieceDef = PIECES[kind];
  if (def.seats) return `${def.seats} guests`;
  return def.shape === "round" ? `${def.w} ft across` : `${def.w} × ${def.h} ft`;
}

/**
 * The overhead layout editor: the room drawn to scale in an SVG whose units
 * are feet, pieces dragged, rotated and labelled on top, and — for a selected
 * table — who sits in each chair.
 *
 * SVG rather than a canvas library because the drawing is a few hundred simple
 * shapes, it stays crisp at any zoom, every piece is a real element that can
 * take focus and a label for keyboard and screen-reader users, and it adds no
 * dependency.
 *
 * The layout autosaves about a second after changes stop, sending the whole
 * thing; the server action re-validates every field (lib/venue-layout.ts).
 * Seat moves are saved straight away, one small batch per move, because they
 * change the guest list everyone else on the team is looking at.
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
  guests: initialGuests,
  invitedSeats,
  initialSetup = null,
}: {
  weddingId: string;
  layoutId: string;
  initialName: string;
  initialImageUrl: string | null;
  initialSource: FloorSource | null;
  initialWidth: number;
  initialLength: number;
  initialItems: LayoutItem[];
  /** Everyone who has accepted. Null = the guest list couldn't be read. */
  guests: SeatGuest[] | null;
  /** Seats across every invited household. */
  invitedSeats: number;
  /** Open the room step on this method (chosen on the list page). */
  initialSetup?: FloorSource | null;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [name, setName] = useState(initialName);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [source, setSource] = useState<FloorSource | null>(initialSource);
  // A photo is only a reference: the plan is drawn on the clean grid, with
  // the photo one switch away for tracing.
  const [layers, setLayers] = useState<Layers>({
    photo: initialSource !== "photo",
    grid: true,
    room: true,
    chairs: true,
    labels: true,
  });
  const [width, setWidth] = useState(initialWidth);
  const [length, setLength] = useState(initialLength);
  const [items, setItems] = useState<LayoutItem[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // A brand-new layout opens on the "what's the room?" step.
  const [settingUp, setSettingUp] = useState(
    Boolean(initialSetup) || (!initialImageUrl && !initialSource && initialItems.length === 0),
  );
  const [view, setView] = useState<"canvas" | "list">("canvas");
  const [tab, setTab] = useState<PieceGroup>("Tables");
  const [zoom, setZoom] = useState(1);
  const [snap, setSnap] = useState(true);
  const [photoStrength, setPhotoStrength] = useState(0.8);
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [guests, setGuests] = useState<SeatGuest[]>(initialGuests ?? []);
  const [seatSaving, setSeatSaving] = useState(0);
  const [seatError, setSeatError] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const history = useRef<LayoutItem[][]>([]);
  const future = useRef<LayoutItem[][]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const clashes = useMemo(() => findClashes(items, width, length), [items, width, length]);
  const tightPairs = useMemo(() => findTightSpots(items, clashes), [items, clashes]);
  const tight = useMemo(() => new Set(tightPairs.flatMap((p) => [p.a, p.b])), [tightPairs]);
  const seats = seatTotal(items);
  const tables = useMemo(() => items.filter((it) => PIECES[it.kind].isTable), [items]);

  // ── Seating ───────────────────────────────────────────────────────────────
  const seating = useMemo(() => {
    const byTable = guestsByTable(guests);
    const out = new Map<string, TableSeating>();
    for (const t of tables) out.set(t.id, seatTable(byTable.get(tableKey(t.label)) ?? [], t.seats));
    return out;
  }, [guests, tables]);
  const seatingOf = useCallback(
    (t: LayoutItem) => seating.get(t.id) ?? { chairs: [], overflow: [] },
    [seating],
  );
  const occupancy = useMemo(
    () => Object.fromEntries([...seating].map(([id, s]) => [id, s.chairs.map(Boolean)])),
    [seating],
  );
  const seatedCounts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const [k, gs] of guestsByTable(guests)) out[k] = gs.length;
    return out;
  }, [guests]);
  const seatedHere = [...seating.values()].reduce((s, t) => s + t.chairs.filter(Boolean).length + t.overflow.length, 0);
  const waiting = guests.filter((g) => !g.tableName).length;

  async function changeSeats(changes: SeatChange[]) {
    if (!changes.length) return;
    const before = guests;
    setGuests((cur) => applySeatChanges(cur, changes));
    setSeatSaving((n) => n + 1);
    const res = await updateSeating(weddingId, changes).catch(() => ({
      ok: false,
      error: "Couldn’t save that seat. Check your connection and try again.",
    }));
    setSeatSaving((n) => n - 1);
    if (res.ok) setSeatError(null);
    else {
      setGuests(before);
      setSeatError(res.error ?? "Couldn’t save that seat.");
    }
  }

  // ── History ───────────────────────────────────────────────────────────────
  const remember = useCallback((snapshot: LayoutItem[]) => {
    history.current.push(snapshot);
    if (history.current.length > HISTORY) history.current.shift();
    future.current = [];
    setCanUndo(true);
    setCanRedo(false);
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
    if (!prev) return;
    future.current.push(items);
    setItems(prev);
    setCanUndo(history.current.length > 0);
    setCanRedo(true);
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(items);
    setItems(next);
    setCanUndo(true);
    setCanRedo(future.current.length > 0);
  }

  function patchSelected(patch: Partial<LayoutItem>) {
    if (!selected) return;
    commit(items.map((it) => (it.id === selected.id ? { ...it, ...patch } : it)));
    // Renaming a table takes its guests along, so "Table 4" → "Oak" doesn't
    // leave everyone seated at a table that no longer exists.
    if (patch.label !== undefined && PIECES[selected.kind].isTable && tableKey(patch.label) !== tableKey(selected.label)) {
      const moving = seatingOf(selected);
      const changes: SeatChange[] = [];
      moving.chairs.forEach((g, i) => g && changes.push({ id: g.id, table_name: tableTitle(patch.label!), seat_number: i + 1 }));
      moving.overflow.forEach((g) => changes.push({ id: g.id, table_name: tableTitle(patch.label!), seat_number: null }));
      void changeSeats(changes);
    }
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
    if (status === "saved" && !seatSaving) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status, seatSaving]);

  function retrySave() {
    // Re-running the effect needs a payload it hasn't sent; forget the last one.
    lastSaved.current = "";
    setItems((cur) => [...cur]);
  }

  // ── Placing pieces ────────────────────────────────────────────────────────
  /**
   * Somewhere free near the middle of the room: tries the centre, then rings
   * outward, so adding ten tables doesn't stack ten tables on one spot — or
   * leave less than a walkway between them.
   */
  function freeSpot(kind: PieceKind): { x: number; y: number } {
    const probe = newItem(kind, width / 2, length / 2, items, "probe");
    const step = Math.max(probe.w, probe.h) + (probe.seats ? CHAIR_DEPTH * 2 : 0) + PATHWAY_FT;
    for (let ring = 0; ring < 12; ring++) {
      const n = ring === 0 ? 1 : ring * 8;
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 2 * Math.PI;
        const x = round2(width / 2 + Math.cos(a) * ring * step);
        const y = round2(length / 2 + Math.sin(a) * ring * step);
        if (x < probe.w / 2 || y < probe.h / 2 || x > width - probe.w / 2 || y > length - probe.h / 2) continue;
        const cand = { ...probe, x, y };
        if (!items.some((it) => it.kind !== "stage" && overlaps(cand, it)) && !findTightSpots([cand, ...items]).some((p) => p.a === "probe")) {
          return { x, y };
        }
      }
    }
    return { x: width / 2, y: length / 2 };
  }

  function add(kind: PieceKind, at?: { x: number; y: number }) {
    const { x, y } = at ?? freeSpot(kind);
    const it = newItem(kind, clamp(x, 0, width), clamp(y, 0, length), items, crypto.randomUUID());
    commit([...items, it]);
    setSelectedId(it.id);
    setView("canvas");
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
    const mod = e.metaKey || e.ctrlKey;
    if (mod && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) {
      e.preventDefault();
      redo();
      return;
    }
    if (mod && e.key.toLowerCase() === "z") {
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
    } else if (mod && e.key.toLowerCase() === "d") {
      e.preventDefault();
      duplicate();
    } else if (e.key === "Escape") {
      setSelectedId(null);
    }
  }

  // Pieces dragged in from the library land where they're dropped.
  function onDrop(e: React.DragEvent) {
    const kind = e.dataTransfer.getData(DRAG_TYPE) as PieceKind;
    if (!kind || !Object.hasOwn(PIECES, kind)) return;
    e.preventDefault();
    const p = toFeet(e);
    if (!p) return;
    add(kind, snap ? { x: Math.round(p.x * 2) / 2, y: Math.round(p.y * 2) / 2 } : p);
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
    setLayers((l) => ({ ...l, photo: r.source !== "photo" }));
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
      const scale = Math.min(40, 3840 / Math.max(vbW, vbH));
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
    status === "saved" ? "Saved" : status === "error" ? saveError : status === "saving" ? "Saving…" : "Unsaved changes";

  const approximate = isApproximate(source);
  const handlers: PieceHandlers = {
    onPointerDown: startMove,
    onRotateStart: startRotate,
    onFocus: (it) => setSelectedId(it.id),
  };

  const off = (Object.keys(layers) as (keyof Layers)[]).filter((k) => !layers[k]);
  const hiddenLayers = off.length ? `?hide=${off.join(",")}` : "";
  const shownLayers = LAYER_LABELS.filter(([key]) => key !== "photo" || imageUrl);
  const issues = clashes.size + tightPairs.length;
  const labelOf = (id: string) => {
    const it = items.find((x) => x.id === id);
    if (!it) return "";
    return PIECES[it.kind].isTable ? tableTitle(it.label) : it.label;
  };

  function toggleLayer(key: keyof Layers, on: boolean) {
    setLayers((l) => ({ ...l, [key]: on }));
    // A hidden piece can't be seen, so it shouldn't stay selected for the
    // arrow keys and Delete to act on.
    if (key === "room" && !on && selected && PIECES[selected.kind].group === "Room") setSelectedId(null);
  }

  const fields = selected && (
    <PieceFields key={selected.id} item={selected} onChange={patchSelected} />
  );

  return (
    <div>
      {/* Header: name, room and what's been placed */}
      <div className={`${PANEL} p-4 sm:p-5`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <label className="block min-w-0 flex-1">
            <span className="sr-only">Layout name</span>
            <input
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              className="w-full max-w-md border-b border-transparent bg-transparent font-display text-2xl font-light text-ink outline-none hover:border-stone-2 focus:border-brand sm:text-3xl"
            />
          </label>
          <span className="rounded-full bg-stone-4 px-2.5 py-1 text-xs font-medium text-ink-soft">
            {width} × {length} ft
          </span>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              approximate ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
            }`}
            title={approximate ? "This floor was measured from a photo, so sizes are estimates." : undefined}
          >
            {approximate ? "Approximate scale" : "To scale"}
          </span>
          <p
            role="status"
            className={`flex items-center gap-1.5 text-xs font-medium ${status === "error" ? "text-red-700" : "text-ink-soft/70"}`}
          >
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${
                status === "error" ? "bg-red-600" : status === "saved" ? "bg-emerald-600" : "animate-pulse-dot bg-brand"
              }`}
            />
            {statusText}
            {status === "error" && (
              <button type="button" onClick={retrySave} className="ml-1 font-semibold underline">
                Retry
              </button>
            )}
          </p>
        </div>

        {!settingUp && (
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
            <Stat label="Tables" value={String(tableCount(items))} />
            <Stat
              label="Seats"
              value={invitedSeats > 0 ? `${seats} / ${invitedSeats} invited` : String(seats)}
              tone={invitedSeats > 0 ? (seats >= invitedSeats ? "text-emerald-700" : "text-red-700") : undefined}
            />
            {initialGuests && (
              <Stat label="Seated" value={`${seatedHere} of ${guests.length} confirmed`} />
            )}
            <Stat
              label="Walkways"
              value={issues ? `${issues} to check` : "All clear"}
              tone={issues ? "text-red-700" : "text-emerald-700"}
            />
          </dl>
        )}
      </div>

      {settingUp ? (
        <div className="mt-5">
          <FloorSetup
            weddingId={weddingId}
            initialWidth={width}
            initialLength={length}
            initialMode={initialSetup ?? undefined}
            onDone={onFloor}
            onCancel={source || imageUrl || items.length ? () => setSettingUp(false) : undefined}
          />
        </div>
      ) : (
        <>
          {/* Toolbar */}
          <div className="sticky top-0 z-20 mt-4 flex flex-wrap items-center gap-1 rounded-2xl border border-stone-2 bg-white/95 px-2 py-1.5 shadow-card backdrop-blur">
            <button type="button" className={TOOL} onClick={undo} disabled={!canUndo} aria-label="Undo" title="Undo (Ctrl+Z)">
              <Icon name="undo" />
            </button>
            <button type="button" className={TOOL} onClick={redo} disabled={!canRedo} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
              <Icon name="redo" />
            </button>
            <span className="mx-1 h-5 w-px bg-stone-2" aria-hidden />
            <label className={`${TOOL} cursor-pointer`}>
              <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} className="accent-brand" />
              Snap
            </label>
            <button
              type="button"
              className={TOOL}
              onClick={() => setZoom(ZOOMS[Math.max(0, ZOOMS.indexOf(zoom) - 1)])}
              disabled={zoom === ZOOMS[0] || view !== "canvas"}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="w-11 text-center text-xs font-medium text-ink-soft">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              className={TOOL}
              onClick={() => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, ZOOMS.indexOf(zoom) + 1)])}
              disabled={zoom === ZOOMS[ZOOMS.length - 1] || view !== "canvas"}
              aria-label="Zoom in"
            >
              +
            </button>
            <details className="relative">
              <summary className={`${TOOL} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>
                <Icon name="layers" /> Layers
              </summary>
              <fieldset className="absolute left-0 z-30 mt-2 w-64 rounded-xl border border-stone-2 bg-white p-3 text-sm text-ink-soft shadow-card">
                <legend className="sr-only">Layers to show</legend>
                {shownLayers.map(([key, label]) => (
                  <label key={key} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={layers[key]}
                      onChange={(e) => toggleLayer(key, e.target.checked)}
                      className="accent-brand"
                    />
                    {key === "photo" && source === "photo" ? "Room photo (reference)" : label}
                  </label>
                ))}
                {imageUrl && layers.photo && (
                  <label className="mt-1 block">
                    <span className="text-xs text-ink-soft/70">Picture strength</span>
                    <input
                      type="range"
                      min={0.15}
                      max={1}
                      step={0.05}
                      value={photoStrength}
                      onChange={(e) => setPhotoStrength(Number(e.target.value))}
                      className="w-full accent-brand"
                      aria-label="How strongly the picture shows"
                    />
                  </label>
                )}
                <p className="mt-2 text-xs text-ink-soft/60">Hidden layers stay saved and are left out of the image and print.</p>
              </fieldset>
            </details>
            <span className="mx-1 h-5 w-px bg-stone-2" aria-hidden />
            <div className="flex rounded-full bg-stone-4 p-0.5" role="group" aria-label="View">
              {(["canvas", "list"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  aria-pressed={view === v}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
                    view === v ? "bg-white text-brand-text shadow-sm" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  <Icon name={v === "canvas" ? "grid" : "list"} width={16} height={16} />
                  {v === "canvas" ? "Canvas" : "Seating"}
                </button>
              ))}
            </div>
            <span className="flex-1" />
            <button type="button" className={TOOL} onClick={() => setSettingUp(true)}>
              <Icon name="ruler" /> <span className="hidden sm:inline">Change room</span>
            </button>
            <button type="button" className={TOOL} onClick={exportPng} disabled={exporting || view !== "canvas"}>
              <Icon name="download" /> <span className="hidden sm:inline">{exporting ? "Preparing…" : "PNG"}</span>
            </button>
            {/* The print page reads what's saved, so it waits for the save. */}
            <a
              href={`/w/${weddingId}/layout/${layoutId}/print${hiddenLayers}`}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-deep ${
                status === "saved" ? "" : "pointer-events-none opacity-50"
              }`}
              aria-disabled={status !== "saved"}
            >
              <Icon name="print" /> Print / PDF
            </a>
          </div>

          {approximate && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              Measured from a photo, so sizes are estimates. You&rsquo;re planning on a clean grid; switch on the room
              photo under <strong>Layers</strong> to trace from it. Before booking rentals, ask the venue for their floor
              plan and use <strong>Change room</strong> &mdash; your tables stay where they are.
            </p>
          )}
          {seatError && (
            <p role="alert" className="mt-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {seatError}
            </p>
          )}
          {!initialGuests && (
            <p className="mt-3 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
              Couldn&rsquo;t load the guest list, so seats can&rsquo;t be assigned right now. Refresh to try again.
            </p>
          )}

          {view === "list" ? (
            <div className="mt-4">
              <SeatingList
                tables={tables}
                seatingOf={seatingOf}
                guests={guests}
                onOpen={(id) => {
                  setSelectedId(id);
                  setView("canvas");
                }}
                onSeats={changeSeats}
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[210px_minmax(0,1fr)_340px]">
              {/* Library */}
              <div className="order-2 min-w-0 lg:order-1">
                <div className={`${PANEL} p-3 lg:sticky lg:top-16`}>
                  <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft/60">Library</p>
                  <p className="px-1 text-xs text-ink-soft/60">Tap to add, or drag onto the room</p>
                  <div className="mt-2 grid grid-cols-4 gap-0.5 rounded-lg bg-stone-4 p-0.5" role="tablist">
                    {PIECE_GROUPS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        role="tab"
                        aria-selected={tab === g}
                        onClick={() => setTab(g)}
                        className={`rounded-md px-1 py-1 text-xs font-semibold ${
                          tab === g ? "bg-white text-ink shadow-sm" : "text-ink-soft/70 hover:text-ink"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0" role="tabpanel">
                    {PIECE_KINDS.filter((k) => PIECES[k].group === tab).map((k) => (
                      <button
                        key={k}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DRAG_TYPE, k);
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        onClick={() => add(k)}
                        className="flex shrink-0 items-center gap-2.5 rounded-xl px-2 py-2 text-left hover:bg-brand-wash"
                      >
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-4 text-ink-soft">
                          <Icon name={pieceIcon(k)} />
                        </span>
                        <span className="min-w-0">
                          <span className="block whitespace-nowrap text-sm font-medium text-ink">{PIECES[k].label}</span>{" "}
                          <span className="block whitespace-nowrap text-xs text-ink-soft/60">{pieceNote(k)}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Canvas */}
              <div className="order-1 min-w-0 lg:order-2">
                <div
                  className="relative max-h-[78vh] overflow-auto rounded-2xl border border-stone-2 bg-[#fbf7f2] p-2 sm:p-4"
                  onKeyDown={onKeyDown}
                  onDragOver={(e) => {
                    if (e.dataTransfer.types.includes(DRAG_TYPE)) e.preventDefault();
                  }}
                  onDrop={onDrop}
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
                    seatedByTable={seatedCounts}
                    occupancy={occupancy}
                    clashes={clashes}
                    tight={tight}
                    selectedId={selectedId}
                    handlers={handlers}
                    style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 100}%` : undefined }}
                    className="block touch-none select-none rounded-lg bg-white shadow-card"
                    role="application"
                    aria-label={`Overhead layout, ${width} by ${length} feet. Select a piece, then use arrow keys to move it, R to rotate, Delete to remove.`}
                    onPointerDown={() => setSelectedId(null)}
                    onPointerMove={onPointerMove}
                    onPointerUp={endDrag}
                    onPointerCancel={endDrag}
                  />
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 px-1 text-xs text-ink-soft/80" aria-label="Key">
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-brand-deep bg-brand" aria-hidden /> Seated
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full border border-ink/50 bg-white" aria-hidden /> Open chair
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-3.5 rounded-sm border-2 border-dashed border-amber-600" aria-hidden /> Under 36″ walkway
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="h-2.5 w-3.5 rounded-sm border-2 border-red-600" aria-hidden /> Overlap or off the floor
                  </li>
                </ul>
              </div>

              {/* Inspector */}
              <div className="order-3">
                {selected && PIECES[selected.kind].isTable ? (
                  <TableInspector
                    key={selected.id}
                    item={selected}
                    seating={seatingOf(selected)}
                    guests={guests}
                    tables={tables}
                    saving={seatSaving > 0}
                    onSeats={changeSeats}
                    onChange={patchSelected}
                    onDuplicate={duplicate}
                    onDelete={remove}
                    onClose={() => setSelectedId(null)}
                    nameField={fields}
                  />
                ) : selected ? (
                  <div className={PANEL}>
                    <div className="flex items-start justify-between gap-3 border-b border-stone-2 p-5">
                      <div>
                        <p className="font-display text-xl font-semibold text-ink">{selected.label}</p>
                        <p className="text-sm text-ink-soft/70">
                          {PIECES[selected.kind].label} · {selected.w} × {selected.h} ft
                        </p>
                      </div>
                      <button type="button" onClick={() => setSelectedId(null)} aria-label="Close" className="rounded-full p-1.5 text-ink-soft hover:bg-stone-4">
                        <Icon name="close" />
                      </button>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-2">
                        <button type="button" className={CHIP_BTN} onClick={() => patchSelected({ rotation: (selected.rotation + 45) % 360 })}>
                          <Icon name="rotate" /> Rotate 45°
                        </button>
                        <button type="button" className={CHIP_BTN} onClick={duplicate}>
                          <Icon name="copy" /> Duplicate
                        </button>
                        <button type="button" className={`${CHIP_BTN} col-span-2 text-red-700`} onClick={remove}>
                          <Icon name="trash" /> Delete
                        </button>
                      </div>
                      {fields}
                    </div>
                  </div>
                ) : (
                  <Overview
                    confirmed={initialGuests ? guests.length : null}
                    seated={seatedHere}
                    waiting={waiting}
                    clashIds={[...clashes]}
                    tightPairs={tightPairs}
                    labelOf={labelOf}
                    onSelect={setSelectedId}
                    onSeating={() => setView("list")}
                  />
                )}
              </div>
            </div>
          )}

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
    <div className="flex items-baseline gap-1.5">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft/50">{label}</dt>
      <dd className={`font-semibold ${tone ?? "text-ink"}`}>{value}</dd>
    </div>
  );
}

/** What the inspector shows with nothing selected: seating progress and what needs a look. */
function Overview({
  confirmed,
  seated,
  waiting,
  clashIds,
  tightPairs,
  labelOf,
  onSelect,
  onSeating,
}: {
  confirmed: number | null;
  seated: number;
  waiting: number;
  clashIds: string[];
  tightPairs: { a: string; b: string }[];
  labelOf: (id: string) => string;
  onSelect: (id: string) => void;
  onSeating: () => void;
}) {
  const pct = confirmed ? Math.round((seated / confirmed) * 100) : 0;
  return (
    <div className="space-y-4">
      <div className={`${PANEL} p-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft/60">Seating</p>
        {confirmed === null ? (
          <p className="mt-2 text-sm text-ink-soft/70">The guest list couldn&rsquo;t be loaded.</p>
        ) : confirmed === 0 ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft/70">
            No one has accepted yet. As RSVPs come in, guests appear here ready to seat.
          </p>
        ) : (
          <>
            <p className="mt-1 font-display text-2xl font-light text-ink">
              {seated} <span className="text-base text-ink-soft/70">of {confirmed} guests seated</span>
            </p>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-2">
              <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, pct)}%` }} />
            </div>
            <p className="mt-2 text-sm text-ink-soft/70">
              {waiting ? `${waiting} still waiting for a table.` : "Everyone who accepted has a table."}
            </p>
          </>
        )}
        <button type="button" onClick={onSeating} className={`${CHIP_BTN} mt-4 w-full`}>
          <Icon name="users" /> Open seating chart
        </button>
      </div>

      <div className={`${PANEL} p-5`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-soft/60">Walkways &amp; clashes</p>
        {clashIds.length + tightPairs.length === 0 ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-emerald-700">
            <Icon name="check" /> No overlaps, and at least 36″ behind every chair.
          </p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {clashIds.map((id) => (
              <li key={id}>
                <button type="button" onClick={() => onSelect(id)} className="flex items-start gap-2 text-left text-red-700 hover:underline">
                  <Icon name="alert" className="mt-0.5 shrink-0" />
                  {labelOf(id)} overlaps something or runs off the floor
                </button>
              </li>
            ))}
            {tightPairs.map((p) => (
              <li key={`${p.a}-${p.b}`}>
                <button type="button" onClick={() => onSelect(p.a)} className="flex items-start gap-2 text-left text-amber-800 hover:underline">
                  <Icon name="alert" className="mt-0.5 shrink-0" />
                  Under 36″ between {labelOf(p.a)} and {labelOf(p.b)} — nudge apart or try a smaller table
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-stone-5 p-4 text-sm leading-relaxed text-ink-soft/75">
        <p>Tap a table to see its chairs and seat guests. Drag the round handle, or press R, to turn it.</p>
        <p className="mt-2">
          Name tables the way your guest list does (&ldquo;4&rdquo; matches &ldquo;Table 4&rdquo;) and they pick up the
          guests already seated there.
        </p>
      </div>
    </div>
  );
}

/**
 * The selected piece's name, seats and size. Text and number inputs keep their
 * own draft and apply on blur or Enter, so typing "12" doesn't save "1" first
 * and push two steps onto the undo history.
 */
function PieceFields({ item, onChange }: { item: LayoutItem; onChange: (p: Partial<LayoutItem>) => void }) {
  const def: PieceDef = PIECES[item.kind];
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-3">
      <div className={def.isTable ? "" : "col-span-2"}>
        <Field
          label={def.isTable ? "Table name" : "Label"}
          value={item.label}
          onCommit={(v) => onChange({ label: v.trim().slice(0, 40) || def.label })}
        />
      </div>
      {def.isTable && (
        <Field
          label="Seats"
          numeric
          value={String(item.seats)}
          onCommit={(v) => {
            const n = Number.parseInt(v, 10);
            if (Number.isFinite(n)) onChange({ seats: clamp(n, 0, MAX_SEATS) });
          }}
        />
      )}
      {def.resizable && (
        <>
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
        </>
      )}
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
