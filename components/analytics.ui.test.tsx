import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

/**
 * The privacy page now states that no analytics script loads until someone
 * accepts. That sentence is a commitment, and this file is what keeps it true
 * as the code moves.
 *
 * A browser run verified the whole flow once (banner -> decline -> no request
 * -> accept -> request). These are the parts worth re-checking on every push,
 * and they assert on the injected <script> rather than on network traffic,
 * which jsdom does not have.
 *
 * GA_MEASUREMENT_ID is read at module load, so every case re-imports.
 */
const GTM = "googletagmanager.com";

function gaScripts() {
  return [...document.querySelectorAll("script")].filter((s) => s.src.includes(GTM));
}

async function mount(gaId: string, { consent }: { consent?: "granted" | "denied" } = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", gaId);
  window.localStorage.clear();
  if (consent) window.localStorage.setItem("bt_consent", consent);
  const Analytics = (await import("./analytics")).default;
  const ConsentBanner = (await import("./consent-banner")).default;
  return render(
    <>
      <Analytics />
      <ConsentBanner />
    </>,
  );
}

describe("analytics consent gate", () => {
  beforeEach(() => {
    document.head.querySelectorAll("script").forEach((s) => s.remove());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("loads nothing and shows the banner before a choice is made", async () => {
    await mount("G-TESTID1234");
    expect(await screen.findByRole("dialog", { name: /cookie choices/i })).toBeTruthy();
    expect(gaScripts()).toHaveLength(0);
  });

  it("still loads nothing after the visitor declines", async () => {
    await mount("G-TESTID1234");
    await userEvent.click(await screen.findByRole("button", { name: "Decline" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /cookie choices/i })).toBeNull(),
    );
    expect(gaScripts()).toHaveLength(0);
  });

  it("loads the tag once the visitor accepts", async () => {
    await mount("G-TESTID1234");
    await userEvent.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(gaScripts()).toHaveLength(1));
    expect(gaScripts()[0].src).toContain("G-TESTID1234");
  });

  it("honours a stored acceptance without asking again", async () => {
    await mount("G-TESTID1234", { consent: "granted" });
    await waitFor(() => expect(gaScripts()).toHaveLength(1));
    expect(screen.queryByRole("dialog", { name: /cookie choices/i })).toBeNull();
  });

  it("injects the tag only once across a change of mind", async () => {
    // Accept -> "Change my choice" -> accept again happens in one page view,
    // and loading gtag twice double-counts every event from then on. This is
    // the guard in loadGa(); without this case nothing covered it.
    await mount("G-TESTID1234");
    await userEvent.click(await screen.findByRole("button", { name: "Accept" }));
    await waitFor(() => expect(gaScripts()).toHaveLength(1));

    const { resetConsent } = await import("@/lib/analytics");
    resetConsent();
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: /cookie choices/i })).not.toBeNull(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Accept" }));

    await waitFor(() => expect(gaScripts()).toHaveLength(1));
  });

  it("shows no banner at all when no measurement id is configured", async () => {
    // Prompting for consent to cookies we don't set teaches people to click
    // through prompts, and would make the privacy page wrong in the other
    // direction.
    await mount("");
    await waitFor(() => expect(gaScripts()).toHaveLength(0));
    expect(screen.queryByRole("dialog", { name: /cookie choices/i })).toBeNull();
  });
});
