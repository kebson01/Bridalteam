import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

let pathname = "/";
let gaId: string | undefined = "G-TEST1234";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));
vi.mock("next/script", () => ({
  default: (p: { src?: string; id?: string }) => <i data-testid="script" data-src={p.src ?? p.id} />,
}));
vi.mock("@/lib/google-analytics", () => ({
  get GA_MEASUREMENT_ID() {
    return gaId;
  },
}));

import GoogleAnalytics from "./google-analytics";

const scripts = (c: HTMLElement) =>
  Array.from(c.querySelectorAll("[data-testid=script]")).map((e) => e.getAttribute("data-src"));

beforeEach(() => {
  pathname = "/";
  gaId = "G-TEST1234";
  localStorage.clear();
  delete (window as unknown as Record<string, unknown>)["ga-disable-G-TEST1234"];
});

describe("GoogleAnalytics", () => {
  it("loads gtag.js with the measurement id", () => {
    const { container } = render(<GoogleAnalytics />);
    expect(scripts(container)).toEqual([
      "https://www.googletagmanager.com/gtag/js?id=G-TEST1234",
      "ga-init",
    ]);
  });

  it("renders nothing without a measurement id", () => {
    gaId = undefined;
    const { container } = render(<GoogleAnalytics />);
    expect(scripts(container)).toEqual([]);
  });

  it("never loads on /admin or in a browser the owner opted out", () => {
    pathname = "/admin/analytics";
    expect(scripts(render(<GoogleAnalytics />).container)).toEqual([]);

    pathname = "/";
    localStorage.setItem("bt_no_track", "1");
    expect(scripts(render(<GoogleAnalytics />).container)).toEqual([]);
  });

  it("switches gtag off when a loaded page navigates into /admin", () => {
    const { rerender } = render(<GoogleAnalytics />);
    pathname = "/admin";
    rerender(<GoogleAnalytics />);
    expect((window as unknown as Record<string, boolean>)["ga-disable-G-TEST1234"]).toBe(true);
  });
});
