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
vi.mock("@/app/wedding/actions", () => ({ setWeddingWebsite: vi.fn() }));

import SiteBuilder, { type SiteBuilderProps } from "./site-builder";
import { publishCustomSite } from "@/app/w/[id]/builder/site-actions";
import { setWeddingWebsite } from "@/app/wedding/actions";

const props = (over: Partial<SiteBuilderProps> = {}): SiteBuilderProps => ({
  weddingId: "w1",
  siteUrl: "https://bridalteam.com",
  mcpOn: true,
  aiOn: true,
  websitePublished: true,
  welcome: "",
  slug: "ana-and-ben",
  registryCount: 3,
  eventDate: "2027-06-06",
  createdAt: "2026-10-01T00:00:00Z",
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
    expect(screen.getByRole("link", { name: "Manage →" })).toHaveAttribute("href", "/w/w1/website?section=settings#registry");
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

  it("publishes and switches the website on in one step when it's off", async () => {
    vi.mocked(publishCustomSite).mockResolvedValue({ ok: true });
    vi.mocked(setWeddingWebsite).mockResolvedValue({ ok: true, slug: "ana-and-ben", published: true });
    render(
      <SiteBuilder
        {...props({ websitePublished: false, slug: null, welcome: "Hi all", initialDraft: "<p>x</p>", initialDraftAt: "2026-10-31T00:00:00Z" })}
      />,
    );
    expect(screen.getByText(/Your website isn.t live yet/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Publish & go live" }));
    expect(setWeddingWebsite).toHaveBeenCalledWith({ weddingId: "w1", published: true, welcome: "Hi all" });
    expect(await screen.findByText(/Your website is live at bridalteam.com\/wedding\/ana-and-ben/)).toBeInTheDocument();
    expect(screen.queryByText(/Your website isn.t live yet/)).not.toBeInTheDocument();
  });

  it("doesn't touch the website switch when it's already on", async () => {
    vi.mocked(publishCustomSite).mockResolvedValue({ ok: true });
    vi.mocked(setWeddingWebsite).mockClear();
    render(<SiteBuilder {...props({ initialDraft: "<p>x</p>", initialDraftAt: "2026-10-31T00:00:00Z" })} />);
    await userEvent.click(screen.getByRole("button", { name: "Publish to guests" }));
    expect(await screen.findByText("Published — guests now see your custom site.")).toBeInTheDocument();
    expect(setWeddingWebsite).not.toHaveBeenCalled();
  });

  it("leads 'Your own AI' with sign-in and keeps keys as an option", async () => {
    render(<SiteBuilder {...props()} />);
    await userEvent.click(screen.getByRole("tab", { name: /Your own AI/ }));
    expect(screen.getByText("Connect ChatGPT or Claude by signing in")).toBeInTheDocument();
    expect(screen.getByText("https://bridalteam.com/api/mcp/site")).toBeInTheDocument();
    expect(screen.getByText("Or connect with a key (website only)")).toBeInTheDocument();
  });

  it("shows a takedown and won't publish while the site is taken down", () => {
    render(
      <SiteBuilder
        {...props({
          blockedReason: "Sexual or explicit content",
          initialDraft: "<h1>x</h1>",
          initialDraftSource: "paste",
          initialDraftAt: "2026-10-31T15:00:00Z",
        })}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("taken your guest website down");
    expect(screen.getByRole("alert")).toHaveTextContent("Sexual or explicit content");
    expect(screen.getByRole("button", { name: "Publish to guests" })).toBeDisabled();
  });
});
