import type { KeyboardEvent } from "react";
import { PIECES, chairPositions, type LayoutItem } from "@/lib/venue-layout";
import { dietaryTags, initials, tableTitle, type SeatGuest } from "@/lib/seating";

const FONT = "Jost, Futura, 'Segoe UI', sans-serif";
const R = 0.95;

/**
 * One table seen from above with a numbered circle per chair: the guest's
 * initials, a dietary tag under it, or a "+" for an empty chair. The chairs
 * are where the layout draws them (chairPositions), pushed out and spread a
 * little so the circles are big enough to tap.
 *
 * No hooks, so it renders on the server too; pass `onSeat` to make the chairs
 * buttons.
 */
export default function SeatDial({
  item,
  chairs,
  picked = null,
  onSeat,
  className,
}: {
  item: LayoutItem;
  chairs: (SeatGuest | null)[];
  /** 1-based chair that's been picked to move; drawn solid. */
  picked?: number | null;
  onSeat?: (seat: number) => void;
  className?: string;
}) {
  const def = PIECES[item.kind];
  const round = def.shape === "round";
  const raw = chairPositions(item);

  // Spread chairs along a long side so neighbouring circles don't touch.
  const sameRow = raw.filter((p) => raw[0] && p.y === raw[0].y);
  const spacing = sameRow.length > 1 ? Math.abs(sameRow[1].x - sameRow[0].x) : Infinity;
  const spread = round ? 1 : Math.max(1, (R * 2 + 0.3) / spacing);
  const tw = round ? item.w : item.w * spread;
  const th = item.h;
  const pts = raw.map((p) => {
    if (round) {
      const len = Math.hypot(p.x, p.y) || 1;
      const r = item.w / 2 + 1.55;
      return { x: (p.x / len) * r, y: (p.y / len) * r, dx: p.x / len, dy: p.y / len };
    }
    const dir = Math.sign(p.y) || -1;
    return { x: p.x * spread, y: dir * (th / 2 + 1.4), dx: 0, dy: dir };
  });

  // Wider at the sides, where a tag like "NUT FREE" runs out sideways.
  const pad = R + 1.5;
  const padX = R + 2.8;
  const minX = Math.min(-tw / 2, ...pts.map((p) => p.x)) - padX;
  const maxX = Math.max(tw / 2, ...pts.map((p) => p.x)) + padX;
  const minY = Math.min(-th / 2, ...pts.map((p) => p.y)) - pad;
  const maxY = Math.max(th / 2, ...pts.map((p) => p.y)) + pad;
  const title = tableTitle(item.label);

  return (
    <svg
      viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`}
      className={className}
      role="group"
      aria-label={`${title}, ${chairs.filter(Boolean).length} of ${item.seats} chairs taken`}
      fontFamily={FONT}
    >
      {round ? (
        <>
          <circle r={item.w / 2 + 2.6} fill="#fff6ee" />
          <circle r={item.w / 2} fill="#ffffff" stroke="#eaeaea" strokeWidth={0.08} />
        </>
      ) : (
        <rect x={-tw / 2} y={-th / 2} width={tw} height={th} rx={0.3} fill="#ffffff" stroke="#eaeaea" strokeWidth={0.08} />
      )}
      <g textAnchor="middle" pointerEvents="none">
        {round && (
          <text y={-item.w * 0.14} fontSize={Math.min(0.5, item.w * 0.09)} fontWeight={600} fill="#c35004" letterSpacing={0.06}>
            ROUND
          </text>
        )}
        <text
          y={round ? item.w * 0.06 : 0.3}
          fontSize={Math.min(round ? item.w * 0.17 : th * 0.36, 1.05, (tw * 1.6) / Math.max(title.length, 4))}
          fontWeight={500}
          fill="#222222"
        >
          {title}
        </text>
        {round && (
          <text y={item.w * 0.25} fontSize={Math.min(0.42, item.w * 0.075)} fill="#303030" fillOpacity={0.7}>
            {def.label} · {item.seats} max
          </text>
        )}
      </g>

      {pts.map((p, i) => {
        const g = chairs[i] ?? null;
        const n = i + 1;
        const isPicked = picked === n;
        const tag = g ? dietaryTags(g.dietary)[0] : undefined;
        const fill = isPicked ? "#ff8c1c" : g ? "#ffffff" : "#f4f4f4";
        const stroke = isPicked ? "#ec5400" : g ? "#ff8c1c" : "#d2cfca";
        const interactive = onSeat
          ? {
              role: "button",
              tabIndex: 0,
              "aria-label": g ? `Seat ${n}, ${g.name}` : `Seat ${n}, empty`,
              "aria-pressed": isPicked,
              onClick: () => onSeat(n),
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSeat(n);
                }
              },
              className: "cursor-pointer outline-none [&:focus-visible>circle]:stroke-[#222222]",
            }
          : {};
        // Labels sit outside the chair, away from the table.
        const lx = p.x + p.dx * (R + 0.55);
        const ly = p.y + p.dy * (R + 0.55) + 0.18;
        return (
          <g key={i} {...interactive}>
            <circle cx={p.x} cy={p.y} r={R} fill={fill} stroke={stroke} strokeWidth={isPicked ? 0.14 : 0.09} strokeDasharray={g || isPicked ? undefined : "0.18 0.14"} />
            <text
              x={p.x}
              y={p.y + 0.24}
              textAnchor="middle"
              fontSize={g ? 0.66 : 0.8}
              fontWeight={600}
              fill={isPicked ? "#ffffff" : g ? "#c35004" : "#9c9c9d"}
              pointerEvents="none"
            >
              {g ? initials(g.name) : "+"}
            </text>
            <text x={lx} y={ly} textAnchor="middle" fontSize={0.4} fill={tag ? "#c35004" : "#7b7b7b"} fontWeight={tag ? 600 : 400} pointerEvents="none">
              {tag ?? String(n).padStart(2, "0")}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
