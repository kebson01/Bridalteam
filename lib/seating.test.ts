import { describe, it, expect } from "vitest";
import {
  applySeatChanges,
  cleanSeatChanges,
  dietaryTags,
  initials,
  seatGuest,
  seatTable,
  swapSeats,
  tableTitle,
  type SeatGuest,
} from "./seating";

const guest = (id: string, over: Partial<SeatGuest> = {}): SeatGuest => ({
  id,
  name: id.toUpperCase(),
  household: "House",
  tableName: "Table 4",
  seat: null,
  dish: null,
  dietary: null,
  ...over,
});

describe("dietaryTags", () => {
  it("summarises what a household typed", () => {
    expect(dietaryTags("Sam is gluten free, no nuts please")).toEqual(["GF", "NUT FREE"]);
    expect(dietaryTags("vegan (so no dairy)")).toEqual(["VEGAN"]);
    expect(dietaryTags("Severe shellfish allergy, carries an EpiPen")).toEqual(["FISH", "SEVERE"]);
  });

  it("flags text it can't summarise rather than dropping it", () => {
    expect(dietaryTags("no cilantro")).toEqual(["NOTE"]);
    expect(dietaryTags("  ")).toEqual([]);
    expect(dietaryTags(null)).toEqual([]);
  });
});

describe("names", () => {
  it("titles numbered tables and makes initials", () => {
    expect(tableTitle("4")).toBe("Table 4");
    expect(tableTitle("Oak")).toBe("Oak");
    expect(initials("Elena  Maria Rostova")).toBe("ER");
    expect(initials("Prince")).toBe("PR");
  });
});

describe("seatTable", () => {
  it("keeps chosen chairs and fills the rest in order", () => {
    const s = seatTable([guest("a", { seat: 3 }), guest("b"), guest("c", { seat: 3 }), guest("d")], 4);
    expect(s.chairs.map((g) => g?.id ?? null)).toEqual(["b", "c", "a", "d"]);
    expect(s.overflow).toEqual([]);
  });

  it("puts people past the last chair in overflow", () => {
    const s = seatTable([guest("a"), guest("b"), guest("c")], 2);
    expect(s.overflow.map((g) => g.id)).toEqual(["c"]);
  });
});

describe("moving people", () => {
  it("swaps two people and pins everyone else where they're drawn", () => {
    const guests = [guest("a"), guest("b"), guest("c")];
    const changes = swapSeats(guests, "Table 4", 8, 1, 3);
    const after = seatTable(applySeatChanges(guests, changes), 8);
    expect(after.chairs.slice(0, 3).map((g) => g?.id)).toEqual(["c", "b", "a"]);
  });

  it("moves into an empty chair without anyone else hopping into the gap", () => {
    const guests = [guest("a"), guest("b")];
    const after = seatTable(applySeatChanges(guests, swapSeats(guests, "Table 4", 8, 1, 6)), 8);
    expect(after.chairs[0]).toBeNull();
    expect(after.chairs[1]?.id).toBe("b");
    expect(after.chairs[5]?.id).toBe("a");
  });

  it("seats someone in the chair asked for, or the first free one", () => {
    const guests = [guest("a"), guest("x", { tableName: null })];
    expect(seatGuest(guests, "x", "Table 4", 8, 5).find((c) => c.id === "x")?.seat_number).toBe(5);
    expect(seatGuest(guests, "x", "Table 4", 8, 1).find((c) => c.id === "x")?.seat_number).toBe(2);
  });

  it("seats someone at a full table without a chair", () => {
    const guests = [guest("a"), guest("x", { tableName: null })];
    expect(seatGuest(guests, "x", "Table 4", 1).find((c) => c.id === "x")).toEqual({
      id: "x",
      table_name: "Table 4",
      seat_number: null,
    });
  });
});

describe("cleanSeatChanges", () => {
  const id = "0b7f0d4e-6f4a-4f43-9d5e-0b1f8a2c3d4e";
  it("drops bad rows and clamps the rest", () => {
    expect(
      cleanSeatChanges([
        { id, table_name: "  Table 4 ", seat_number: 30 },
        { id: "nope", table_name: "x" },
        "junk",
      ]),
    ).toEqual([{ id, table_name: "Table 4", seat_number: null }]);
    expect(cleanSeatChanges([{ id, table_name: "", seat_number: 2 }])).toEqual([
      { id, table_name: null, seat_number: null },
    ]);
    expect(cleanSeatChanges("nope")).toEqual([]);
  });
});
