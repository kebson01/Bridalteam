/**
 * Helpers for turning a media item into a still image for grid/preview tiles.
 *
 * Video and audio are stored as links (YouTube/Vimeo/direct file). Their
 * `image_url` should be a real poster image — but when a vendor adds a video
 * without a cover image we must never drop the raw video/watch URL into an
 * <img>, or the tile renders broken. These helpers resolve a safe poster
 * (e.g. a YouTube thumbnail) and let callers fall back to a placeholder.
 */

/** Extract an 11-char YouTube id from a watch/short/embed URL. */
export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/,
  );
  return m ? m[1] : null;
}

/** A YouTube thumbnail URL for a video link, or null if it isn't YouTube. */
export function youtubePoster(url: string | null | undefined): string | null {
  const id = youtubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

/** Is this a direct video file we could render a first frame from? */
export function isDirectVideoFile(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|mov|m4v|avi|mkv)(\?|$)/i.test(url);
}

/** Whether a URL is safe to drop into an <img>/<Image> (not a video/watch link). */
export function isLikelyImage(url: string | null | undefined): boolean {
  if (!url) return false;
  if (youtubeId(url)) return false;
  if (/vimeo\.com\/\d+/.test(url)) return false;
  if (isDirectVideoFile(url)) return false;
  return true;
}

/**
 * Best still image to represent an item in a grid tile, or null if none is
 * available (caller should render a placeholder / a <video> first frame).
 */
export function posterFor(item: {
  image_url?: string | null;
  media_url?: string | null;
}): string | null {
  if (isLikelyImage(item.image_url)) return item.image_url ?? null;
  return youtubePoster(item.media_url) ?? youtubePoster(item.image_url);
}
