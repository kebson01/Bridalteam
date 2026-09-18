import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The form imports a server action; in a unit test we only care that the form
// posts the right FormData, so stand in for it and capture what it receives.
const submitted = vi.fn();
vi.mock("@/app/onboarding/actions", () => ({
  createWorkspace: async (_prev: unknown, formData: FormData) => {
    submitted(Object.fromEntries(formData.entries()));
    return { error: null };
  },
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
});
