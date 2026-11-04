import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHECKLIST_PDF_PATH, checklistFingerprint } from "./checklist";

const pub = (p: string) => join(process.cwd(), "public", p);

describe("printable checklist PDF", () => {
  it("exists where the pages link to it", () => {
    expect(existsSync(pub(CHECKLIST_PDF_PATH))).toBe(true);
    expect(readFileSync(pub(CHECKLIST_PDF_PATH)).subarray(0, 5).toString()).toBe("%PDF-");
  });

  it("matches the current checklist (re-run scripts/checklist-pdf.mjs after editing lib/plan-template.ts)", () => {
    const meta = JSON.parse(readFileSync(pub(CHECKLIST_PDF_PATH.replace(/\.pdf$/, ".json")), "utf8"));
    expect(meta.fingerprint).toBe(checklistFingerprint());
  });
});
