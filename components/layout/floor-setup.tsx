"use client";

import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { downscaleImage, loadBitmap } from "@/lib/image";
import { orderCorners, warpToRect, type Point } from "@/lib/homography";
import type { FloorSource } from "@/lib/venue-layout";

const INPUT =
  "mt-1 w-full rounded-lg border border-stone-2 px-3 py-2.5 text-sm text-ink outline-none focus:border-brand";
const BTN = "rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-deep disabled:opacity-50";
const BTN_GHOST =
  "rounded-full border border-stone-2 px-5 py-2.5 text-sm font-semibold text-ink-soft hover:border-brand hover:text-brand-text disabled:opacity-50";

export interface FloorResult {
  imageUrl: string | null;
  source: FloorSource;
  width: number;
  length: number;
}

type Mode = "choose" | "plan" | "photo" | "blank";

interface Picture {
  blob: Blob;
  ext: string;
  type: string;
  url: string;
  w: number;
  h: number;
}

const num = (s: string) => Number.parseFloat(s.replace(/[^0-9.]/g, ""));
const okDim = (n: number) => Number.isFinite(n) && n >= 5 && n <= 1000;

/**
 * Sets what the layout is drawn on, three ways:
 *
 *  - a floor plan: the couple draws a line along something they know the
 *    length of, which sets the scale for the whole drawing;
 *  - a photo of the room: they tap the floor's four corners and give the
 *    room's size, and the photo is straightened into a view from above
 *    (lib/homography.ts);
 *  - a blank room: just the size, drawn as a grid.
 *
 * The result is uploaded into the wedding's own folder in wedding-media, the
 * same bucket and policy as the cover photo.
 */
