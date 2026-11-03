import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GuidesLibrary, { type GuideCard } from "./guides-library";
import { GUIDES } from "@/lib/guides";
import { groupGuides } from "@/lib/guide-sections";

const card = (g: (typeof GUIDES)[number]): GuideCard => ({
  slug: g.slug,
  title: g.title,
  category: g.category,
  readMinutes: g.readMinutes,
  excerpt: g.excerpt,
});
const s = groupGuides(GUIDES);
const groups = {
  flagship: s.flagship ? card(s.flagship) : null,
  foundation: s.foundation.map(card),
  hiring: s.hiring.map(card),
  logistics: s.logistics.map(card),
};
const all = GUIDES.map(card);

const guideLinks = () =>
  screen.getAllByRole("link").filter((a) => a.getAttribute("href")?.startsWith("/guides/"));

describe("GuidesLibrary", () => {
  beforeEach(() => window.localStorage.clear());

  it("links every guide exactly once in the curated view", () => {
    render(<GuidesLibrary guides={all} groups={groups} />);
    const hrefs = guideLinks().map((a) => a.getAttribute("href"));
    expect(hrefs.sort()).toEqual(GUIDES.map((g) => `/guides/${g.slug}`).sort());
  });

  it("switches to a filtered list when searching", async () => {
    const user = userEvent.setup();
    render(<GuidesLibrary guides={all} groups={groups} />);
    await user.type(screen.getByRole("searchbox", { name: "Search guides" }), "florist");
    const hrefs = guideLinks().map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/guides/how-to-choose-a-wedding-florist");
    expect(hrefs).not.toContain("/guides/wedding-registry-guide");
  });

  it("filters by category, with counts that match", async () => {
    const user = userEvent.setup();
    render(<GuidesLibrary guides={all} groups={groups} />);
    const stationery = GUIDES.filter((g) => g.category === "Stationery").length;
    const chip = screen.getByRole("button", { name: "Stationery" });
    expect(chip.textContent).toContain(`(${stationery})`);
    await user.click(chip);
    expect(guideLinks()).toHaveLength(stationery);
  });

  it("keeps a reading list in this browser", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<GuidesLibrary guides={all} groups={groups} />);
    const florist = GUIDES.find((g) => g.slug === "how-to-choose-a-wedding-florist")!;
    await user.click(screen.getByRole("button", { name: `Save "${florist.title}" to your reading list` }));
    const pill = screen.getByRole("button", { name: /Reading list \(1 saved\)/ });

    await user.click(pill);
    expect(guideLinks().map((a) => a.getAttribute("href"))).toEqual([`/guides/${florist.slug}`]);

    unmount();
    render(<GuidesLibrary guides={all} groups={groups} />);
    expect(await screen.findByRole("button", { name: /Reading list \(1 saved\)/ })).toBeInTheDocument();
  });

  it("puts no button inside a link", () => {
    render(<GuidesLibrary guides={all} groups={groups} />);
    for (const a of screen.getAllByRole("link")) {
      expect(within(a).queryAllByRole("button")).toHaveLength(0);
    }
  });
});
