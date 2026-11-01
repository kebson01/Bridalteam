import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FeatureTips from "./feature-tips";

const tips = { title: "Guests", items: [{ title: "Paste a whole list", body: "One per line." }, { title: "Took a reply by phone?", body: "Edit it." }] };

beforeEach(() => window.localStorage.clear());

describe("FeatureTips", () => {
  it("stays closed until asked, with a dot on a page not seen before", async () => {
    render(<FeatureTips page="guests" tips={tips} />);
    const button = screen.getByRole("button", { name: /How it works/ });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Paste a whole list.")).not.toBeInTheDocument();
    expect(await screen.findByText("(new tips)")).toBeInTheDocument();
  });

  it("opens inline, remembers it was seen, and closes with Got it or Escape", async () => {
    const { unmount } = render(<FeatureTips page="guests" tips={tips} />);
    await userEvent.click(screen.getByRole("button", { name: /How it works/ }));
    expect(screen.getByText("Paste a whole list.")).toBeInTheDocument();
    // A title that already ends in "?" doesn't get a second full stop.
    expect(screen.getByText("Took a reply by phone?")).toBeInTheDocument();
    expect(screen.queryByText("(new tips)")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Got it" }));
    expect(screen.queryByText("Paste a whole list.")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /How it works/ }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Paste a whole list.")).not.toBeInTheDocument();
    unmount();

    // Seen once: no dot next time.
    render(<FeatureTips page="guests" tips={tips} />);
    await screen.findByRole("button", { name: /How it works/ });
    expect(screen.queryByText("(new tips)")).not.toBeInTheDocument();
  });

  it("works when storage is blocked", async () => {
    const orig = Object.getOwnPropertyDescriptor(window, "localStorage")!;
    Object.defineProperty(window, "localStorage", { configurable: true, get: () => { throw new Error("blocked"); } });
    try {
      render(<FeatureTips page="budget" tips={tips} />);
      await userEvent.click(screen.getByRole("button", { name: /How it works/ }));
      expect(screen.getByText("Paste a whole list.")).toBeInTheDocument();
    } finally {
      Object.defineProperty(window, "localStorage", orig);
    }
  });
});