export default function FloorSetup({
  weddingId,
  initialWidth,
  initialLength,
  initialMode,
  onDone,
  onCancel,
}: {
  weddingId: string;
  initialWidth: number;
  initialLength: number;
  onDone: (r: FloorResult) => void | Promise<void>;
  onCancel?: () => void;
  /** Skip the choice and start on this method (picked on the list page). */
  initialMode?: FloorSource;
}) {
  const [mode, setMode] = useState<Mode>(initialMode ?? "choose");
  const [pic, setPic] = useState<Picture | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [lineFt, setLineFt] = useState("");
  const [widthFt, setWidthFt] = useState(String(initialWidth));
  const [lengthFt, setLengthFt] = useState(String(initialLength));
  const [preview, setPreview] = useState<Picture | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingMode = useRef<Mode>("plan");

  // Object URLs hold the whole image in memory until revoked.
  useEffect(() => () => void (pic && URL.revokeObjectURL(pic.url)), [pic]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview.url)), [preview]);

  function pickFile(next: Mode) {
    pendingMode.current = next;
    fileRef.current?.click();
  }

  async function handleFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Please choose an image file. A PDF floor plan can be saved as a picture first.");
    if (file.size > 25 * 1024 * 1024) return setError("That image is over 25 MB. Please choose a smaller one.");
    setBusy(true);
    try {
      // Big enough to read table numbers off a floor plan, small enough to
      // straighten in the browser in well under a second.
      const processed = await downscaleImage(file, 2400);
      const bmp = await loadBitmap(processed.blob);
      const p = { ...processed, url: URL.createObjectURL(processed.blob), w: bmp.width, h: bmp.height };
      if ("close" in bmp && typeof bmp.close === "function") bmp.close();
      setPic(p);
      setPoints([]);
      setPreview(null);
      setMode(pendingMode.current);
    } catch {
      setError("Couldn’t read that image. Please try another.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function upload(p: { blob: Blob; ext: string; type: string }): Promise<string | null> {
    const supabase = supabaseBrowser();
    const path = `${weddingId}/layouts/${crypto.randomUUID()}.${p.ext}`;
    const { error: upErr } = await supabase.storage
      .from("wedding-media")
      .upload(path, p.blob, { cacheControl: "3600", upsert: false, contentType: p.type });
    if (upErr) {
      console.error("layout upload failed:", upErr.message);
      return null;
    }
    return supabase.storage.from("wedding-media").getPublicUrl(path).data.publicUrl;
  }

  async function finish(r: { picture: Picture | null; source: FloorSource; width: number; length: number }) {
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | null = null;
      if (r.picture) {
        imageUrl = await upload(r.picture);
        if (!imageUrl) return setError("Upload failed. Please try again.");
      }
      await onDone({
        imageUrl,
        source: r.source,
        width: Math.round(r.width * 100) / 100,
        length: Math.round(r.length * 100) / 100,
      });
    } finally {
      setBusy(false);
    }
  }

  function savePlan() {
    if (!pic || points.length < 2) return;
    const ft = num(lineFt);
    const px = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
    if (!(ft > 0) || px < 5) return setError("Draw a longer line and enter its length in feet.");
    const ftPerPx = ft / px;
    const width = pic.w * ftPerPx;
    const length = pic.h * ftPerPx;
    if (!okDim(width) || !okDim(length))
      return setError(`That makes the plan ${Math.round(width)} × ${Math.round(length)} ft. Check the length you entered.`);
    void finish({ picture: pic, source: "plan", width, length });
  }

  async function straighten() {
    if (!pic || points.length < 4) return;
    const w = num(widthFt);
    const l = num(lengthFt);
    if (!okDim(w) || !okDim(l)) return setError("Enter the room’s width and depth in feet (between 5 and 1000).");
    setBusy(true);
    setError(null);
    try {
      const bmp = await loadBitmap(pic.blob);
      const src = document.createElement("canvas");
      src.width = pic.w;
      src.height = pic.h;
      const sctx = src.getContext("2d");
      if (!sctx) throw new Error("canvas");
      sctx.drawImage(bmp, 0, 0);
      if ("close" in bmp && typeof bmp.close === "function") bmp.close();
      const data = sctx.getImageData(0, 0, pic.w, pic.h);

      // Up to 40 px per foot, capped so the long side stays near 2000 px.
      const pxPerFt = Math.min(40, 2000 / Math.max(w, l));
      const ow = Math.max(1, Math.round(w * pxPerFt));
      const oh = Math.max(1, Math.round(l * pxPerFt));
      const out = warpToRect(data.data, pic.w, pic.h, orderCorners(points), ow, oh);
      if (!out) return setError("Those corners don’t make a floor shape. Move them onto the floor’s four corners.");

      const dst = document.createElement("canvas");
      dst.width = ow;
      dst.height = oh;
      const dctx = dst.getContext("2d");
      if (!dctx) throw new Error("canvas");
      const img = dctx.createImageData(ow, oh);
      img.data.set(out);
      dctx.putImageData(img, 0, 0);
      const toBlob = (type: string) => new Promise<Blob | null>((res) => dst.toBlob(res, type, 0.85));
      let blob = await toBlob("image/webp");
      let ext = "webp";
      if (!blob || blob.type !== "image/webp") {
        blob = await toBlob("image/jpeg");
        ext = "jpg";
      }
      if (!blob) throw new Error("encode");
      setPreview({ blob, ext, type: blob.type, url: URL.createObjectURL(blob), w: ow, h: oh });
    } catch {
      setError("Couldn’t straighten that photo. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function saveBlank() {
    const w = num(widthFt);
    const l = num(lengthFt);
    if (!okDim(w) || !okDim(l)) return setError("Enter the room’s width and depth in feet (between 5 and 1000).");
    void finish({ picture: null, source: "blank", width: w, length: l });
  }

  const needed = mode === "plan" ? 2 : 4;

  return (
    <div className="rounded-2xl border border-stone-2 bg-white p-6 shadow-card">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {mode === "choose" && (
        <>
          <h2 className="font-display text-lg font-semibold text-ink">What&rsquo;s the room?</h2>
          <p className="mt-1 text-sm text-ink-soft/75">Pick how you&rsquo;d like to start. You can change it later.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Choice
              title="Floor plan"
              body="Your venue’s plan or a drawing. Best results — ask the venue for one."
              onClick={() => pickFile("plan")}
              disabled={busy}
            />
            <Choice
              title="Photo of the room"
              body="Take one from a corner, showing as much floor as you can. We’ll turn it into a view from above — sizes will be approximate."
              onClick={() => pickFile("photo")}
              disabled={busy}
            />
            <Choice
              title="Blank room"
              body="Just the size, on a grid. Handy for a tent or a backyard."
              onClick={() => setMode("blank")}
              disabled={busy}
            />
          </div>
          {busy && <p className="mt-4 text-sm text-ink-soft/70">Reading the image…</p>}
        </>
      )}

      {(mode === "plan" || mode === "photo") && !pic && (
        <>
          <h2 className="font-display text-lg font-semibold text-ink">
            {mode === "plan" ? "Upload your floor plan" : "Upload a photo of the room"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft/75">
            {mode === "plan"
              ? "A photo, screenshot or scan of the venue’s plan works. A PDF can be saved as a picture first. Next you’ll draw one line along something you know the length of."
              : "Stand in a corner and take it from as high as you can, showing the whole floor. Next you’ll tap the floor’s four corners; the plan itself is drawn on a clean grid."}
          </p>
          <button type="button" className={`${BTN} mt-5`} disabled={busy} onClick={() => pickFile(mode)}>
            {busy ? "Reading the image…" : mode === "plan" ? "Choose floor plan" : "Choose photo"}
          </button>
        </>
      )}

      {(mode === "plan" || mode === "photo") && pic && !preview && (
        <>
          <h2 className="font-display text-lg font-semibold text-ink">
            {mode === "plan" ? "Set the scale" : "Mark the floor’s corners"}
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft/75">
            {mode === "plan"
              ? "Tap both ends of something you know the length of — a wall, a doorway, the scale bar. You can drag the dots to adjust."
              : "Tap the four corners of the whole floor, where it meets the walls — not a patch of carpet. If a corner is hidden, tap where it would be. Drag the dots to adjust."}{" "}
            ({Math.min(points.length, needed)} of {needed})
          </p>

          <PointPicker picture={pic} points={points} max={needed} onChange={setPoints} closed={mode === "photo"} />

          <div className="mt-4 flex flex-wrap items-end gap-3">
            {mode === "plan" ? (
              <label className="block w-44">
                <span className="text-sm font-medium text-ink-soft">That line is (feet)</span>
                <input inputMode="decimal" value={lineFt} onChange={(e) => setLineFt(e.target.value)} className={INPUT} />
              </label>
            ) : (
              <>
                <label className="block w-40">
                  <span className="text-sm font-medium text-ink-soft">Width, left–right (ft)</span>
                  <input inputMode="decimal" value={widthFt} onChange={(e) => setWidthFt(e.target.value)} className={INPUT} />
                </label>
                <label className="block w-40">
                  <span className="text-sm font-medium text-ink-soft">Depth, front–back (ft)</span>
                  <input inputMode="decimal" value={lengthFt} onChange={(e) => setLengthFt(e.target.value)} className={INPUT} />
                </label>
              </>
            )}
            <button
              type="button"
              className={BTN}
              disabled={busy || points.length < needed}
              onClick={mode === "plan" ? savePlan : straighten}
            >
              {busy ? "Working…" : mode === "plan" ? "Use this plan" : "Measure the room"}
            </button>
            <button type="button" className={BTN_GHOST} disabled={busy || !points.length} onClick={() => setPoints([])}>
              Start over
            </button>
          </div>
        </>
      )}

      {mode === "photo" && preview && (
        <>
          <h2 className="font-display text-lg font-semibold text-ink">Your room, measured</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-soft/75">
            You&rsquo;ll plan on a clean {num(widthFt)} × {num(lengthFt)} ft grid. The photo, flattened to a view from
            above, is kept as a reference you can switch on under <strong>Layers</strong> to trace walls and doors. A
            photo can&rsquo;t be measured exactly, so the layout is marked <strong>approximate</strong> until you add
            your venue&rsquo;s floor plan.
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-5">
            <RoomGrid width={num(widthFt)} length={num(lengthFt)} />
            <figure className="w-40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview.url} alt="The room photo flattened to a view from above" className="w-full rounded-lg border border-stone-2 opacity-80" />
              <figcaption className="mt-1 text-xs text-ink-soft/60">
                Reference only. If the floor edges look bent, adjust the corners.
              </figcaption>
            </figure>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              className={BTN}
              disabled={busy}
              onClick={() => void finish({ picture: preview, source: "photo", width: num(widthFt), length: num(lengthFt) })}
            >
              {busy ? "Saving…" : "Start planning"}
            </button>
            <button type="button" className={BTN_GHOST} disabled={busy} onClick={() => setPreview(null)}>
              Adjust corners
            </button>
          </div>
        </>
      )}

      {mode === "blank" && (
        <>
          <h2 className="font-display text-lg font-semibold text-ink">How big is the room?</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="block w-36">
              <span className="text-sm font-medium text-ink-soft">Width (ft)</span>
              <input inputMode="decimal" value={widthFt} onChange={(e) => setWidthFt(e.target.value)} className={INPUT} />
            </label>
            <label className="block w-36">
              <span className="text-sm font-medium text-ink-soft">Depth (ft)</span>
              <input inputMode="decimal" value={lengthFt} onChange={(e) => setLengthFt(e.target.value)} className={INPUT} />
            </label>
            <button type="button" className={BTN} disabled={busy} onClick={saveBlank}>
              {busy ? "Saving…" : "Use this size"}
            </button>
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-6 flex gap-4 text-sm">
        {mode !== "choose" && (
          <button
            type="button"
            className="font-semibold text-brand-text hover:text-brand-deep"
            disabled={busy}
            onClick={() => {
              setMode("choose");
              setPreview(null);
              setError(null);
            }}
          >
            ← Choose another way
          </button>
        )}
        {onCancel && (
          <button type="button" className="font-semibold text-ink-soft hover:text-ink" disabled={busy} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

/** The empty room as it will be planned: a to-scale grid with 5 ft squares. */
function RoomGrid({ width, length }: { width: number; length: number }) {
  return (
    <svg
      viewBox={`-1 -1 ${width + 2} ${length + 2}`}
      className="h-auto w-full max-w-md rounded-lg border border-stone-2 bg-white"
      role="img"
      aria-label={`Empty room, ${width} by ${length} feet`}
    >
      <defs>
        <pattern id="room-grid" width={5} height={5} patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="#222222" strokeOpacity={0.14} strokeWidth={0.08} />
        </pattern>
      </defs>
      <rect width={width} height={length} fill="url(#room-grid)" stroke="#222222" strokeWidth={0.2} />
    </svg>
  );
}

function Choice({ title, body, onClick, disabled }: { title: string; body: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-stone-2 p-4 text-left transition-colors hover:border-brand disabled:opacity-50"
    >
      <span className="block font-semibold text-ink">{title}</span>
      <span className="mt-1 block text-sm leading-relaxed text-ink-soft/75">{body}</span>
    </button>
  );
}

/**
 * The picture with tappable, draggable dots on top, in the picture's own pixel
 * coordinates so the dots stay put however the image is scaled on screen.
 */
function PointPicker({
  picture,
  points,
  max,
  onChange,
  closed,
}: {
  picture: Picture;
  points: Point[];
  max: number;
  onChange: (p: Point[]) => void;
  closed: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<number | null>(null);

  function toPicture(e: React.PointerEvent): Point {
    const r = svgRef.current!.getBoundingClientRect();
    return {
      x: Math.min(Math.max(((e.clientX - r.left) / r.width) * picture.w, 0), picture.w),
      y: Math.min(Math.max(((e.clientY - r.top) / r.height) * picture.h, 0), picture.h),
    };
  }

  const dot = Math.max(picture.w, picture.h) / 70;
  const ordered = closed && points.length === 4 ? orderCorners(points) : points;

  return (
    <div className="relative mt-4 inline-block max-w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={picture.url} alt="" className="block max-h-[65vh] w-auto max-w-full select-none rounded-lg" draggable={false} />
      <svg
        ref={svgRef}
        viewBox={`0 0 ${picture.w} ${picture.h}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        onPointerDown={(e) => {
          if (points.length >= max) return;
          onChange([...points, toPicture(e)]);
        }}
        onPointerMove={(e) => {
          const i = dragging.current;
          if (i === null) return;
          const p = toPicture(e);
          onChange(points.map((q, j) => (j === i ? p : q)));
        }}
        onPointerUp={() => (dragging.current = null)}
        onPointerCancel={() => (dragging.current = null)}
      >
        {ordered.length >= 2 && (
          <polyline
            points={[...ordered, ...(closed && ordered.length === 4 ? [ordered[0]] : [])].map((p) => `${p.x},${p.y}`).join(" ")}
            fill={closed && ordered.length === 4 ? "rgba(255,140,28,0.18)" : "none"}
            stroke="#ff8c1c"
            strokeWidth={dot / 3}
          />
        )}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={dot}
            fill="#ffffff"
            stroke="#ec5400"
            strokeWidth={dot / 3}
            className="cursor-grab"
            onPointerDown={(e) => {
              e.stopPropagation();
              (e.currentTarget.ownerSVGElement as SVGSVGElement).setPointerCapture(e.pointerId);
              dragging.current = i;
            }}
          />
        ))}
      </svg>
    </div>
  );
}
