import { describe, it, expect } from "vitest";
import {
  PIECES,
  chairPositions,
  cleanDimension,
  findClashes,
  findTightSpots,
  isApproximate,
  newItem,
  nextTableNumber,
  normalizeRotation,
  rescaleItems,
  sanitizeItems,
  seatTotal,
  tableCount,
  tableKey,
  type LayoutItem,
} from "./venue-layout";

const item = (over: Partial<LayoutItem>): LayoutItem => ({
  id: "a",
  kind: "round60",
  x: 10,
  y: 10,
  w: 5,
  h: 5,
  rotation: 0,
  seats: 8,
  label: "1",
  ...over,
});

describe("newItem", () => {
  it("numbers tables after the highest number already used", () => {
    const existing = [item({ label: "3" }), item({ id: "b", label: "Oak" }), item({ id: "c", kind: "dance", label: "Dance floor" })];
    expect(nextTableNumber(existing)).toBe(4);
    expect(newItem("round72", 1, 2, existing, "z")).toMatchObject({ label: "4", w: 6, seats: 10 });
  });

  it("gives non-tables and the head table their name, not a number", () => {
    expect(newItem("bar", 0, 0, [], "z").label).toBe("Bar");
    expect(newItem("head", 0, 0, [], "z").label).toBe("Head table");
  });
});

describe("chairPositions", () => {
  it("puts chair 1 at 12 o'clock and spaces a round evenly", () => {
    const c = chairPositions({ kind: "round60", w: 5, h: 5, seats: 4 });
    expect(c).toHaveLength(4);
    expect(c[0].x).toBeCloseTo(0);
    expect(c[0].y).toBeLessThan(-2.5);
    expect(c[2].y).toBeGreaterThan(2.5);
  });

  it("splits a banquet table across both sides, extra chair on top", () => {
    const c = chairPositions({ kind: "banquet8", w: 8, h: 2.5, seats: 7 });
    expect(c.filter((p) => p.y < 0)).toHaveLength(4);
    expect(c.filter((p) => p.y > 0)).toHaveLength(3);
  });

  it("seats a head table along one side only", () => {
    const c = chairPositions({ kind: "head", w: 16, h: 2.5, seats: 8 });
    expect(c.every((p) => p.y < 0)).toBe(true);
  });

  it("has no chairs for a bar", () => {
    expect(chairPositions({ kind: "bar", w: 8, h: 2.5, seats: 0 })).toEqual([]);
  });
});

describe("totals", () => {
  it("counts seats and tables but not the dance floor", () => {
    const items = [item({}), item({ id: "b", kind: "round72", seats: 10 }), item({ id: "c", kind: "dance", seats: 0 })];
    expect(seatTotal(items)).toBe(18);
    expect(tableCount(items)).toBe(2);
  });
});

describe("tableKey", () => {
  it("matches '4' with 'Table 4'", () => {
    expect(tableKey("Table 4")).toBe(tableKey(" 4 "));
    expect(tableKey("Head  Table")).toBe("head table");
  });
});

describe("normalizeRotation", () => {
  it("wraps into 0–359", () => {
    expect(normalizeRotation(-15)).toBe(345);
    expect(normalizeRotation(720)).toBe(0);
    expect(normalizeRotation(Number.NaN)).toBe(0);
  });
});

describe("rescaleItems", () => {
  it("moves pieces with the picture but keeps their size", () => {
    expect(rescaleItems([item({ x: 10, y: 20 })], 2, 0.5)[0]).toMatchObject({ x: 20, y: 10, w: 5, h: 5 });
  });
});

describe("sanitizeItems", () => {
  it("drops unknown kinds, duplicates and junk", () => {
    const out = sanitizeItems(
      [item({}), item({}), { id: "x", kind: "__proto__" }, null, "nope", { id: "y", kind: "toString" }],
      60,
      40,
    );
    expect(out).toHaveLength(1);
  });

  it("restores the catalogue size of a fixed piece and clamps onto the floor", () => {
    const [out] = sanitizeItems([item({ w: 50, h: 50, x: 999, y: -5, seats: 99, rotation: 370 })], 60, 40);
    expect(out).toMatchObject({ w: PIECES.round60.w, h: PIECES.round60.h, x: 60, y: 0, seats: 24, rotation: 10 });
  });

  it("lets a dance floor be resized, within reason", () => {
    const [out] = sanitizeItems([item({ kind: "dance", w: 20, h: 5000 })], 60, 40);
    expect(out).toMatchObject({ w: 20, h: 200, seats: 0 });
  });

  it("returns nothing for something that isn't a list", () => {
    expect(sanitizeItems({ length: 3 }, 60, 40)).toEqual([]);
  });
});

describe("cleanDimension", () => {
  it("keeps rooms within what the database accepts", () => {
    expect(cleanDimension(2, 40)).toBe(5);
    expect(cleanDimension("abc", 40)).toBe(40);
    expect(cleanDimension(42.123, 40)).toBe(42.12);
  });
});

