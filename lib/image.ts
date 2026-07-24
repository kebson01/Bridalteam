/**
 * Client-side avatar processing: center-crop to a square and downscale, so
 * uploaded photos always frame cleanly as a circle and stay small. Runs in the
 * browser only (uses <canvas>), so call it from client components.
 */

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap is fast and can honour EXIF orientation. Fall back to an
  // <img> for browsers/files it can't decode.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* fall through to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode failed"));
      img.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type ProcessedImage = { blob: Blob; ext: string; type: string };

/**
 * Returns a square, downscaled version of `file`. Prefers WebP (smaller),
 * falling back to JPEG. `size` is the output edge length in pixels.
 */
export async function squareAvatar(file: File, size = 512): Promise<ProcessedImage> {
  const source = await loadBitmap(file);
  const sw = source.width;
  const sh = source.height;
  const side = Math.min(sw, sh);
  const sx = Math.max(0, (sw - side) / 2);
  const sy = Math.max(0, (sh - side) / 2);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");

  // White backdrop so transparent PNGs don't come through black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sx, sy, side, side, 0, 0, size, size);
  if ("close" in source && typeof source.close === "function") source.close();

  const toBlob = (type: string): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));

  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };

  const jpeg = await toBlob("image/jpeg");
  if (jpeg) return { blob: jpeg, ext: "jpg", type: "image/jpeg" };

  throw new Error("Could not process image");
}

/**
 * Returns a downscaled version of `file` that fits within `maxDim` on its
 * longest edge, preserving aspect ratio. Keeps photos reasonably sized for a
 * feed without cropping. Exports WebP (JPEG fallback).
 */
export async function downscaleImage(file: File, maxDim = 1600): Promise<ProcessedImage> {
  const source = await loadBitmap(file);
  const sw = source.width;
  const sh = source.height;
  const scale = Math.min(1, maxDim / Math.max(sw, sh));
  const w = Math.max(1, Math.round(sw * scale));
  const h = Math.max(1, Math.round(sh * scale));

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unsupported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  if ("close" in source && typeof source.close === "function") source.close();

  const toBlob = (type: string): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, type, 0.85));

  const webp = await toBlob("image/webp");
  if (webp && webp.type === "image/webp") return { blob: webp, ext: "webp", type: "image/webp" };
  const jpeg = await toBlob("image/jpeg");
  if (jpeg) return { blob: jpeg, ext: "jpg", type: "image/jpeg" };
  throw new Error("Could not process image");
}
