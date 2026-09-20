import { describe, it, expect, beforeEach } from "vitest";
import { saveDraft, readDraft, clearDraft } from "./planner-draft";

/**
 * This restores text straight into a component that renders it, from a store
 * the visitor's own extensions can write to. So the tests that matter are the
 * ones about what readDraft() refuses to hand back — the round trip is the
 * easy half.
 */
beforeEach(() => sessionStorage.clear());

describe("planner draft", () => {
  it("survives a round trip", () => {
    saveDraft([
      { role: "user", content: "What should I book first?" },
      { role: "assistant", content: "Venue, then photographer." },
    ]);
    expect(readDraft()).toEqual([
      { role: "user", content: "What should I book first?" },
      { role: "assistant", content: "Venue, then photographer." },
    ]);
  });

  it("returns null when there is nothing stored", () => {
    expect(readDraft()).toBeNull();
  });

  it("returns null rather than throwing on junk", () => {
    sessionStorage.setItem("bt_planner_draft", "{not json at all");
    expect(readDraft()).toBeNull();
  });

  it("returns null when the stored value isn't an array", () => {
    sessionStorage.setItem("bt_planner_draft", JSON.stringify({ role: "user" }));
    expect(readDraft()).toBeNull();
  });

  it("drops entries that aren't a real message", () => {
    // Anything same-origin can write here. A malformed entry must be dropped
    // at the boundary rather than reaching a component that renders it.
    sessionStorage.setItem(
      "bt_planner_draft",
      JSON.stringify([
        { role: "user", content: "keep me" },
        { role: "system", content: "wrong role" },
        { role: "assistant", content: 42 },
        null,
        "a bare string",
        { content: "no role" },
      ]),
    );
    expect(readDraft()).toEqual([{ role: "user", content: "keep me" }]);
  });

  it("returns null when every entry is dropped", () => {
    sessionStorage.setItem("bt_planner_draft", JSON.stringify([null, 1, "x"]));
    expect(readDraft()).toBeNull();
  });

  it("keeps only the most recent messages", () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      role: "user" as const,
      content: `m${i}`,
    }));
    saveDraft(many);
    const back = readDraft();
    expect(back).toHaveLength(40);
    // The tail, not the head — the recent turns are the ones worth restoring.
    expect(back?.[back.length - 1].content).toBe("m59");
  });

  it("refuses to store a transcript past the size cap", () => {
    // sessionStorage throws on the write when the quota is gone, and that
    // throw would land inside a render. Declining is the quieter failure.
    saveDraft([{ role: "user", content: "x".repeat(70_000) }]);
    expect(readDraft()).toBeNull();
  });

  it("clears", () => {
    saveDraft([{ role: "user", content: "hi" }]);
    clearDraft();
    expect(readDraft()).toBeNull();
  });
});
