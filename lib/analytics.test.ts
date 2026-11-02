import { describe, it, expect, beforeEach } from "vitest";
import { count, duration, pageLabel, pct, shortDay } from "./analytics-format";
import { cleanDuration, cleanVisitId, excludeAdminBrowserByDefault, setTrackingDisabled, trackingDisabled, visitId, VISIT_IDLE_MS } from "./events";

describe("analytics formatting", () => {
  it("formats percentages readably", () => {
    expect(pct(0.1234)).toBe("12%");
    expect(pct(0.0456)).toBe("4.6%");
    expect(pct(0.5)).toBe("50%");
    expect(pct(0)).toBe("0%");
    expect(pct(null)).toBe("–");
  });

  it("formats durations", () => {
    expect(duration(45)).toBe("45s");
    expect(duration(185)).toBe("3m 05s");
    expect(duration(3720)).toBe("1h 02m");
    expect(duration(0)).toBe("–");
    expect(duration(null)).toBe("–");
  });

  it("formats counts, days and page names", () => {
    expect(count(12345)).toBe("12,345");
    expect(shortDay("2026-11-02")).toBe("Nov 2");
    expect(pageLabel("/")).toBe("Home");
    expect(pageLabel("/w/[id]/budget")).toBe("/w/[id]/budget");
    expect(pageLabel(null)).toBe("(unknown)");
  });
});

describe("visits", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("keeps one id through a visit and starts a new one after 30 idle minutes", () => {
    const t0 = 1_800_000_000_000;
    const first = visitId(t0)!;
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(visitId(t0 + 60_000)).toBe(first);
    // Activity keeps it alive...
    expect(visitId(t0 + 60_000 + VISIT_IDLE_MS - 1)).toBe(first);
    // ...and 30 quiet minutes end it.
    expect(visitId(t0 + 60_000 + 2 * VISIT_IDLE_MS)).not.toBe(first);
  });

  it("stores the id in session storage only, never a cookie or local storage", () => {
    visitId();
    expect(sessionStorage.getItem("bt_visit")).toBeTruthy();
    expect(document.cookie).toBe("");
    expect(localStorage.length).toBe(0);
  });

  it("excludes an admin's browser by default, but respects a choice to be counted", () => {
    expect(trackingDisabled()).toBe(false);
    excludeAdminBrowserByDefault();
    expect(trackingDisabled()).toBe(true);
    setTrackingDisabled(false);
    excludeAdminBrowserByDefault(); // the next /admin visit must not undo the choice
    expect(trackingDisabled()).toBe(false);
    setTrackingDisabled(true);
    expect(trackingDisabled()).toBe(true);
  });

  it("validates what the server stores", () => {
    expect(cleanVisitId("11111111-1111-4111-8111-11111111111A")).toBe("11111111-1111-4111-8111-11111111111a");
    expect(cleanVisitId("not-an-id")).toBeUndefined();
    expect(cleanVisitId(42)).toBeUndefined();
    expect(cleanDuration(1234.6)).toBe(1235);
    expect(cleanDuration(99 * 60 * 60 * 1000)).toBe(30 * 60 * 1000);
    expect(cleanDuration(-5)).toBeUndefined();
    expect(cleanDuration("5000")).toBeUndefined();
  });
});
