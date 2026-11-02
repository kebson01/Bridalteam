import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

const track = vi.fn();
let pathname = "/";
vi.mock("@/lib/events", async (orig) => ({ ...(await orig<typeof import("@/lib/events")>()), track: (...a: unknown[]) => track(...a) }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("@/lib/attribution", () => ({ readAttribution: () => null, readReferrer: () => "google.com" }));

import PageViewTracker from "./page-view-tracker";

function setVisibility(state: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { configurable: true, get: () => state });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-02T15:00:00Z"));
  track.mockClear();
  pathname = "/";
  localStorage.clear();
  setVisibility("visible");
});
afterEach(() => vi.useRealTimers());

describe("PageViewTracker", () => {
  it("records a view, then the on-screen time when the visitor moves on", () => {
    const { rerender } = render(<PageViewTracker />);
    expect(track).toHaveBeenCalledWith("page_view", "/", "google.com");

    vi.advanceTimersByTime(42_000);
    pathname = "/vendors";
    rerender(<PageViewTracker />);

    expect(track).toHaveBeenCalledWith("page_leave", "/", undefined, 42_000);
    expect(track).toHaveBeenLastCalledWith("page_view", "/vendors", "google.com");
  });

  it("counts only visible time: hiding the tab sends what's accrued and stops the clock", () => {
    render(<PageViewTracker />);
    vi.advanceTimersByTime(10_000);
    setVisibility("hidden");
    expect(track).toHaveBeenCalledWith("page_leave", "/", undefined, 10_000);

    track.mockClear();
    vi.advanceTimersByTime(60 * 60 * 1000); // an hour in another tab doesn't count
    setVisibility("visible");
    vi.advanceTimersByTime(5_000);
    window.dispatchEvent(new Event("pagehide"));
    expect(track).toHaveBeenCalledWith("page_leave", "/", undefined, 5_000);
  });

  it("never counts /admin, and excludes the admin's browser", () => {
    pathname = "/admin/analytics";
    render(<PageViewTracker />);
    expect(track).not.toHaveBeenCalled();
    expect(localStorage.getItem("bt_no_track")).toBe("1");
  });
});
