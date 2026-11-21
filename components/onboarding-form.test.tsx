import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The form imports a server action; in a unit test we only care that the form
// posts the right FormData, so stand in for it and capture what it receives.
const submitted = vi.fn();
vi.mock("@/app/onboarding/actions", () => ({
  createWorkspace: async (_prev: unknown, formData: FormData) => {
    const data = Object.fromEntries(formData.entries());
    submitted(data);
    // A vendor whose business is already listed is shown that listing first.
    if (data.account_type === "vendor" && data.business_name === "Fire Water Bars" && data.skip_match !== "1") {
      return {
        error: null,
        match: { orgId: "org-1", businessName: "Fire Water Bars", category: "Bar service", city: "Miami", maskedEmail: "he•••@firewater.example" },
      };
    }
    return { error: null };
  },
}));

vi.mock("@/app/onboarding/claim-actions", () => ({
  sendClaimLinkToListing: async () => ({ error: null, sentTo: "he•••@firewater.example" }),
}));

import OnboardingForm from "./onboarding-form";

/**
 * The bug this guards against isn't a crash — it's the optional detail fields
 * silently not reaching the server.
 *
 * They live inside a collapsed <details>. That works because HTML submits
 * inputs in a closed <details>, but it is exactly the kind of assumption that
 * looks fine in review, passes `tsc`, and quietly drops a couple's budget and
 * city on every signup. Swapping <details> for conditional rendering would
 * break it invisibly.
 */
describe("OnboardingForm (couple)", () => {
  beforeEach(() => submitted.mockClear());

  it("requires only the first name", () => {
    render(<OnboardingForm initialType="couple" />);
    expect(screen.getByLabelText(/your name/i)).toBeRequired();
    for (const label of [/partner.s name/i, /wedding date/i, /city/i, /guests/i, /budget/i, /style/i]) {
      expect(screen.getByLabelText(label)).not.toBeRequired();
    }
  });

  it("keeps the detail fields collapsed until asked for", () => {
    // Queried as an element rather than by role: <fieldset> and <details> both
    // expose role="group", and jsdom doesn't derive the details' accessible
    // name from its <summary>, so neither role nor name disambiguates here.
    const { container } = render(<OnboardingForm initialType="couple" />);
    // Present in the DOM (so they submit), but not disclosed.
    expect(container.querySelector("details")).not.toHaveAttribute("open");
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
  });

  it("submits the collapsed detail fields anyway", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialType="couple" />);

    await user.type(screen.getByLabelText(/your name/i), "Alex");
    // Fill a collapsed field without opening the section.
    await user.type(screen.getByLabelText(/budget/i), "35000");
    await user.click(screen.getByRole("button", { name: /create my plan/i }));

    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ partner_one: "Alex", budget: "35000", account_type: "couple" }),
    );
  });

  it("opens the detail section on click", async () => {
    const user = userEvent.setup();
    const { container } = render(<OnboardingForm initialType="couple" />);
    await user.click(screen.getByText(/add a few details/i));
    expect(container.querySelector("details")).toHaveAttribute("open");
  });

  it("sends the account type the caller picked", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialType="vendor" />);
    await user.type(screen.getByLabelText(/business name/i), "Bloom & Vine");
    await user.click(screen.getByRole("button", { name: /vendor account/i }));
    expect(submitted).toHaveBeenCalledWith(
      expect.objectContaining({ account_type: "vendor", business_name: "Bloom & Vine" }),
    );
  });

  it("lets a guest continue with nothing but an optional name", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialType="couple" />);
    await user.click(screen.getByRole("button", { name: /guest or just exploring/i }));
    expect(screen.queryByLabelText(/wedding date/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).not.toBeRequired();
    await user.click(screen.getByRole("button", { name: /^continue$/i }));
    expect(submitted).toHaveBeenCalledWith(expect.objectContaining({ account_type: "explorer" }));
  });

  it("shows a vendor the listing we already have, offers the claim link, and still lets them go ahead", async () => {
    const user = userEvent.setup();
    render(<OnboardingForm initialType="vendor" />);
    await user.type(screen.getByLabelText(/business name/i), "Fire Water Bars");
    await user.click(screen.getByRole("button", { name: /vendor account/i }));

    expect(await screen.findByText(/already have a page for Fire Water Bars/i)).toBeInTheDocument();
    expect(screen.getByText("he•••@firewater.example")).toBeInTheDocument();
    // The name they typed survives the round trip (React resets uncontrolled fields after an action).
    expect(screen.getByLabelText(/business name/i)).toHaveValue("Fire Water Bars");

    await user.click(screen.getByRole("button", { name: /email me the claim link/i }));
    expect(await screen.findByText(/Sent to he•••@firewater\.example/)).toBeInTheDocument();

    submitted.mockClear();
    await user.click(screen.getByRole("button", { name: /create a new page instead/i }));
    expect(submitted).toHaveBeenCalledWith(expect.objectContaining({ business_name: "Fire Water Bars", skip_match: "1" }));
  });
});

