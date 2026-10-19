import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import VendorDirectoryList, { type DirectoryVendor } from "./vendor-directory-list";

/**
 * Two failures this guards against, both silent.
 *
 * One: an area filter that drops the listings whose city is "South Florida".
 * They are real, reachable vendors who serve the area a couple just picked, so
 * hiding them makes the directory look emptier than it is.
 *
 * Two, and the reason the filter became two-level: those same listings leaking
 * into *another* metro. Under the old flat rule a "South Florida" vendor
 * matched every area id, so an Orlando couple would have been shown Fort
 * Lauderdale vendors. Nothing about the page would look wrong either way.
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
  v("7", "Orlando Oscillators", "Orlando"),
  v("8", "Winter Park Winds", "Winter Park"),
  v("9", "Statewide Sounds", "Florida"),
];

const names = () => screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent);
const pick = async (user: ReturnType<typeof userEvent.setup>, label: string) =>
  user.click(screen.getByRole("button", { name: label }));

describe("VendorDirectoryList metro and area filters", () => {
  it("shows every vendor before any filter is applied", () => {
    render(<VendorDirectoryList vendors={VENDORS} />);
    expect(names()).toHaveLength(9);
    expect(screen.getByText("9 vendors")).toBeTruthy();
  });

  it("does not show South Florida vendors under Orlando", async () => {
    // The assertion this whole change exists for.
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "Orlando");

    const shown = names();
    expect(shown).toContain("Orlando Oscillators");
    expect(shown).toContain("Winter Park Winds");
    expect(shown).not.toContain("Everywhere Entertainment");
    expect(shown).not.toContain("Lauderdale Lights");
    // A genuinely statewide vendor still belongs here.
    expect(shown).toContain("Statewide Sounds");
  });

  it("keeps a region-wide vendor visible inside its own metro", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "South Florida");

    const shown = names();
    expect(shown).toContain("Everywhere Entertainment");
    expect(shown).toContain("Lauderdale Lights");
    expect(shown).not.toContain("Orlando Oscillators");
  });

  it("narrows to an area only within the chosen metro", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    // The area row does not exist until a metro is chosen.
    expect(screen.queryByRole("button", { name: "Broward" })).toBeNull();

    await pick(user, "South Florida");
    await pick(user, "Broward");

    const shown = names();
    expect(shown).toContain("Lauderdale Lights");
    // Region-wide rows survive the narrower filter too.
    expect(shown).toContain("Everywhere Entertainment");
    expect(shown).not.toContain("Miami Mixers");
    expect(shown).not.toContain("Boca Beats");
  });

  it("offers no area row for a metro that has no areas", async () => {
    // Orlando has no sub-areas. A one-chip row would imply a filter it cannot
    // apply.
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "Orlando");
    expect(screen.queryByRole("button", { name: "All areas" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Broward" })).toBeNull();
  });

  it("drops the area when the metro changes", async () => {
    // Otherwise a Broward filter survives into Orlando and returns nothing.
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "South Florida");
    await pick(user, "Broward");
    expect(names()).not.toContain("Orlando Oscillators");

    await pick(user, "Orlando");
    const shown = names();
    expect(shown).toContain("Orlando Oscillators");
    expect(shown.length).toBeGreaterThan(0);
  });

  it("excludes a vendor outside every metro from all of them", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    for (const m of ["South Florida", "Orlando"]) {
      await pick(user, m);
      expect(names()).not.toContain("Hobe Sound Harpists");
    }
  });

  it("says why a region-wide vendor is in a filtered list", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "South Florida");
    expect(screen.getByText(/covers? the whole area/i)).toBeTruthy();
    expect(screen.getByText(/Serves all of South Florida/i)).toBeTruthy();
  });

  it("combines metro and category rather than letting one override the other", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "South Florida");
    await pick(user, "Photography");

    const shown = names();
    expect(shown).toContain("Gables Grooms");
    expect(shown).not.toContain("Miami Mixers");
    expect(shown).not.toContain("Everywhere Entertainment");
  });

  it("returns to the full list when the metro is cleared", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pick(user, "South Florida");
    await pick(user, "Anywhere");
    expect(names()).toHaveLength(9);
  });

  it("renders no metro chips when nothing is in a mapped metro", () => {
    render(<VendorDirectoryList vendors={[v("9", "Nowhere Noise", "Hobe Sound")]} />);
    expect(screen.queryByRole("button", { name: "Anywhere" })).toBeNull();
    expect(screen.queryByRole("button", { name: "South Florida" })).toBeNull();
  });
});
