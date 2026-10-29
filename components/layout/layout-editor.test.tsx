import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LayoutItem } from "@/lib/venue-layout";

const saveLayout = vi.fn();
vi.mock("@/app/w/[id]/layout/actions", () => ({
  saveLayout: (...args: unknown[]) => saveLayout(...args),
  deleteLayout: vi.fn(),
}));
vi.mock("@/lib/supabase/browser", () => ({ supabaseBrowser: vi.fn() }));

import LayoutEditor from "./layout-editor";

const table = (over: Partial<LayoutItem> = {}): LayoutItem => ({
  id: "t1",
  kind: "round60",
  x: 10,
  y: 10,
  w: 5,
  h: 5,
  rotation: 0,
  seats: 8,
  label: "1",
  ...over,
});

function setup(items: LayoutItem[] = [table()], extra: Partial<Parameters<typeof LayoutEditor>[0]> = {}) {
  return render(
    <LayoutEditor
      weddingId="w1"
      layoutId="l1"
      initialName="Reception"
      initialImageUrl={null}
      initialWidth={60}
      initialLength={40}
      initialItems={items}
      seatedByTable={{ "1": 6 }}
      invitedSeats={20}
      {...extra}
    />,
  );
}

const stat = (label: string) => screen.getByText(label, { selector: "dt" }).nextElementSibling?.textContent;

describe("LayoutEditor", () => {
  beforeEach(() => {
    saveLayout.mockReset();
    saveLayout.mockResolvedValue({ ok: true });
    // jsdom has no crypto.randomUUID on every version.
    if (!globalThis.crypto.randomUUID) {
      Object.defineProperty(globalThis.crypto, "randomUUID", { value: () => Math.random().toString(36).slice(2) });
    }
  });

  it("opens a brand-new layout on the room step", () => {
    setup([]);
    expect(screen.getByText(/what’s the room/i)).toBeInTheDocument();
  });

  it("counts seats against the guest list and says how many are short", () => {
    setup();
    expect(stat("Seats")).toBe("8");
    expect(stat("Invited")).toMatch(/12 seats short/);
    // Seated tally from guests at "Table 1".
    expect(screen.getByText("6/8")).toBeInTheDocument();
  });

  it("adds a numbered table off-centre from the existing one and autosaves", async () => {
    const user = userEvent.setup();
    setup([table({ x: 30, y: 20 })]);
    await user.click(screen.getByRole("button", { name: /72″ round/ }));
    expect(stat("Tables")).toBe("2");
    expect(stat("Seats")).toBe("18");
    expect(screen.queryByText(/overlap/)).not.toBeInTheDocument();

    await waitFor(() => expect(saveLayout).toHaveBeenCalled(), { timeout: 2000 });
    const [, , payload] = saveLayout.mock.calls.at(-1)!;
    expect(payload.items).toHaveLength(2);
    expect(payload.items[1]).toMatchObject({ kind: "round72", label: "2", seats: 10 });
  });

  it("doesn't save when nothing changed", async () => {
    setup();
    await new Promise((r) => setTimeout(r, 1100));
    expect(saveLayout).not.toHaveBeenCalled();
  });

  it("deletes the selected piece from the keyboard and undoes it", async () => {
    const user = userEvent.setup();
    setup();
    const piece = screen.getByRole("button", { name: /60″ round 1, 8 seats/ });
    fireEvent.focus(piece);
    fireEvent.keyDown(piece, { key: "Delete" });
    expect(stat("Tables")).toBe("0");
    await user.click(screen.getByRole("button", { name: "Undo" }));
    expect(stat("Tables")).toBe("1");
  });

  it("warns about tables on top of each other", () => {
    setup([table(), table({ id: "t2", label: "2", x: 12 })]);
    expect(screen.getByText(/2 pieces overlap/)).toBeInTheDocument();
  });

  it("shows a save failure with a retry", async () => {
    saveLayout.mockResolvedValue({ ok: false, error: "You don’t have permission to edit this layout." });
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /Bar/ }));
    expect(await screen.findByText(/permission/, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
