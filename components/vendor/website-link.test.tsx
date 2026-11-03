import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import VendorWebsiteLink from "./website-link";

const ORG = "a95e7664-8a15-439b-961b-cf19aafb6739";

describe("VendorWebsiteLink", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("counts a click only when a person clicks", () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    render(<VendorWebsiteLink orgId={ORG} />);
    const link = screen.getByRole("link", { name: "Visit" });
    expect(link.getAttribute("href")).toBe(`/api/vendor/link?org=${ORG}`);
    expect(fetchMock).not.toHaveBeenCalled();

    link.addEventListener("click", (e) => e.preventDefault());
    fireEvent.click(link);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/vendor/track");
    expect(JSON.parse(init.body)).toEqual({ org: ORG, kind: "link_click" });
  });
});
