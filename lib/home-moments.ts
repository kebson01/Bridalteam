/**
 * The photo pool the homepage's "Moments worth planning for" mosaic rotates
 * through: the public Inspiration feed, photos only.
 */

export type Moment = { src: string; caption: string; where: string };

export type FeedPhotoRow = {
  image_url: string;
  title: string | null;
  media_type: string | null;
  /**
   * From the database (supabase/migrations/20261120230000_inspiration_has_people.sql):
   * only false may rotate in. Absent when the column isn't there yet, in which
   * case HOME_ALLOWED decides.
   */
  has_people?: boolean | null;
};

export const IDEA = "Inspiration";

/**
 * Only photos without people may rotate onto the homepage (décor, florals,
 * cakes, stationery, venues, empty ceremony sites): the owner's homepage rule
 * is no recognisable faces, and the feed's vendor and stock photos are full of
 * couples and guests. That's recorded per photo in inspiration_images.has_people,
 * which new photos get from an AI check (lib/people-check.ts).
 *
 * This list is the fallback for when that column isn't in the database yet:
 * the feed's people-free photos as of 2026-11-20, checked by eye, and the same
 * ones the migration marks has_people = false. It also keeps out the Paul
 * archway kiss, blessing and lake photos the owner took off the homepage (all
 * have people). Each entry is matched against the photo's URL: a Pexels photo
 * id, a vendor-media file name, or one of our own file names. Once the
 * migration is applied everywhere, this can go.
 */
const HOME_ALLOWED = [
  // Vendor photos
  "277daabd-8dd0-42c4-9a16-bee9706daa88.jpg", // Enclosed Photo Booth
  "a1da1977-221c-4361-979d-b00466525e92.jpg", // Barrel Bar
  "dd8448f9-f102-4256-adcd-88600b3d3c2a.jpg", // Cocktail Menu
  "d8d2c07f-e389-4ee1-95ba-dd2678038d1f.jpg", // Welcome Cocktail
  "e3bed22e-f04e-4999-9f61-f16eb0076d0d.jpg", // Crystal Ballroom Ceremony
  // Our real weddings
  "st-charles-2012-rings.jpg", // Rings in crystal heels
  "st-charles-2012-stonebridge.jpg", // Stonebridge Golf & Country Club
  // Bridal Team starter looks (Pexels)
  "pexels.com/photos/18748938/", // Invitations, rings and a vintage mirror
  "pexels.com/photos/8245195/", // Calligraphy invitations with florals
  "pexels.com/photos/28845664/", // Invitation flat lay with bridal shoe
  "pexels.com/photos/29051736/", // White flowers and greenery cake
  "pexels.com/photos/26774581/", // Five-tier cake with cascading flowers
  "pexels.com/photos/33417654/", // Ceremony under a large tree
  "pexels.com/photos/38531673/", // Beach aisle with chair decor
  "pexels.com/photos/34597461/", // Floral garland and lanterns
  "pexels.com/photos/17022991/", // Candlelit reception table
  "pexels.com/photos/19351606/", // Gold cutlery place settings
  "pexels.com/photos/5310588/", // Orchids and roses bouquet
  "pexels.com/photos/15679210/", // Resort altar by the sea
  "pexels.com/photos/10744427/", // Beach table set beside the arch
  "pexels.com/photos/10733603/", // Wooden signs on the beach
  "pexels.com/photos/9470486/", // Sandbar arch with a sailboat
  "pexels.com/photos/37828118/", // White pavilion on the lawn
  "pexels.com/photos/4403775/", // Mr & Mrs sign in the trees
  "pexels.com/photos/9816194/", // Vow books tied with ribbon
  "pexels.com/photos/16625608/", // Hillside ceremony with a triangle arch
  "pexels.com/photos/12689009/", // Crystal candelabras and stage lights
  "pexels.com/photos/29624022/", // Chandelier banquet hall
  "pexels.com/photos/13834493/", // Black-tie ballroom
  "pexels.com/photos/10619761/", // Pampas arch in the woods
  "pexels.com/photos/29774686/", // Macramé & pampas
  "pexels.com/photos/9816190/", // Boho dessert table with dried flowers
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
 * Feed rows → rotation pool. Keeps only people-free photos (has_people =
 * false, or on HOME_ALLOWED when the column is missing), and drops
 * videos (their posters are YouTube/Pexels stills from hosts next/image may
 * not allow, and a still of a video reads oddly in a photo mosaic), untitled
 * rows, and anything
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
    const peopleFree =
      r.has_people !== undefined ? r.has_people === false : HOME_ALLOWED.some((key) => src.includes(key));
    if (!peopleFree) continue;
    if (seen.has(src)) continue;
    seen.add(src);
    pool.push({ src, ...captionOf(r.title) });
  }
  return pool;
}
