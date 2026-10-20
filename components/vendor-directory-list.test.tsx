import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import VendorDirectoryList, { type DirectoryVendor } from "./vendor-directory-list";
import type { MetroId } from "@/lib/areas";

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

/**
 * The metro filter is a select, so it is driven by value rather than by
 * clicking a chip. Passing the MetroId rather than the visible label also keeps
 * these tests off the option text, which carries a listing count.
 */
const pickMetro = async (
  user: ReturnType<typeof userEvent.setup>,
  id: MetroId | "",
) => user.selectOptions(screen.getByRole("combobox", { name: "Metro" }), id);

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
    await pickMetro(user, "orlando");

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
    await pickMetro(user, "south-florida");

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

    await pickMetro(user, "south-florida");
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
    await pickMetro(user, "orlando");
    expect(screen.queryByRole("button", { name: "All areas" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Broward" })).toBeNull();
  });

  it("drops the area when the metro changes", async () => {
    // Otherwise a Broward filter survives into Orlando and returns nothing.
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pickMetro(user, "south-florida");
    await pick(user, "Broward");
    expect(names()).not.toContain("Orlando Oscillators");

    await pickMetro(user, "orlando");
    const shown = names();
    expect(shown).toContain("Orlando Oscillators");
    expect(shown.length).toBeGreaterThan(0);
  });

  it("excludes a vendor outside every metro from all of them", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    for (const m of ["south-florida", "orlando"] as const) {
      await pickMetro(user, m);
      expect(names()).not.toContain("Hobe Sound Harpists");
    }
  });

  it("says why a region-wide vendor is in a filtered list", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pickMetro(user, "south-florida");
    expect(screen.getByText(/covers? the whole area/i)).toBeTruthy();
    expect(screen.getByText(/Serves all of South Florida/i)).toBeTruthy();
  });

  it("combines metro and category rather than letting one override the other", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pickMetro(user, "south-florida");
    await pick(user, "Photography");

    const shown = names();
    expect(shown).toContain("Gables Grooms");
    expect(shown).not.toContain("Miami Mixers");
    expect(shown).not.toContain("Everywhere Entertainment");
  });

  it("returns to the full list when the metro is cleared", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pickMetro(user, "south-florida");
    await pickMetro(user, "");
    expect(names()).toHaveLength(9);
  });

  it("renders no metro chips when nothing is in a mapped metro", () => {
    render(<VendorDirectoryList vendors={[v("9", "Nowhere Noise", "Hobe Sound")]} />);
    expect(screen.queryByRole("button", { name: "Anywhere" })).toBeNull();
    expect(screen.queryByRole("button", { name: "South Florida" })).toBeNull();
  });
});

/**
 * The metro filter is a select rather than a row of chips, and each option
 * carries the number of listings that choosing it would show.
 */
describe("metro dropdown", () => {
  const optionNames = () =>
    screen.getAllByRole("option").map((o) => o.textContent?.trim());

  it("offers one option per metro that has listings, plus Anywhere", () => {
    render(<VendorDirectoryList vendors={VENDORS} />);
    expect(screen.getByRole("combobox", { name: "Metro" })).toBeInTheDocument();
    // Tampa Bay has no listing in this fixture, so it must not be offered.
    expect(optionNames()).toEqual(["Anywhere (9)", "South Florida (6)", "Orlando (3)"]);
  });

  it("never shows a count that disagrees with the list it counts", async () => {
    // The whole hazard of putting a number beside a filter. Selecting each
    // metro must produce exactly as many cards as its option advertised.
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    const advertised = Object.fromEntries(
      screen.getAllByRole("option").map((o) => {
        const [, label, n] = o.textContent!.match(/^(.*) \((\d+)\)$/)!;
        return [label, Number(n)];
      }),
    );
    for (const [id, label] of [
      ["south-florida", "South Florida"],
      ["orlando", "Orlando"],
      ["", "Anywhere"],
    ] as const) {
      await pickMetro(user, id);
      expect(names(), `${label} advertised ${advertised[label]}`).toHaveLength(
        advertised[label],
      );
    }
  });

  it("counts only within the chosen type, and keeps an emptied metro listed", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    // One of the nine is a Photography listing, in Coral Gables.
    await pick(user, "Photography");
    // Orlando stays, at zero. Dropping options as the type changes would make
    // the menu jump around, and "Orlando (0)" tells a couple something that
    // silently removing it does not.
    expect(optionNames()).toEqual(["Anywhere (1)", "South Florida (1)", "Orlando (0)"]);
  });

  it("counts the statewide listing under every metro", async () => {
    // "Statewide Sounds" has city "Florida", so it genuinely belongs to both.
    // Asserted by name: in this fixture the per-metro counts happen to sum to
    // the Anywhere count, because Hobe Sound (in no metro) offsets it.
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    for (const id of ["south-florida", "orlando"] as const) {
      await pickMetro(user, id);
      expect(names(), id).toContain("Statewide Sounds");
    }
  });

  it("clears back to the full list via Anywhere", async () => {
    const user = userEvent.setup();
    render(<VendorDirectoryList vendors={VENDORS} />);
    await pickMetro(user, "orlando");
    expect(names()).toHaveLength(3);
    await pickMetro(user, "");
    expect(names()).toHaveLength(9);
  });
});
