/**
 * The photo pool the homepage's "Moments worth planning for" mosaic rotates
 * through: the public Inspiration feed, photos only.
 */

export type Moment = { src: string; caption: string; where: string };

export type FeedPhotoRow = {
  image_url: string;
  title: string | null;
  media_type: string | null;
};

export const IDEA = "Inspiration";

/**
 * Real-wedding photos the owner asked to keep off the homepage (the Paul
 * archway kiss, and the Paul blessing and lake shots swapped for more of the
 * St. Charles wedding). They stay in the Inspiration feed; only the homepage
 * leaves them out.
 */
const HOME_EXCLUDED = [
  "paul-2014-archway-kiss",
  "paul-2014-blessing",
  "paul-2014-groomsmen-lake",
];

/**
 * Our own photos are stored in the feed with the production origin
 * (https://bridalteam.com/media/...). next/image only accepts that host as a
 * local path, and a local path also works on previews and in development.
 */
function localise(url: string): string {
  return url.replace(/^https:\/\/(www\.)?bridalteam\.com(?=\/)/, "");
}

/**
 * Real-wedding photos carry their wedding in the title ("Team Bride · Paul
 * wedding, Parkland"); split it back out so the tile shows the same two lines
 * as the hand-picked ones. Anything else is labelled as inspiration, so a
 * vendor's or stock photo is never presented as a Bridal Team wedding.
 */
function captionOf(title: string): Pick<Moment, "caption" | "where"> {
  const [caption, rest] = title.split(" · ");
  if (rest && /wedding/i.test(rest)) {
    return { caption: caption.trim(), where: rest.replace(/,\s*/, " · ").trim() };
  }
  return { caption: title.trim(), where: IDEA };
}

/**
 * Feed rows → rotation pool. Drops videos (their posters are YouTube/Pexels
 * stills from hosts next/image may not allow, and a still of a video reads
 * oddly in a photo mosaic), excluded photos, untitled rows, and anything
 * already among `shown` (compared by path, so the feed's absolute copy of a
 * hand-picked local photo counts as the same photo).
 */
export function momentsPool(rows: FeedPhotoRow[], shown: Moment[] = []): Moment[] {
  const seen = new Set(shown.map((m) => localise(m.src)));
  const pool: Moment[] = [];
  for (const r of rows) {
    if (r.media_type && r.media_type !== "photo") continue;
    if (!r.image_url || !r.title?.trim()) continue;
    const src = localise(r.image_url);
    if (HOME_EXCLUDED.some((name) => src.includes(name))) continue;
    if (seen.has(src)) continue;
    seen.add(src);
    pool.push({ src, ...captionOf(r.title) });
  }
  return pool;
}
