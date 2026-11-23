import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

const gaEvent = vi.fn();
let state = { error: null as string | null, sent: false };
vi.mock("@/lib/google-analytics", () => ({ gaEvent: (...a: unknown[]) => gaEvent(...a) }));
vi.mock("@/app/vendor/inquiry-actions", () => ({ sendInquiry: vi.fn() }));
vi.mock("react", async (orig) => ({
  ...(await orig<typeof import("react")>()),
  useActionState: () => [state, vi.fn(), false],
}));

import VendorInquiryButton from "./inquiry-button";

const props = { vendorOrgId: "org-1", signedIn: true, loginHref: "/auth/login", vendorCategory: "Florist" };

beforeEach(() => {
  gaEvent.mockClear();
  state = { error: null, sent: false };
});

describe("VendorInquiryButton GA lead", () => {
  it("sends one generate_lead, with no personal data, once the inquiry is sent", () => {
    const { rerender } = render(<VendorInquiryButton {...props} defaultEmail="a@b.com" defaultName="Ann" />);
    expect(gaEvent).not.toHaveBeenCalled();

    state = { error: null, sent: true };
    rerender(<VendorInquiryButton {...props} defaultEmail="a@b.com" defaultName="Ann" />);
    rerender(<VendorInquiryButton {...props} defaultEmail="a@b.com" defaultName="Ann" />);

    expect(gaEvent).toHaveBeenCalledTimes(1);
    expect(gaEvent).toHaveBeenCalledWith({
      name: "generate_lead",
      params: { lead_source: "vendor_inquiry", vendor_category: "Florist" },
    });
    expect(JSON.stringify(gaEvent.mock.calls)).not.toMatch(/a@b\.com|Ann/);
  });

  it("sends nothing when the inquiry fails", () => {
    state = { error: "Couldn't send your inquiry.", sent: false };
    render(<VendorInquiryButton {...props} />);
    expect(gaEvent).not.toHaveBeenCalled();
  });
});
