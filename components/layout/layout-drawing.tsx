import type { PointerEvent, Ref, SVGProps } from "react";
import {
  DRAW_ORDER,
  PIECES,
  chairPositions,
  tableKey,
  type LayoutItem,
  type PieceDef,
  type PieceKind,
} from "@/lib/venue-layout";

/**
 * The layout drawn to scale: an SVG whose units are feet, with the room (a
 * picture or a plain grid), a scale bar and every piece on top.
 *
 * Shared by the editor, which passes pointer handlers and a selection, and the
 * print page, which renders it on the server as a plain picture. No hooks and
 * no "use client", so it works in both.
 */

/** Feet of margin drawn around the room, so chairs against a wall aren't cut off. */
export const MARGIN = 3;

const ORANGE = "#ff8c1c";
const ORANGE_DEEP = "#ec5400";
const INK = "#222222";
export const CLASH = "#dc2626";
/** Less than a 36" walkway: a warning, not an error. */
export const TIGHT = "#d97706";
const FONT = "Jost, Futura, 'Segoe UI', sans-serif";

/**
 * What's shown. Hiding a layer is for looking at the plan a particular way —
 * a rental company wants tables without names, a venue wants the room without
 * the photo — and never changes what's saved.
 */
export interface Layers {
  photo: boolean;
  grid: boolean;
  room: boolean;
  chairs: boolean;
  labels: boolean;
}

export const ALL_LAYERS: Layers = { photo: true, grid: true, room: true, chairs: true, labels: true };

export const LAYER_LABELS: ReadonlyArray<readonly [keyof Layers, string]> = [
  ["photo", "Photo"],
  ["grid", "Grid"],
  ["room", "Room features"],
  ["chairs", "Chairs"],
  ["labels", "Names & counts"],
];

