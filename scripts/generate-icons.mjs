// Generates the PWA icon set from public/brand/logo.svg.
//
// The logo is a wide wordmark (208x57); only the ring-and-bouquet glyph on the
// left works as a square app icon, so we re-crop the SVG viewBox to just that
// mark before rasterising. Re-run with `node scripts/generate-icons.mjs` if the
// brand mark ever changes.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");

// Bounds of the mark within the wordmark's coordinate system, squared off.
const MARK_VIEWBOX = "-3.75 -0.3 57 57";
const BRAND = "#f25e00";

const logo = await readFile(path.join(publicDir, "brand", "logo.svg"), "utf8");

// Swap the root viewBox so librsvg renders only the mark.
const markSvg = logo.replace(
  /width="100%" height="100%" viewBox="0 0 208 57"/,
  `width="1024" height="1024" viewBox="${MARK_VIEWBOX}"`,
);

if (markSvg === logo) {
  throw new Error("logo.svg root <svg> attributes changed — update the regex");
}

const mark = await sharp(Buffer.from(markSvg)).png().toBuffer();

/** Render the mark centred on a solid square, occupying `inset` of the canvas. */
async function render(size, inset, background, file) {
  const markSize = Math.round(size * inset);
  const pad = Math.round((size - markSize) / 2);

  const resized = await sharp(mark)
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp({
    create: { width: size, height: size, channels: 4, background },
  })
    .composite([{ input: resized, top: pad, left: pad }])
    .png()
    .toFile(path.join(publicDir, file));

  console.log(`  ${file}  ${size}x${size}`);
}

const white = { r: 255, g: 255, b: 255, alpha: 1 };

console.log("Generating PWA icons:");
// Standard icons: mark fills most of the tile.
await render(192, 0.84, white, "icon-192.png");
await render(512, 0.84, white, "icon-512.png");
// Maskable: Android crops to a circle, so keep the mark inside the ~80% safe zone.
await render(512, 0.6, white, "icon-maskable-512.png");
// iOS home screen: no transparency, no rounding (the OS applies its own mask).
await render(180, 0.8, white, "apple-touch-icon.png");

// Monochrome pinned-tab / Safari mask icon derived from the same crop.
await writeFile(
  path.join(publicDir, "mask-icon.svg"),
  markSvg
    .replace(/width="1024" height="1024"/, 'width="57" height="57"')
    .replace(/fill:url\(#_Linear\d+\)/g, `fill:${BRAND}`),
  "utf8",
);
console.log("  mask-icon.svg");
