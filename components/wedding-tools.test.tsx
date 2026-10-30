import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const save = vi.fn();
vi.mock("@/app/w/[id]/tools/actions", () => ({
  saveEnabledTools: (...args: unknown[]) => save(...args),
}));

import WeddingTools from "./wedding-tools";

beforeEach(() => save.mockReset());

describe("WeddingTools", () => {
  it("shows only the pinned tools", () => {
    render(<WeddingTools weddingId="w1" initialEnabled={["checklist", "budget"]} stats={{}} />);
    expect(screen.getByRole("heading", { name: "Budget & Expenses" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Travel & Stays" })).not.toBeInTheDocument();
  });

  it("adds a tool from the marketplace and saves it", async () => {
    save.mockResolvedValue({ ok: true, tools: ["checklist", "travel"] });
    render(<WeddingTools weddingId="w1" initialEnabled={["checklist"]} stats={{}} />);

    await userEvent.click(screen.getByRole("button", { name: "+ Browse tool marketplace" }));
    await userEvent.click(screen.getByRole("button", { name: "+ Add Travel" }));

    expect(save).toHaveBeenCalledWith("w1", ["checklist", "travel"]);
    expect(await screen.findByRole("heading", { name: "Travel & Stays" })).toBeInTheDocument();
  });

  it("rolls back and explains when the save is refused", async () => {
    save.mockResolvedValue({ ok: false, error: "Only editors can change this dashboard." });
    render(<WeddingTools weddingId="w1" initialEnabled={["checklist", "budget"]} stats={{}} />);

    await userEvent.click(screen.getByRole("button", { name: "Remove Budget & Expenses from your dashboard" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Only editors");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Budget & Expenses" })).toBeInTheDocument(),
    );
  });

  it("leads an empty tool with its first step, and a used one with Open", () => {
    render(
      <WeddingTools
        weddingId="w1"
        initialEnabled={["checklist", "guests"]}
        stats={{ checklist: { line: "3 of 10 tasks done" }, guests: { line: "No guests yet", empty: true } }}
      />,
    );
    expect(screen.getByRole("link", { name: "Add your first guests →" })).toHaveAttribute("href", "/w/w1/guests");
    expect(screen.getByRole("link", { name: "Open Checklist" })).toHaveAttribute("href", "/w/w1/checklist");
  });
});
