#!/usr/bin/env node
/**
 * Renders Bridal Team social graphics (Pinterest pins and Facebook stories)
 * to PNG, in the site's own fonts and colors, and checks each one.
 *
 *   npm run build            # once, so the site's font files exist in .next/
 *   node plugins/bridalteam/skills/social-graphics/scripts/render.js \
 *        <spec.js> <out-dir> [contact-sheet.png]
 *
 * Run it from the repository root. <spec.js> exports a function that takes the
 * helpers below and returns { format: "pin" | "story", items: { name: html } }.
 * Each item becomes <out-dir>/<name>.png. See example-batch.js.
 *
 * Per image it checks that the site fonts loaded (Jost must; Raleway is only
 * loaded when some text uses it) and that no content overlaps the footer
 * (pins) or leaves the safe area Facebook keeps clear of its own buttons
 * (stories). A failed check exits non-zero. The optional contact sheet puts
 * every image side by side for one visual review; write it outside the repo.
 *
 * Photos: pass a local file path (relative to the repo root or absolute) to
 * photoFull / photoTop. Download remote photos first (see
 * references/photos.md); the renderer never fetches from the network.
 */
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const ROOT = process.cwd();
const fileUrl = (p) => `file://${path.isAbsolute(p) ? p : path.join(ROOT, p)}`;
const LOGO = `file://${ROOT}/public/brand/logo.svg`;

const FORMATS = {
  // Pinterest's preferred 2:3. The dark footer starts at 1350px.
  pin: { width: 1000, height: 1500, limit: 1350 },
  // Facebook covers the top ~270px (progress bar, Page name) and the bottom
  // ~460px (reply box) of a story, so text stays between those lines.
  story: { width: 1080, height: 1920, limit: 1920 - 460 },
};

