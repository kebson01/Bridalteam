import { describe, expect, it } from "vitest";
import { DEFAULT_TOOLS, WEDDING_TOOLS, enabledTools, sanitizeTools } from "./wedding-tools";

describe("sanitizeTools", () => {
  it("drops unknown keys and duplicates, keeping catalogue order", () => {
    expect(sanitizeTools(["guests", "nope", "budget", "guests"])).toEqual([
      "checklist",
      "budget",
      "guests",
    ]);
  });

  it("always keeps core tools, even when asked to remove them", () => {
    expect(sanitizeTools([])).toEqual(["checklist"]);
  });
});

describe("enabledTools", () => {
  it("falls back to the defaults when the wedding never customised", () => {
    expect(enabledTools(null).map((t) => t.key)).toEqual(sanitizeTools(DEFAULT_TOOLS));
  });

  it("respects a saved choice", () => {
    expect(enabledTools(["layout", "travel"]).map((t) => t.key)).toEqual([
      "checklist",
      "layout",
      "travel",
    ]);
  });

  it("can switch everything on", () => {
    expect(enabledTools(WEDDING_TOOLS.map((t) => t.key))).toHaveLength(WEDDING_TOOLS.length);
  });
});
