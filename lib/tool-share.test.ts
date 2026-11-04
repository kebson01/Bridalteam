import { describe, expect, it } from "vitest";
import {
  budgetQuery,
  checklistQuery,
  readBudgetShare,
  readChecklistShare,
  readTablesShare,
  tablesQuery,
} from "./tool-share";

const p = (s: string) => new URLSearchParams(s);

describe("budget share", () => {
  it("round-trips", () => {
    expect(readBudgetShare(p(budgetQuery(35000, 120)))).toEqual({ total: 35000, guests: 120 });
    expect(budgetQuery(35000, null)).toBe("total=35000");
  });
  it("ignores junk, negatives and absurd values", () => {
    expect(readBudgetShare(p("total=abc&guests=-5"))).toEqual({ total: null, guests: null });
    expect(readBudgetShare(p("total=99999999999&guests=1e3"))).toEqual({ total: null, guests: null });
  });
});

describe("checklist share", () => {
  it("accepts only a real date", () => {
    expect(readChecklistShare(p(checklistQuery("2027-05-01")))).toBe("2027-05-01");
    expect(readChecklistShare(p("date=2027-02-30"))).toBeNull();
    expect(readChecklistShare(p("date=<script>"))).toBeNull();
    expect(checklistQuery("")).toBe("");
  });
});

describe("tables share", () => {
  it("round-trips and drops an empty head table", () => {
    expect(readTablesShare(p(tablesQuery(150, 10, 12)))).toEqual({ guests: 150, seats: 10, head: 12 });
    expect(tablesQuery(150, 10, 0)).toBe("guests=150&seats=10");
    expect(tablesQuery(0, 10, 0)).toBe("");
  });
});
