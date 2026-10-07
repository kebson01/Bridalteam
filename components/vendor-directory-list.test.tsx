import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import VendorDirectoryList, { type DirectoryVendor } from "./vendor-directory-list";

/**
 * The failure this guards against is silent: an area filter that quietly drops
 * the 29 published listings whose city is "South Florida". They are real,
 * reachable vendors who do serve the area a couple just picked, so hiding them
 * makes the directory look a fifth emptier than it is -- and nothing about the
 * page would look broken.
 */
const v = (
  org_id: string,
  business_name: string,
  city: string | null,
  category = "DJ",
): DirectoryVendor => ({
  org_id,
  business_name,
  category,
  description: null,
  city,
  region: "FL",
  logo_url: null,
  cover_url: null,
});

const VENDORS = [
  v("1", "Lauderdale Lights", "Fort Lauderdale"),
  v("2", "Miami Mixers", "Miami"),
  v("3", "Boca Beats", "Boca Raton"),
  v("4", "Everywhere Entertainment", "South Florida"),
  v("5", "Hobe Sound Harpists", "Hobe Sound"),
  v("6", "Gables Grooms", "Coral Gables", "Photography"),
];

const names = () =>
  screen
    .getAllByRole("heading", { level: 3 })
    .map((h) => h.textContent);

describe("VendorDirectoryList area filter", () => {
  it("shows every vendor before any filter is applied", () => {
    render(<VendorDirectoryList vendors={VENDORS} />);
    expect(names()).toHaveLength(6);
    expect(screen.getByText("6 vendors")).toBeTruthy();
  });

  it("keeps a region-wide vendor visible in a filtered area", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await user.click(screen.getByRole("button", { name: "Broward" }));

    const shown = names();
    expect(shown).toContain("Lauderdale Lights");
    // The assertion that matters.
    expect(shown).toContain("Everywhere Entertainment");
    expect(shown).not.toContain("Miami Mixers");
    expect(shown).not.toContain("Boca Beats");
  });

  it("excludes a vendor outside the tri-county area from every area", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    for (const area of ["Broward", "Miami-Dade", "Palm Beach"]) {
      await user.click(screen.getByRole("button", { name: area }));
      expect(names()).not.toContain("Hobe Sound Harpists");
    }
  });

  it("says why a region-wide vendor is in a filtered list", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await user.click(screen.getByRole("button", { name: "Palm Beach" }));
    expect(screen.getByText(/includes vendors who cover all of South Florida/i)).toBeTruthy();
    expect(screen.getByText(/Serves all of South Florida/i)).toBeTruthy();
  });

  it("combines area and category rather than letting one override the other", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await user.click(screen.getByRole("button", { name: "Miami-Dade" }));
    await user.click(screen.getByRole("button", { name: "Photography" }));

    const shown = names();
    expect(shown).toContain("Gables Grooms");
    // A Miami DJ must not survive a Photography filter.
    expect(shown).not.toContain("Miami Mixers");
    // ...nor a region-wide DJ, whose category still does not match.
    expect(shown).not.toContain("Everywhere Entertainment");
  });

  it("returns to the full list when the area is cleared", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await user.click(screen.getByRole("button", { name: "Broward" }));
    await user.click(screen.getByRole("button", { name: "Anywhere" }));
    expect(names()).toHaveLength(6);
  });

  it("renders no area chips when every listing is region-wide", () => {
    // Otherwise the page offers a filter that changes nothing.
    render(<VendorDirectoryList vendors={[v("9", "Statewide Sounds", "South Florida")]} />);
    expect(screen.queryByRole("button", { name: "Broward" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Anywhere" })).toBeNull();
  });
});
