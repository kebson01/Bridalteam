import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const apply = vi.fn();
vi.mock("@/app/planner/actions", () => ({
  applyProposal: (...args: unknown[]) => apply(...args),
}));

import ProposalCard from "./proposal-card";

const tasks = {
  kind: "tasks" as const,
  items: [
    { title: "Book the photographer", due_date: "2026-12-01" },
    { title: "Pick a florist", due_date: null },
  ],
};

beforeEach(() => apply.mockReset());

describe("ProposalCard", () => {
  it("adds only the ticked items, then links to where they went", async () => {
    apply.mockResolvedValue({ ok: true, added: 1, href: "/w/w1/checklist" });
    const user = userEvent.setup();
    render(<ProposalCard proposal={tasks} weddingId="w1" />);

    await user.click(screen.getByRole("checkbox", { name: /pick a florist/i }));
    await user.click(screen.getByRole("button", { name: "Add 1 task to my checklist" }));

    expect(apply).toHaveBeenCalledWith("w1", "tasks", [tasks.items[0]]);
    expect(await screen.findByText(/added 1 task to your checklist/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view checklist/i })).toHaveAttribute("href", "/w/w1/checklist");
  });

  it("shows the reason when saving is refused, and keeps the card", async () => {
    apply.mockResolvedValue({ ok: false, error: "You don't have permission to edit this wedding." });
    const user = userEvent.setup();
    render(<ProposalCard proposal={tasks} weddingId="w1" />);

    await user.click(screen.getByRole("button", { name: "Add 2 tasks to my checklist" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("permission");
    expect(screen.getByRole("button", { name: "Add 2 tasks to my checklist" })).toBeInTheDocument();
  });
});
