import { describe, it, expect } from "vitest";
import { homography, applyHomography, orderCorners, warpToRect } from "./homography";

const close = (a: { x: number; y: number }, b: { x: number; y: number }) => {
  expect(a.x).toBeCloseTo(b.x, 6);
  expect(a.y).toBeCloseTo(b.y, 6);
};

describe("homography", () => {
  it("maps each of the four points onto its partner", () => {
    const from = [
      { x: 120, y: 300 },
      { x: 880, y: 310 },
      { x: 1000, y: 700 },
      { x: 20, y: 690 },
    ];
    const to = [
      { x: 0, y: 0 },
      { x: 600, y: 0 },
      { x: 600, y: 400 },
      { x: 0, y: 400 },
    ];
    const m = homography(from, to)!;
    from.forEach((p, i) => close(applyHomography(m, p), to[i]));
  });

  it("is the identity for identical points", () => {
    const sq = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
    ];
    close(applyHomography(homography(sq, sq)!, { x: 0.3, y: 0.7 }), { x: 0.3, y: 0.7 });
  });

  it("refuses corners that line up", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
    ];
    expect(homography(line, line)).toBeNull();
  });
});

describe("orderCorners", () => {
  it("returns top-left, top-right, bottom-right, bottom-left whatever the tap order", () => {
    const tl = { x: 100, y: 200 };
    const tr = { x: 900, y: 210 };
    const br = { x: 1000, y: 700 };
    const bl = { x: 10, y: 690 };
    expect(orderCorners([br, tl, bl, tr])).toEqual([tl, tr, br, bl]);
    expect(orderCorners([bl, br, tr, tl])).toEqual([tl, tr, br, bl]);
  });
});

describe("warpToRect", () => {
  it("copies a picture through unchanged when the corners are its own edges", () => {
    // 2×2 image: red, green / blue, white.
    const src = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255, 255, 255, 255, 255]);
    const quad = [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 2 },
      { x: 0, y: 2 },
    ];
    expect(Array.from(warpToRect(src, 2, 2, quad, 2, 2)!)).toEqual(Array.from(src));
  });

  it("fills pixels outside the photo with white", () => {
    const src = new Uint8ClampedArray(4 * 4).fill(0);
    const quad = [
      { x: -10, y: -10 },
      { x: 12, y: -10 },
      { x: 12, y: 12 },
      { x: -10, y: 12 },
    ];
    const out = warpToRect(src, 2, 2, quad, 4, 4)!;
    expect(Array.from(out.slice(0, 4))).toEqual([255, 255, 255, 255]);
  });
});