describe("findClashes", () => {
  it("flags two rounds sitting on each other", () => {
    const clashes = findClashes([item({ id: "a", x: 10 }), item({ id: "b", x: 13 })], 60, 40);
    expect([...clashes].sort()).toEqual(["a", "b"]);
  });

  it("leaves well-spaced tables alone", () => {
    expect(findClashes([item({ id: "a", x: 10 }), item({ id: "b", x: 20 })], 60, 40).size).toBe(0);
  });

  it("flags a piece hanging off the floor", () => {
    expect(findClashes([item({ x: 1 })], 60, 40).has("a")).toBe(true);
  });

  it("uses the rotated footprint for rectangles", () => {
    const a = item({ id: "a", kind: "banquet8", w: 8, h: 2.5, x: 10, y: 10 });
    // Directly below `a`, 4 ft down: clear while flat, overlapping once `a` stands on end.
    const b = item({ id: "b", kind: "banquet8", w: 8, h: 2.5, x: 10, y: 14 });
    expect(findClashes([a, b], 60, 40).size).toBe(0);
    expect(findClashes([{ ...a, rotation: 90 }, b], 60, 40).size).toBe(2);
  });

  it("checks a round against a rectangle", () => {
    const bar = item({ id: "bar", kind: "bar", w: 8, h: 2.5, x: 10, y: 10, seats: 0 });
    expect(findClashes([bar, item({ id: "r", x: 10, y: 13 })], 60, 40).size).toBe(2);
    expect(findClashes([bar, item({ id: "r", x: 10, y: 15 })], 60, 40).size).toBe(0);
  });

  it("lets the DJ stand on the stage", () => {
    const stage = item({ id: "s", kind: "stage", w: 16, h: 8, x: 20, y: 10, seats: 0 });
    const dj = item({ id: "d", kind: "dj", w: 6, h: 2.5, x: 20, y: 10, seats: 0 });
    expect(findClashes([stage, dj], 60, 40).size).toBe(0);
  });
});

describe("room features", () => {
  const pillar = item({ id: "p", kind: "pillar", w: 2, h: 2, x: 10, y: 10, seats: 0, label: "Pillar" });

  it("flags a table pushed onto a pillar", () => {
    expect(findClashes([pillar, item({ id: "t", x: 11, y: 10 })], 60, 40).size).toBe(2);
  });

  it("lets room features sit on each other", () => {
    const nogo = item({ id: "n", kind: "nogo", w: 8, h: 6, x: 10, y: 10, seats: 0, label: "No-go area" });
    expect(findClashes([pillar, nogo], 60, 40).size).toBe(0);
  });

  it("treats a door's swing as its footprint", () => {
    const door = item({ id: "d", kind: "door", w: 3, h: 3, x: 10, y: 2, seats: 0, label: "Door" });
    expect(findClashes([door, item({ id: "t", x: 10, y: 5 })], 60, 40).size).toBe(2);
  });

  it("gives doors their catalogue size whatever is sent", () => {
    const [d] = sanitizeItems([item({ kind: "doubledoor", w: 40, h: 40, seats: 0 })], 60, 40);
    expect(d).toMatchObject({ w: 6, h: 3, seats: 0 });
  });
});

describe("isApproximate", () => {
  it("is true only for a floor straightened from a photo", () => {
    expect(isApproximate("photo")).toBe(true);
    expect(isApproximate("plan")).toBe(false);
    expect(isApproximate("blank")).toBe(false);
    expect(isApproximate(null)).toBe(false);
  });
});

describe("findTightSpots", () => {
  // A 60" round with chairs reaches 2.5 + 1.55 ft from its centre; two of them
  // need 2 × 4.05 + 3 = 11.1 ft between centres for a 36" walkway.
  it("flags tables whose chair backs leave less than 36 inches", () => {
    expect(findTightSpots([item({ id: "a", x: 10 }), item({ id: "b", x: 20 })])).toEqual([{ a: "a", b: "b" }]);
    expect(findTightSpots([item({ id: "a", x: 10 }), item({ id: "b", x: 22 })])).toEqual([]);
  });

  it("leaves clashes, the dance floor and pieces nobody sits at alone", () => {
    expect(findTightSpots([item({ id: "a", x: 10 }), item({ id: "b", x: 12 })])).toEqual([]);
    const dance = item({ id: "d", kind: "dance", w: 16, h: 16, x: 22, y: 10, seats: 0 });
    expect(findTightSpots([item({ id: "a", x: 10 }), dance])).toEqual([]);
    const bar = item({ id: "b", kind: "bar", w: 8, h: 2.5, x: 20, y: 10, seats: 0 });
    const buffet = item({ id: "c", kind: "buffet", w: 8, h: 2.5, x: 20, y: 13, seats: 0 });
    expect(findTightSpots([bar, buffet])).toEqual([]);
    expect(findTightSpots([item({ id: "a", x: 10 }), bar])).toEqual([{ a: "a", b: "b" }]);
  });
});
