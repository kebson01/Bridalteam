import { describe, expect, it } from "vitest";
import { arrangeFeed, seedAllowance } from "./seed-content";

const seed = (id: string, like_count = 0, retired_at: string | null = null) => ({ id, is_seed: true, like_count, retired_at });
const real = (id: string) => ({ id, is_seed: false, like_count: 0, retired_at: null });

describe("seedAllowance", () => {
  it("keeps every seed piece while there is no real content", () => {
    expect(seedAllowance(20, 0)).toBe(20);
  });

  it("retires one seed piece for every two real ones", () => {
    expect(seedAllowance(20, 1)).toBe(20);
    expect(seedAllowance(20, 2)).toBe(19);
    expect(seedAllowance(20, 39)).toBe(1);
    expect(seedAllowance(20, 40)).toBe(0);
    expect(seedAllowance(20, 100)).toBe(0);
  });
});

describe("arrangeFeed", () => {
  it("puts real content above seed content", () => {
    const out = arrangeFeed([seed("s1"), real("r1"), seed("s2")]);
    expect(out.items.map((i) => i.id)).toEqual(["r1", "s1", "s2"]);
  });

  it("keeps the most-liked seed pieces when retiring", () => {
    const out = arrangeFeed([seed("a", 1), seed("b", 5), seed("c", 3), real("r1"), real("r2"), real("r3"), real("r4")]);
    expect(out.items.map((i) => i.id)).toEqual(["r1", "r2", "r3", "r4", "b"]);
    expect(out.seedShown).toBe(1);
    expect(out.seedRetired).toBe(2);
  });

  it("breaks like ties by feed order (newest first)", () => {
    const out = arrangeFeed([seed("new"), seed("old"), real("r1"), real("r2")]);
    expect(out.items.map((i) => i.id)).toEqual(["r1", "r2", "new"]);
  });

  it("drops seed pieces an admin retired by hand", () => {
    const out = arrangeFeed([seed("a", 0, "2026-11-03T00:00:00Z"), seed("b")]);
    expect(out.items.map((i) => i.id)).toEqual(["b"]);
    expect(out.seedRetired).toBe(1);
  });
});
