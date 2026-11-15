import { describe, expect, it } from "vitest";
import { endOfDay, lastDayOf, parseAudience, parsePromotion, promotionStatus, startOfDay } from "./promotions";

const NOW = new Date("2026-11-15T15:00:00Z");
const ID = "10000000-0000-0000-0000-000000000001";

describe("promotion dates (Florida time)", () => {
  it("runs through the whole last day", () => {
    // Dec 31 ends at midnight Eastern (UTC-5 in winter).
    expect(endOfDay("2026-12-31")?.toISOString()).toBe("2027-01-01T05:00:00.000Z");
    expect(lastDayOf("2027-01-01T05:00:00.000Z")).toBe("2026-12-31");
  });

  it("handles daylight saving time", () => {
    expect(startOfDay("2026-07-04")?.toISOString()).toBe("2026-07-04T04:00:00.000Z");
    // The night clocks go back (Nov 1, 2026): the day starts on EDT, the next on EST.
    expect(startOfDay("2026-11-01")?.toISOString()).toBe("2026-11-01T04:00:00.000Z");
    expect(endOfDay("2026-11-01")?.toISOString()).toBe("2026-11-02T05:00:00.000Z");
  });

  it("rejects dates that don't exist", () => {
    expect(startOfDay("2026-02-30")).toBeNull();
    expect(endOfDay("12/31/2026")).toBeNull();
  });
});

describe("parseAudience", () => {
  it("accepts everyone, with the optional published/claimed limits", () => {
    expect(parseAudience({ mode: "all", published_only: true })).toEqual({
      value: { mode: "all", categories: null, cities: null, org_ids: null, published_only: true, claimed_only: false },
    });
  });

  it("needs a category or city for groups, and tidies them", () => {
    expect(parseAudience({ mode: "groups", categories: [], cities: [] })).toHaveProperty("error");
    expect(parseAudience({ mode: "groups", categories: [" DJ ", "DJ", 3], cities: [] })).toEqual({
      value: { mode: "groups", categories: ["DJ"], cities: null, org_ids: null, published_only: false, claimed_only: false },
    });
  });

  it("keeps only real vendor ids when hand-picking", () => {
    expect(parseAudience({ mode: "picked", org_ids: ["nope"] })).toHaveProperty("error");
    expect(parseAudience({ mode: "picked", org_ids: [ID, "x"] })).toMatchObject({ value: { org_ids: [ID] } });
  });

  it("requires a mode", () => {
    expect(parseAudience({})).toHaveProperty("error");
  });
});

describe("parsePromotion", () => {
  const good = { name: "Holiday", plan: "pro", start: "now", end: "2026-12-31", audience: { mode: "all" } };

  it("builds a promotion that starts now and runs through the end date", () => {
    expect(parsePromotion(good, NOW)).toEqual({
      value: {
        name: "Holiday",
        plan: "pro",
        starts_at: NOW.toISOString(),
        ends_at: "2027-01-01T05:00:00.000Z",
        note: null,
        categories: null,
        cities: null,
        org_ids: null,
        published_only: false,
        claimed_only: false,
      },
    });
  });

  it("refuses bad plans, names and windows", () => {
    expect(parsePromotion({ ...good, plan: "gold" }, NOW)).toHaveProperty("error");
    expect(parsePromotion({ ...good, name: "  " }, NOW)).toHaveProperty("error");
    expect(parsePromotion({ ...good, end: "2026-11-01" }, NOW)).toHaveProperty("error");
    expect(parsePromotion({ ...good, start: "2027-01-05", end: "2027-01-04" }, NOW)).toHaveProperty("error");
    expect(parsePromotion({ ...good, audience: { mode: "picked", org_ids: [] } }, NOW)).toHaveProperty("error");
  });
});

describe("promotionStatus", () => {
  it("is scheduled, running or ended", () => {
    const p = { starts_at: "2026-11-01T00:00:00Z", ends_at: "2027-01-01T05:00:00Z", ended_at: null };
    expect(promotionStatus(p, NOW)).toBe("running");
    expect(promotionStatus({ ...p, starts_at: "2026-12-01T00:00:00Z" }, NOW)).toBe("scheduled");
    expect(promotionStatus({ ...p, ended_at: "2026-11-10T00:00:00Z" }, NOW)).toBe("ended");
    expect(promotionStatus({ ...p, ends_at: "2026-11-14T00:00:00Z" }, NOW)).toBe("ended");
  });
});