export interface PieceHandlers {
  onPointerDown: (e: PointerEvent, item: LayoutItem) => void;
  onRotateStart: (e: PointerEvent, item: LayoutItem) => void;
  onFocus: (item: LayoutItem) => void;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

function fill(def: PieceDef, kind: PieceKind): string {
  if (kind === "dance") return "#fff6ee";
  if (kind === "pillar") return "#9c9c9d";
  if (kind === "aisle") return "#fbf7f2";
  if (kind === "door" || kind === "doubledoor") return "none";
  if (def.group === "Tables") return "#ffffff";
  if (def.group === "Floor") return "#f4f4f4";
  return "#eaeaea";
}

/** Pieces in drawing order — room features first, tables last — keeping their order within a group. */
export function drawOrder(items: LayoutItem[]): LayoutItem[] {
  return items
    .map((it, i) => ({ it, i }))
    .sort((a, b) => DRAW_ORDER[PIECES[a.it.kind].group] - DRAW_ORDER[PIECES[b.it.kind].group] || a.i - b.i)
    .map(({ it }) => it);
}

export default function LayoutDrawing({
  idPrefix,
  width,
  length,
  imageUrl,
  photoStrength = 0.8,
  items,
  layers = ALL_LAYERS,
  approximate = false,
  seatedByTable,
  clashes,
  tight,
  occupancy,
  selectedId = null,
  handlers,
  svgRef,
  ...svgProps
}: {
  /** Unique per page, for the grid and hatch pattern ids. */
  idPrefix: string;
  width: number;
  length: number;
  imageUrl: string | null;
  photoStrength?: number;
  items: LayoutItem[];
  layers?: Layers;
  /** Floor straightened from a photo: the scale bar says it's approximate. */
  approximate?: boolean;
  /** Guests seated per table, keyed by tableKey(). Omit to hide the tallies. */
  seatedByTable?: Record<string, number>;
  clashes?: Set<string>;
  /** Pieces with less than a 36" walkway to a neighbour. */
  tight?: Set<string>;
  /** Per table id, which chairs have someone in them; filled chairs are drawn solid. */
  occupancy?: Record<string, boolean[]>;
  selectedId?: string | null;
  /** Present in the editor only; without them the pieces are a plain picture. */
  handlers?: PieceHandlers;
  svgRef?: Ref<SVGSVGElement>;
} & Omit<SVGProps<SVGSVGElement>, "ref">) {
  const g1 = `${idPrefix}g1`;
  const g5 = `${idPrefix}g5`;
  const hatch = `${idPrefix}hatch`;
  const bar = Math.min(10, width);
  const shown = drawOrder(items).filter((it) => layers.room || PIECES[it.kind].group !== "Room");

  return (
    <svg
      ref={svgRef}
      viewBox={`${-MARGIN} ${-MARGIN} ${width + MARGIN * 2} ${length + MARGIN * 2}`}
      xmlns="http://www.w3.org/2000/svg"
      {...svgProps}
    >
      <defs>
        <pattern id={g1} width={1} height={1} patternUnits="userSpaceOnUse">
          <path d="M 1 0 L 0 0 0 1" fill="none" stroke={INK} strokeOpacity={0.06} strokeWidth={0.04} />
        </pattern>
        <pattern id={g5} width={5} height={5} patternUnits="userSpaceOnUse">
          <rect width={5} height={5} fill={`url(#${g1})`} />
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke={INK} strokeOpacity={0.14} strokeWidth={0.06} />
        </pattern>
        <pattern id={hatch} width={1.2} height={1.2} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={1.2} height={1.2} fill={CLASH} fillOpacity={0.06} />
          <line x1={0} y1={0} x2={0} y2={1.2} stroke={CLASH} strokeOpacity={0.35} strokeWidth={0.12} />
        </pattern>
      </defs>

      <rect x={0} y={0} width={width} height={length} fill="#ffffff" />
      {imageUrl && layers.photo && (
        <image
          data-export-skip
          href={imageUrl}
          x={0}
          y={0}
          width={width}
          height={length}
          preserveAspectRatio="none"
          opacity={photoStrength}
        />
      )}
      {layers.grid && <rect x={0} y={0} width={width} height={length} fill={`url(#${g5})`} />}
      <rect x={0} y={0} width={width} height={length} fill="none" stroke={INK} strokeWidth={0.15} />

      {/* Scale bar under the room */}
      <g transform={`translate(0 ${length + 1.4})`} fontFamily={FONT}>
        <line x1={0} x2={bar} y1={0} y2={0} stroke={INK} strokeWidth={0.12} />
        <line x1={0} x2={0} y1={-0.4} y2={0.4} stroke={INK} strokeWidth={0.12} />
        <line x1={bar} x2={bar} y1={-0.4} y2={0.4} stroke={INK} strokeWidth={0.12} />
        <text x={bar + 0.6} y={0.35} fontSize={0.9} fill={INK}>
          {bar} ft{approximate ? " · approximate scale, from a room photo" : ""}
        </text>
      </g>

      {shown.map((it) => (
        <Piece
          key={it.id}
          item={it}
          hatchId={hatch}
          layers={layers}
          selected={it.id === selectedId}
          clash={clashes?.has(it.id) ?? false}
          tight={tight?.has(it.id) ?? false}
          occupied={occupancy?.[it.id]}
          seated={seatedByTable && PIECES[it.kind].isTable ? (seatedByTable[tableKey(it.label)] ?? 0) : null}
          handlers={handlers}
        />
      ))}
    </svg>
  );
}

/** A door's leaf and swing, drawn inside its footprint with the opening along the top edge. */
function DoorSwing({ item, stroke }: { item: LayoutItem; stroke: string }) {
  const top = -item.h / 2;
  const left = -item.w / 2;
  const leaves =
    item.kind === "doubledoor"
      ? [
          { hinge: left, dir: 1, size: item.w / 2 },
          { hinge: -left, dir: -1, size: item.w / 2 },
        ]
      : [{ hinge: left, dir: 1, size: item.w }];
  return (
    <g fill="none" stroke={stroke}>
      {/* The opening in the wall. */}
      <line x1={left} x2={-left} y1={top} y2={top} strokeWidth={0.3} />
      {leaves.map((l, i) => (
        <g key={i} strokeWidth={0.08}>
          <line x1={l.hinge} y1={top} x2={l.hinge} y2={top + l.size} />
          <path
            d={`M ${l.hinge + l.dir * l.size} ${top} A ${l.size} ${l.size} 0 0 ${l.dir > 0 ? 1 : 0} ${l.hinge} ${top + l.size}`}
            strokeDasharray="0.3 0.2"
          />
        </g>
      ))}
    </g>
  );
}

/** One piece on the floor, its chairs, label and (when selected) rotate handle. */
function Piece({
  item,
  hatchId,
  layers,
  selected,
  clash,
  tight,
  occupied,
  seated,
  handlers,
}: {
  item: LayoutItem;
  hatchId: string;
  layers: Layers;
  selected: boolean;
  clash: boolean;
  tight: boolean;
  occupied?: boolean[];
  seated: number | null;
  handlers?: PieceHandlers;
}) {
  const def: PieceDef = PIECES[item.kind];
  const chairs = layers.chairs ? chairPositions(item) : [];
  const isDoor = item.kind === "door" || item.kind === "doubledoor";
  const stroke = clash ? CLASH : selected ? ORANGE_DEEP : tight ? TIGHT : item.kind === "nogo" ? CLASH : INK;
  const strokeWidth = clash || selected || tight ? 0.18 : 0.1;
  // Fit the label inside the piece: ~0.6em per character, 90% of the width.
  const fontSize = clamp((1.5 * Math.min(item.w, item.h * 3)) / Math.max(item.label.length, 2), 0.35, 1.1);
  const handleY = -(item.h / 2 + (chairs.length ? 2.4 : 1.2));
  const over = seated !== null && seated > item.seats;
  const labelFill = item.kind === "pillar" ? "#ffffff" : INK;

  return (
    <g>
      <g
        transform={`translate(${item.x} ${item.y}) rotate(${item.rotation})`}
        {...(handlers
          ? {
              onPointerDown: (e: PointerEvent) => handlers.onPointerDown(e, item),
              onFocus: () => handlers.onFocus(item),
              tabIndex: 0,
              role: "button",
              "aria-label": `${def.label}${item.label !== def.label ? ` ${item.label}` : ""}${item.seats ? `, ${item.seats} seats` : ""}`,
              "aria-pressed": selected,
              className: "cursor-move outline-none",
            }
          : {})}
      >
        {chairs.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={0.7}
            fill={occupied?.[i] ? ORANGE : "#ffffff"}
            stroke={occupied?.[i] ? ORANGE_DEEP : INK}
            strokeOpacity={occupied?.[i] ? 1 : 0.55}
            strokeWidth={0.08}
          />
        ))}
        {def.shape === "round" ? (
          <circle
            r={item.w / 2}
            fill={selected && def.isTable ? "#fff6ee" : fill(def, item.kind)}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={tight && !clash && !selected ? "0.5 0.25" : undefined}
          />
        ) : (
          <rect
            x={-item.w / 2}
            y={-item.h / 2}
            width={item.w}
            height={item.h}
            rx={isDoor || item.kind === "pillar" ? 0 : 0.2}
            fill={item.kind === "nogo" ? `url(#${hatchId})` : selected && def.isTable ? "#fff6ee" : fill(def, item.kind)}
            // A door's footprint is only its swing area: outlined faintly
            // unless it's selected or in a clash, so it doesn't read as furniture.
            stroke={stroke}
            strokeOpacity={isDoor && !clash && !selected ? 0.2 : 1}
            strokeWidth={strokeWidth}
            strokeDasharray={
              item.kind === "dance" || item.kind === "nogo" || item.kind === "aisle" || (tight && !clash && !selected)
                ? "0.6 0.3"
                : undefined
            }
            // The room's outline and doors still need to be grabbable where
            // the rect itself has no fill.
            pointerEvents={handlers ? "all" : undefined}
          />
        )}
        {isDoor && <DoorSwing item={item} stroke={clash ? CLASH : INK} />}
        {selected && handlers && (
          <g data-export-skip>
            <line x1={0} x2={0} y1={-item.h / 2} y2={handleY} stroke={ORANGE_DEEP} strokeWidth={0.08} />
            <circle
              cy={handleY}
              r={0.6}
              fill={ORANGE}
              stroke="#ffffff"
              strokeWidth={0.12}
              className="cursor-grab"
              onPointerDown={(e) => handlers.onRotateStart(e, item)}
            />
          </g>
        )}
      </g>
      {/* Text stays upright whichever way the piece is turned. Doors are
          self-explanatory from the swing, so they go unlabelled. */}
      {layers.labels && !isDoor && (
        <g pointerEvents="none" fontFamily={FONT} textAnchor="middle">
          <text
            x={item.x}
            y={item.y + (seated !== null ? -0.05 : fontSize * 0.35)}
            fontSize={fontSize}
            fontWeight={600}
            fill={item.kind === "nogo" ? CLASH : labelFill}
          >
            {item.label}
          </text>
          {seated !== null && item.seats > 0 && (
            <text x={item.x} y={item.y + fontSize * 0.9} fontSize={fontSize * 0.7} fill={over ? CLASH : INK} fillOpacity={over ? 1 : 0.6}>
              {seated}/{item.seats}
            </text>
          )}
        </g>
      )}
    </g>
  );
}
