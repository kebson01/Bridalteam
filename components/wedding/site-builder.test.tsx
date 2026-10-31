import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/w/[id]/builder/site-actions", () => ({
  applySiteTheme: vi.fn(),
  createSiteKey: vi.fn(),
  designSiteWithAI: vi.fn(),
  publishCustomSite: vi.fn(),
  restoreSiteVersion: vi.fn(),
  revokeSiteKey: vi.fn(),
  saveCustomSite: vi.fn(),
  setSiteMode: vi.fn(),
  listSiteVersions: vi.fn(async () => []),
}));

import SiteBuilder, { type SiteBuilderProps } from "./site-builder";

const props = (over: Partial<SiteBuilderProps> = {}): SiteBuilderProps => ({
  weddingId: "w1",
  siteUrl: "https://bridalteam.com",
  mcpOn: true,
  aiOn: true,
  websitePublished: true,
  slug: "ana-and-ben",
  registryCount: 3,
  initialMode: "standard",
  initialDraft: null,
  initialDraftSource: null,
  initialDraftAt: null,
  initialLiveAt: null,
  initialVersions: [],
  initialKeys: [],
  ...over,
});

describe("SiteBuilder", () => {
  it("starts on themes with an empty preview and nothing to publish", () => {
    render(<SiteBuilder {...props()} />);
    expect(screen.getByRole("tab", { name: /Themes/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Your draft shows up here")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish to guests" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Custom site" })).toBeDisabled();
    expect(screen.getByText("Registry · 3 links")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Manage →" })).toHaveAttribute("href", "/w/w1/website#registry");
  });

  it("previews a draft and switches to a phone-sized frame", async () => {
    render(
      <SiteBuilder
        {...props({ initialDraft: "<h1 data-bt=\"names\"></h1>", initialDraftSource: "paste", initialDraftAt: "2026-10-31T15:00:00Z" })}
      />,
    );
    const frame = screen.getByTitle("Draft preview of your wedding website");
    expect(frame.className).toContain("w-full");
    await userEvent.click(screen.getByRole("button", { name: "Phone" }));
    expect(screen.getByTitle("Draft preview of your wedding website").className).toContain("w-[390px]");
    expect(screen.getByRole("button", { name: "Publish to guests" })).toBeEnabled();
  });

  it("adds a suggestion to the AI brief", async () => {
    render(<SiteBuilder {...props()} />);
    await userEvent.click(screen.getByRole("tab", { name: /Bridal Team AI/ }));
    const brief = screen.getByLabelText("Describe the site you want");
    await userEvent.type(brief, "Sage and cream");
    await userEvent.click(screen.getByRole("button", { name: "Add an FAQ section" }));
    expect(brief).toHaveValue("Sage and cream. Add an FAQ section.");
  });
});