/** @font-face rules for Jost and Raleway from the last `next build`. */
function siteFonts() {
  const dir = path.join(ROOT, ".next/static/chunks");
  if (!fs.existsSync(dir)) throw new Error("No .next build found. Run `npm run build` first.");
  const rules = new Set();
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".css"))) {
    const css = fs.readFileSync(path.join(dir, f), "utf8");
    for (const m of css.matchAll(/@font-face\{font-family:(?:Jost|Raleway)[^}]*\}/g)) {
      rules.add(m[0].replace(/url\(\.\.\/media\//g, `url(file://${ROOT}/.next/static/media/`));
    }
  }
  if (rules.size === 0) throw new Error("Couldn't find the Jost/Raleway @font-face rules in .next/static/chunks.");
  return [...rules].join("\n");
}

const BASE = `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Raleway,sans-serif;color:#222;background:#fff;position:relative;overflow:hidden}
.d{font-family:Jost,sans-serif}
.note{font-size:28px;color:#777}
/* pin */
.band{background:linear-gradient(135deg,#ff8c1c,#f36705);color:#fff;padding:80px 80px 64px}
.band .k{font-family:Jost,sans-serif;font-weight:600;letter-spacing:6px;font-size:30px;opacity:.92;text-transform:uppercase}
.band h1{font-family:Jost,sans-serif;font-size:88px;line-height:1.02;font-weight:700;margin-top:20px}
.foot{position:absolute;left:0;right:0;bottom:0;height:150px;background:#222;color:#fff;display:flex;align-items:center;justify-content:space-between;padding:0 80px}
.foot .cta{font-family:Jost,sans-serif;font-size:36px;font-weight:600}
.foot .cta b{color:#ff8c1c}
.foot img{height:56px;filter:brightness(0) invert(1)}
.wrap{padding:56px 80px}
/* photo layouts; .bg marks decorative layers the overflow check ignores */
.bg{position:absolute;inset:0;background-size:cover}
.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 30%,rgba(20,14,10,.55) 58%,rgba(20,14,10,.88) 100%)}
.over{position:absolute;left:80px;right:80px;bottom:200px;color:#fff}
.over .k{font-family:Jost,sans-serif;font-weight:600;letter-spacing:6px;font-size:30px;text-transform:uppercase;color:#ffb066}
.over h1{font-family:Jost,sans-serif;font-size:96px;line-height:1.02;font-weight:700;margin-top:18px;text-shadow:0 2px 24px rgba(0,0,0,.35)}
.over p{font-size:36px;line-height:1.4;margin-top:22px;color:rgba(255,255,255,.92)}
/* story */
.safe{position:absolute;left:90px;right:90px;top:270px;bottom:460px;display:flex;flex-direction:column}
.safe .k{font-family:Jost,sans-serif;font-weight:600;letter-spacing:6px;font-size:32px;text-transform:uppercase;color:#c35004}
.safe h1{font-family:Jost,sans-serif;font-weight:700;font-size:92px;line-height:1.02;margin-top:20px}
.step{position:absolute;right:90px;top:270px;font-family:Jost,sans-serif;font-size:30px;color:#9c9c9d}
.slogo{position:absolute;left:90px;bottom:380px;height:54px}
.tap{margin-top:60px;font-family:Jost,sans-serif;font-size:40px;font-weight:600;color:#c35004}
.orange{background:linear-gradient(160deg,#ff8c1c,#f36705);color:#fff}
.orange .k,.orange .tap{color:#fff}
.orange .slogo{filter:brightness(0) invert(1)}
.orange .step{color:#fff;opacity:.85}
`;

/** Building blocks shared by every batch, so pins stay one family. */
const helpers = {
  // --- pins ---
  band: (kicker, title, size) =>
    `<div class="band"><div class="k">${kicker}</div><h1${size ? ` style="font-size:${size}px"` : ""}>${title}</h1></div>`,
  wrap: (inner, top = 40) => `<div class="wrap" style="padding-top:${top}px">${inner}</div>`,
  foot: (cta) => `<div class="foot"><div class="cta">${cta} <b>→</b></div><img src="${LOGO}"></div>`,
  note: (text, top = 20) => `<div class="note" style="margin-top:${top}px">${text}</div>`,
  /** [[title, detail], ...] as numbered orange circles. */
  numbered: (items, pad = 20) =>
    items.map(([t, d], i) => `
      <div style="display:flex;gap:28px;padding:${pad}px 0">
        <div class="d" style="width:64px;height:64px;flex:none;border-radius:50%;background:#ff8c1c;color:#fff;font-size:36px;font-weight:700;display:flex;align-items:center;justify-content:center">${i + 1}</div>
        <div><div class="d" style="font-size:40px;font-weight:700">${t}</div>${d ? `<div style="font-size:31px;margin-top:6px;color:#444;line-height:1.4">${d}</div>` : ""}</div></div>`).join(""),
  /** [label, value] rows, e.g. a task and how long before the wedding. */
  rows: (items, pad = 22) =>
    items.map(([l, v]) => `
      <div style="display:flex;align-items:baseline;gap:24px;padding:${pad}px 0;border-bottom:2px solid #f2e6da;font-size:36px">
        <span style="flex:1">${l}</span><span class="d" style="font-weight:700;color:#c35004;white-space:nowrap">${v}</span></div>`).join(""),
  /** Plain strings as an orange-ticked checklist. */
  checks: (items, pad = 18) =>
    items.map((t) => `
      <div style="display:flex;gap:22px;align-items:center;padding:${pad}px 0;font-size:35px">
        <div style="width:40px;height:40px;flex:none;border-radius:8px;background:#ff8c1c;color:#fff;font-size:28px;font-weight:700;display:flex;align-items:center;justify-content:center">✓</div>${t}</div>`).join(""),
  /** Plain strings as "?"-led questions. */
  questions: (items, pad = 22) =>
    items.map((q) => `
      <div style="display:flex;gap:24px;padding:${pad}px 0;border-bottom:2px solid #f2e6da">
        <div class="d" style="font-size:40px;font-weight:700;color:#f36705;line-height:1.1">?</div>
        <div style="font-size:33px;line-height:1.35">${q}</div></div>`).join(""),
  /**
   * A full-bleed photo with the headline over a dark fade at the bottom.
   * opts: { focus: CSS background-position, e.g. "50% 30%"; sub: a line under the title }.
   */
  photoFull: (src, kicker, title, opts = {}) =>
    `<div class="bg" style="background-image:url('${fileUrl(src)}');background-position:${opts.focus || "center"}"></div>
     <div class="bg shade"></div>
     <div class="over"><div class="k">${kicker}</div><h1${opts.size ? ` style="font-size:${opts.size}px"` : ""}>${title}</h1>${opts.sub ? `<p>${opts.sub}</p>` : ""}</div>`,
  /** A photo across the top of the pin; follow it with band-less content in wrap(). */
  photoTop: (src, height = 640, focus = "center") =>
    `<div style="height:${height}px;background:url('${fileUrl(src)}') ${focus}/cover"></div>`,
  /**
   * An original color-palette pin body: big swatches with names and hex codes,
   * and flat illustrations (dress, bouquet, place setting) drawn in the palette.
   * colors: [{ name, hex, use }], 4 or 5 of them; the first three drive the
   * illustrations (dress, flowers, linen).
   */
  palette: (colors) => {
    const [a, b, c, d = c, e = b] = colors.map((x) => x.hex);
    const dress = `<svg viewBox="0 0 200 300" width="200" height="300"><path d="M78 20 Q100 34 122 20 L128 70 Q124 92 112 104 L170 290 Q100 304 30 290 L88 104 Q76 92 72 70 Z" fill="${a}"/><path d="M88 104 Q100 112 112 104" stroke="${d}" stroke-width="5" fill="none"/></svg>`;
    const bouquet = `<svg viewBox="0 0 220 300" width="220" height="300"><path d="M104 150 L92 290 M110 150 L110 292 M116 150 L128 290" stroke="#7a8c6a" stroke-width="7"/><path d="M86 196 Q110 214 134 196 L130 224 Q110 236 90 224 Z" fill="${c}"/>
      ${[[70,110,40,b],[140,104,42,b],[106,72,40,e],[108,138,36,c],[50,150,26,d],[168,150,28,d],[80,62,22,a],[146,58,24,a]].map(([x,y,r,f])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"/><circle cx="${x}" cy="${y}" r="${r*0.38}" fill="rgba(0,0,0,.08)"/>`).join("")}</svg>`;
    const setting = `<svg viewBox="0 0 240 300" width="240" height="300"><rect x="10" y="40" width="220" height="250" rx="10" fill="${c}"/><rect x="104" y="40" width="32" height="250" fill="${a}" opacity=".85"/><circle cx="120" cy="165" r="74" fill="#fff"/><circle cx="120" cy="165" r="56" fill="none" stroke="${d}" stroke-width="5"/><rect x="30" y="110" width="9" height="120" rx="4" fill="${d}"/><rect x="200" y="110" width="9" height="120" rx="4" fill="${d}"/><path d="M96 150 L144 150 L132 186 L108 186 Z" fill="${b}"/></svg>`;
    const swatches = colors.map((x) => `
      <div style="flex:1;text-align:center">
        <div style="height:150px;border-radius:24px;background:${x.hex};box-shadow:inset 0 0 0 2px rgba(0,0,0,.06)"></div>
        <div class="d" style="font-size:30px;font-weight:700;margin-top:14px">${x.name}</div>
        <div style="font-size:22px;color:#888;margin-top:2px">${x.hex.toUpperCase()}</div>
        <div style="font-size:24px;color:#444;margin-top:6px;line-height:1.3">${x.use}</div>
      </div>`).join("");
    return `<div style="display:flex;justify-content:space-around;align-items:flex-end;padding:44px 50px 10px;background:linear-gradient(180deg,#fff,#faf7f3)">${dress}${bouquet}${setting}</div>
      <div style="display:flex;gap:18px;padding:30px 60px 0">${swatches}</div>`;
  },
  /** A soft cream callout box. */
  callout: (html, top = 36) =>
    `<div style="margin-top:${top}px;background:#fff4ea;border-radius:24px;padding:28px 32px;font-size:32px;line-height:1.45">${html}</div>`,
  // --- stories ---
  /** One story frame: n of total, a body inside the safe area, optional orange background. */
  story: (n, total, inner, orange = false) =>
    `<body class="${orange ? "orange" : ""}"><div class="step">${n} / ${total}</div><div class="safe">${inner}</div><img class="slogo" src="${LOGO}"></body>`,
  tap: (text = "Tap the link below to try it ↓") => `<div class="tap">${text}</div>`,
};

async function main() {
  const [specPath, outDir, sheetPath] = process.argv.slice(2);
  if (!specPath || !outDir) {
    console.error("usage: node render.js <spec.js> <out-dir> [contact-sheet.png]");
    process.exit(2);
  }
  const spec = require(path.resolve(specPath))(helpers);
  const fmt = FORMATS[spec.format];
  if (!fmt) throw new Error(`format must be "pin" or "story", got ${spec.format}`);
  fs.mkdirSync(outDir, { recursive: true });

  const css = siteFonts() + BASE + `body{width:${fmt.width}px;height:${fmt.height}px}`;
  const tmp = fs.mkdtempSync(path.join(require("os").tmpdir(), "bt-render-"));
  const launch = { args: ["--allow-file-access-from-files"] };
  if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: fmt.width, height: fmt.height } });

  let failed = false;
  const outputs = [];
  for (const [name, html] of Object.entries(spec.items)) {
    const body = html.trimStart().startsWith("<body") ? html : `<body>${html}</body>`;
    const file = path.join(tmp, `${name}.html`);
    fs.writeFileSync(file, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head>${body}</html>`);
    await page.goto(`file://${file}`);
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);

    const fonts = await page.evaluate(() => [...new Set([...document.fonts].filter((f) => f.status === "loaded").map((f) => f.family))]);
    // The lowest edge of any content that isn't the footer or the logo.
    // Containers (.safe, .bg layers) span the frame by design, so only their
    // contents count.
    const bottom = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll("body *")]
      .filter((e) => !e.closest(".foot") && !e.matches(".slogo, .step, .safe, .bg, .wrap"))
      .map((e) => e.getBoundingClientRect().bottom)));
    // Photos that fail to load leave an empty layer, not an error, so check.
    const missing = await page.evaluate(() => Promise.all([...document.querySelectorAll("[style*='url(']")].map((e) => {
      const u = getComputedStyle(e).backgroundImage.match(/url\("?(.*?)"?\)/)?.[1];
      return u ? new Promise((r) => { const i = new Image(); i.onload = () => r(null); i.onerror = () => r(u); i.src = u; }) : null;
    })).then((a) => a.filter(Boolean)));
    const out = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: out });
    outputs.push(out);

    const problems = [];
    if (!fonts.includes("Jost")) problems.push(`Jost didn't load (loaded: ${fonts.join(", ") || "none"})`);
    if (missing.length) problems.push(`photo not found: ${missing.join(", ")}`);
    if (bottom > fmt.limit) problems.push(`content reaches ${Math.round(bottom)}px, past ${fmt.limit}px`);
    console.log(`${problems.length ? "FAIL" : "ok  "} ${name}  bottom ${Math.round(bottom)}/${fmt.limit}${problems.length ? "  " + problems.join("; ") : ""}`);
    if (problems.length) failed = true;
  }

  if (sheetPath) {
    const w = spec.format === "pin" ? 400 : 360;
    const imgs = outputs.map((o) => `<img src="file://${path.resolve(o)}" style="width:${w}px;margin:5px">`).join("");
    const sheet = path.join(tmp, "sheet.html");
    fs.writeFileSync(sheet, `<body style="margin:0;background:#999;display:flex;flex-wrap:wrap;align-items:flex-start;width:${(w + 10) * Math.min(outputs.length, 5)}px">${imgs}</body>`);
    await page.setViewportSize({ width: (w + 10) * Math.min(outputs.length, 5), height: 800 });
    await page.goto(`file://${sheet}`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: sheetPath, fullPage: true });
    console.log(`sheet ${sheetPath}`);
  }

  await browser.close();
  fs.rmSync(tmp, { recursive: true, force: true });
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
