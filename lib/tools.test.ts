import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { TOOLS, type ToolKey } from "./tools";
import { GUIDES } from "./guides";

describe("tool pages", () => {
  it("each points at a real page", () => {
    for (const t of Object.values(TOOLS)) {
      expect(existsSync(join(process.cwd(), "app", t.href, "page.tsx")), t.href).toBe(true);
    }
  });

  it("each is linked from at least one guide", () => {
    const linked = new Set(GUIDES.flatMap((g) => g.tools ?? []));
    for (const key of Object.keys(TOOLS) as ToolKey[]) {
      expect(linked.has(key), key).toBe(true);
    }
  });

  it("no guide lists the same tool twice", () => {
    for (const g of GUIDES) {
      const tools = g.tools ?? [];
      expect(new Set(tools).size, g.slug).toBe(tools.length);
    }
  });
});
