/**
 * Straightening a photo of a room into an overhead view.
 *
 * A photo taken standing in a room shows the floor as a trapezoid. If the
 * couple taps the floor's four corners and says how big the room is, a
 * projective transform (a "homography") maps that trapezoid back onto a
 * rectangle the right shape — the room as seen from the ceiling. It is exact
 * for anything lying flat on the floor; chairs, walls and people standing up
 * smear, which is fine because only the floor is being planned on.
 *
 * Pure math over plain arrays so it can be tested without a browser; the
 * editor hands it the canvas's pixel buffer.
 */

export type Point = { x: number; y: number };

/** Row-major 3×3 matrix, with the bottom-right entry fixed at 1. */
export type Matrix3 = [number, number, number, number, number, number, number, number, number];

/**
 * Solves A·x = b by Gaussian elimination with partial pivoting. Returns null
 * when the system is singular — here, when three of the four corners line up.
 */
function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-10) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

/**
 * The homography taking each `from[i]` to `to[i]` (four pairs). Null if the
 * points are degenerate.
 */
export function homography(from: Point[], to: Point[]): Matrix3 | null {
  if (from.length !== 4 || to.length !== 4) return null;
  const a: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const { x, y } = from[i];
    const { x: u, y: v } = to[i];
    a.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    a.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve(a, b);
  if (!h || h.some((n) => !Number.isFinite(n))) return null;
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1];
}

export function applyHomography(m: Matrix3, p: Point): Point {
  const w = m[6] * p.x + m[7] * p.y + m[8];
  return { x: (m[0] * p.x + m[1] * p.y + m[2]) / w, y: (m[3] * p.x + m[4] * p.y + m[5]) / w };
}

/**
 * Puts four tapped corners in a consistent order — top-left, top-right,
 * bottom-right, bottom-left — whatever order they were tapped in. Sorting by
 * angle around the centre works for any convex quadrilateral, which a floor
 * seen in perspective always is.
 */
export function orderCorners(pts: Point[]): Point[] {
  const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
  const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
  const sorted = [...pts].sort(
    (a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx),
  );
  // atan2 order starts at the left (−π) and runs through top, right, bottom in
  // screen coordinates. Rotate so the corner nearest the top-left comes first.
  let start = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].x + sorted[i].y < sorted[start].x + sorted[start].y) start = i;
  }
  return [...sorted.slice(start), ...sorted.slice(0, start)];
}

/**
 * Warps `src` (RGBA pixels, `sw`×`sh`) so the quadrilateral `quad` (TL, TR,
 * BR, BL in source pixels) fills an `ow`×`oh` output. Each output pixel is
 * mapped BACK into the source and sampled bilinearly, which leaves no holes.
 * Pixels that land outside the photo come out white.
 */
export function warpToRect(
  src: Uint8ClampedArray,
  sw: number,
  sh: number,
  quad: Point[],
  ow: number,
  oh: number,
): Uint8ClampedArray | null {
  const rect = [
    { x: 0, y: 0 },
    { x: ow, y: 0 },
    { x: ow, y: oh },
    { x: 0, y: oh },
  ];
  const m = homography(rect, quad);
  if (!m) return null;

  const out = new Uint8ClampedArray(ow * oh * 4);
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      const o = (y * ow + x) * 4;
      // Sample at the pixel's centre.
      const p = applyHomography(m, { x: x + 0.5, y: y + 0.5 });
      const fx = p.x - 0.5;
      const fy = p.y - 0.5;
      if (!(fx >= 0 && fy >= 0 && fx <= sw - 1 && fy <= sh - 1)) {
        out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 255;
        continue;
      }
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(x0 + 1, sw - 1);
      const y1 = Math.min(y0 + 1, sh - 1);
      const tx = fx - x0;
      const ty = fy - y0;
      const i00 = (y0 * sw + x0) * 4;
      const i10 = (y0 * sw + x1) * 4;
      const i01 = (y1 * sw + x0) * 4;
      const i11 = (y1 * sw + x1) * 4;
      for (let c = 0; c < 4; c++) {
        const top = src[i00 + c] * (1 - tx) + src[i10 + c] * tx;
        const bottom = src[i01 + c] * (1 - tx) + src[i11 + c] * tx;
        out[o + c] = top * (1 - ty) + bottom * ty;
      }
    }
  }
  return out;
}
