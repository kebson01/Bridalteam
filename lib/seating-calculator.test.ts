import { describe, it, expect } from "vitest";
import { tablePlan } from "./seating-calculator";

describe("tablePlan", () => {
  it("fills tables and puts the remainder at the last one", () => {
    expect(tablePlan(100, 8)).toEqual({ seated: 100, tables: 13, fullTables: 12, lastTable: 4, emptySeats: 4 });
  });

  it("reports every table full when the count divides evenly", () => {
    expect(tablePlan(120, 10)).toEqual({ seated: 120, tables: 12, fullTables: 12, lastTable: 0, emptySeats: 0 });
  });

  it("takes the head table off first", () => {
    const p = tablePlan(110, 10, 10)!;
    expect(p.seated).toBe(100);
    expect(p.tables).toBe(10);
  });

  it("never seats a negative number of people", () => {
    expect(tablePlan(6, 8, 12)).toEqual({ seated: 0, tables: 0, fullTables: 0, lastTable: 0, emptySeats: 0 });
  });

  it("ignores fractions and junk", () => {
    expect(tablePlan(17.9, 8.5)!.tables).toBe(3);
    expect(tablePlan(Number.NaN, 8)!.tables).toBe(0);
    expect(tablePlan(100, 0)).toBeNull();
    expect(tablePlan(100, Number.NaN)).toBeNull();
  });
});
