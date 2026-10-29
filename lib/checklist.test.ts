import { describe, it, expect } from "vitest";
import { datedChecklist, parseIsoDate } from "./checklist";
import { PLAN_TEMPLATE, TEMPLATE_TASK_COUNT } from "./plan-template";

const tasks = (wedding: string, today = "2026-01-01") =>
  datedChecklist(wedding, today).flatMap((p) => p.tasks);

describe("datedChecklist", () => {
  it("lists every task in the app's starter plan, in the same phases", () => {
    const phases = datedChecklist("2027-06-12", "2026-01-01");
    expect(phases.map((p) => p.name)).toEqual(PLAN_TEMPLATE.map((m) => m.name));
    expect(phases.flatMap((p) => p.tasks)).toHaveLength(TEMPLATE_TASK_COUNT);
  });

  it("dates each task the way seed_wedding_plan does: wedding date minus the offset", () => {
    const all = tasks("2027-06-12");
    expect(all.find((t) => t.title.startsWith("Get married"))!.due).toBe("2027-06-12");
    expect(all.find((t) => t.title.startsWith("Attend the rehearsal"))!.due).toBe("2027-06-11");
    // 300 days before, crossing a year boundary.
    expect(all.find((t) => t.title === "Book your venue and lock your date")!.due).toBe("2026-08-16");
    // Negative offsets land after the wedding.
    expect(all.find((t) => t.title === "Write thank-you notes")!.due).toBe("2027-07-12");
  });

  it("gives every task a date, as the page's description promises", () => {
    expect(tasks("2027-06-12").every((t) => t.due !== null)).toBe(true);
  });

  it("flags tasks already past due", () => {
    const all = tasks("2027-06-12", "2027-05-01");
    expect(all.find((t) => t.title === "Book your venue and lock your date")!.overdue).toBe(true);
    expect(all.find((t) => t.title.startsWith("Get married"))!.overdue).toBe(false);
  });

  it("has no dates without a valid wedding date", () => {
    for (const d of ["", "soon", "2027-02-30"]) {
      expect(tasks(d).every((t) => t.due === null && !t.overdue)).toBe(true);
    }
  });
});

describe("parseIsoDate", () => {
  it("accepts real dates and rejects the rest", () => {
    expect(parseIsoDate("2028-02-29")).not.toBeNull();
    expect(parseIsoDate("2027-02-29")).toBeNull();
    expect(parseIsoDate("06/12/2027")).toBeNull();
  });
});
