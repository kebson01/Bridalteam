// Makes public/downloads/bridal-team-wedding-checklist.pdf from the printable
// checklist page, and records the checklist's fingerprint next to it so
// lib/checklist-pdf.test.ts can tell when the PDF is out of date.
//
//   npm run build && npx next start -p 3000      (in one terminal)
//   node scripts/checklist-pdf.mjs http://localhost:3000
//
// Uses Playwright's Chromium. Re-run it whenever lib/plan-template.ts changes.

import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";

// Playwright isn't a project dependency; require() also finds a global
// install (NODE_PATH), which a bare ESM import would not.
const { chromium } = createRequire(import.meta.url)("playwright");

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const out = new URL("../public/downloads/bridal-team-wedding-checklist.pdf", import.meta.url);
const meta = new URL("../public/downloads/bridal-team-wedding-checklist.json", import.meta.url);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`${base}/wedding-checklist/printable`, { waitUntil: "networkidle" });
// The page prints its own fingerprint in a data attribute; fail loudly if missing.
const fingerprint = await page.getAttribute("[data-checklist-fingerprint]", "data-checklist-fingerprint");
if (!fingerprint) throw new Error("No data-checklist-fingerprint on the printable page");
await page.emulateMedia({ media: "print" });
const pdf = await page.pdf({
  format: "Letter",
  margin: { top: "0.6in", bottom: "0.6in", left: "0.7in", right: "0.7in" },
  printBackground: true,
});
await browser.close();
await writeFile(out, pdf);
await writeFile(meta, JSON.stringify({ fingerprint, generated: new Date().toISOString().slice(0, 10) }, null, 2) + "\n");
console.log(`Wrote ${out.pathname} (${pdf.length} bytes), fingerprint ${fingerprint}`);
