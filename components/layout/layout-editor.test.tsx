import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { LayoutItem } from "@/lib/venue-layout";
import type { SeatGuest } from "@/lib/seating";

const saveLayout = vi.fn();
const updateSeating = vi.fn();
vi.mock("@/app/w/[id]/layout/actions", () => ({
  saveLayout: (...args: unknown[]) => saveLayout(...args),
  updateSeating: (...args: unknown[]) => updateSeating(...args),
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

const person = (id: string, over: Partial<SeatGuest> = {}): SeatGuest => ({
  id,
  name: `Guest ${id}`,
  household: "The Smiths",
  tableName: "Table 1",
  seat: null,
  dish: null,
  dietary: null,
  ...over,
});

// Six at table 1, one gluten free, and one person still waiting for a table.
const GUESTS = [
  ...["a", "b", "c", "d", "e"].map((id) => person(id)),
  person("f", { dietary: "gluten free" }),
  person("w", { name: "Wendy Waiting", tableName: null }),
];

function setup(items: LayoutItem[] = [table()], extra: Partial<Parameters<typeof LayoutEditor>[0]> = {}) {
  return render(
    <LayoutEditor
      weddingId="w1"
      layoutId="l1"
      initialName="Reception"
      initialImageUrl={null}
      initialSource={null}
      initialWidth={60}
      initialLength={40}
      initialItems={items}
      guests={GUESTS}
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
    updateSeating.mockReset();
    updateSeating.mockResolvedValue({ ok: true });
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
    expect(stat("Seats")).toBe("8 / 20 invited");
    expect(stat("Seated")).toBe("6 of 7 confirmed");
    // Seated tally from guests at "Table 1".
    expect(screen.getByText("6/8")).toBeInTheDocument();
  });

  it("adds a numbered table off-centre from the existing one and autosaves", async () => {
    const user = userEvent.setup();
    setup([table({ x: 30, y: 20 })]);
    await user.click(screen.getByRole("button", { name: /^72″ round/ }));
    expect(stat("Tables")).toBe("2");
    expect(stat("Seats")).toBe("18 / 20 invited");
    expect(stat("Walkways")).toBe("All clear");

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
    expect(stat("Walkways")).toBe("2 to check");
    expect(screen.getByRole("button", { name: /Table 2 overlaps something/ })).toBeInTheDocument();
  });

  it("warns when chair backs leave less than a 36 inch walkway", () => {
    setup([table(), table({ id: "t2", label: "2", x: 20 })]);
    expect(stat("Walkways")).toBe("1 to check");
    expect(screen.getByRole("button", { name: /Under 36″ between Table 1 and Table 2/ })).toBeInTheDocument();
  });

  it("shows a save failure with a retry", async () => {
    saveLayout.mockResolvedValue({ ok: false, error: "You don’t have permission to edit this layout." });
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: "Service" }));
    await user.click(screen.getByRole("button", { name: /^Bar/ }));
    expect(await screen.findByText(/permission/, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("marks a layout built on a photo as approximate", () => {
    setup([table()], { initialSource: "photo" });
    expect(screen.getByText("Approximate scale")).toBeInTheDocument();
    expect(screen.getByText(/approximate scale, from a room photo/)).toBeInTheDocument();
  });

  it("doesn't mark a floor plan as approximate", () => {
    setup([table()], { initialSource: "plan" });
    expect(screen.queryByText("Approximate scale")).not.toBeInTheDocument();
    expect(screen.getByText("To scale")).toBeInTheDocument();
  });

  it("hides chairs and names with the layer switches, and prints the same view", async () => {
    const user = userEvent.setup();
    const { container } = setup();
    const chairs = () => container.querySelectorAll('svg [role="button"] circle').length;
    // One table: its top plus eight chairs.
    expect(chairs()).toBe(9);
    await user.click(screen.getByRole("checkbox", { name: "Chairs" }));
    expect(chairs()).toBe(1);

    await user.click(screen.getByRole("checkbox", { name: "Names & counts" }));
    expect(screen.queryByText("6/8")).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Print \/ PDF/ })).toHaveAttribute(
      "href",
      "/w/w1/layout/l1/print?hide=chairs,labels",
    );
    // Hiding is a way of looking at the plan, not an edit.
    await new Promise((r) => setTimeout(r, 1100));
    expect(saveLayout).not.toHaveBeenCalled();
  });

  it("lists room features in the library", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("tab", { name: "Room" }));
    for (const name of ["Pillar", "Door", "Double door", "No-go area", "Aisle"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${name} `) })).toBeInTheDocument();
    }
  });

  it("shows a selected table's chairs, with dietary tags", () => {
    setup();
    fireEvent.focus(screen.getByRole("button", { name: /60″ round 1, 8 seats/ }));
    expect(screen.getByRole("group", { name: "Table 1, 6 of 8 chairs taken" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seat 6, Guest f" })).toBeInTheDocument();
    expect(screen.getAllByText("GF").length).toBeGreaterThan(0);
    expect(screen.getByText("Seat 7 available")).toBeInTheDocument();
  });

  it("seats a waiting guest in an empty chair", async () => {
    const user = userEvent.setup();
    setup();
    fireEvent.focus(screen.getByRole("button", { name: /60″ round 1, 8 seats/ }));
    await user.click(screen.getByRole("button", { name: "Seat 8, empty" }));
    await user.click(screen.getByRole("button", { name: /Wendy Waiting/ }));
    expect(screen.getByRole("button", { name: "Seat 8, Wendy Waiting" })).toBeInTheDocument();
    const [weddingId, changes] = updateSeating.mock.calls.at(-1)!;
    expect(weddingId).toBe("w1");
    expect(changes).toContainEqual({ id: "w", table_name: "Table 1", seat_number: 8 });
    expect(stat("Seated")).toBe("7 of 7 confirmed");
  });

  it("swaps two guests with two taps, and puts them back if the save fails", async () => {
    updateSeating.mockResolvedValue({ ok: false, error: "Couldn’t save that seat." });
    const user = userEvent.setup();
    setup();
    fireEvent.focus(screen.getByRole("button", { name: /60″ round 1, 8 seats/ }));
    await user.click(screen.getByRole("button", { name: "Seat 1, Guest a" }));
    await user.click(screen.getByRole("button", { name: "Seat 2, Guest b" }));
    expect(updateSeating.mock.calls.at(-1)![1]).toEqual(
      expect.arrayContaining([
        { id: "a", table_name: "Table 1", seat_number: 2 },
        { id: "b", table_name: "Table 1", seat_number: 1 },
      ]),
    );
    expect(await screen.findByText("Couldn’t save that seat.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seat 1, Guest a" })).toBeInTheDocument();
  });

  it("takes a table's guests along when it's renamed", async () => {
    const user = userEvent.setup();
    setup();
    fireEvent.focus(screen.getByRole("button", { name: /60″ round 1, 8 seats/ }));
    const field = screen.getByRole("textbox", { name: "Table name" });
    await user.clear(field);
    await user.type(field, "Oak{Enter}");
    const changes = updateSeating.mock.calls.at(-1)![1];
    expect(changes).toHaveLength(6);
    expect(changes[0]).toMatchObject({ table_name: "Oak" });
  });

  it("opens the seating chart with the guests still waiting", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole("button", { name: /Seating/ }));
    expect(screen.getByText("Waiting for a table")).toBeInTheDocument();
    expect(screen.getByText("Wendy Waiting")).toBeInTheDocument();
  });
});
