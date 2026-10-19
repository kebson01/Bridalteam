/**
 * Monogram tiles for listings with no image of their own.
 *
 * Most of the directory is imported businesses that have never signed in, so
 * `logo_url` and `cover_url` are null on the great majority of rows and every
 * one of those cards used to fall back to its category name in small caps --
 * which made a grid of them read as one repeated placeholder rather than a
 * list of distinct businesses.
 *
 * A monogram fixes that without taking anything from the vendor. The initials
 * come from the business name we already store and the tint is derived from
 * that same name, so nothing is fetched, nothing is cached and no third party
 * learns who is browsing the directory. Deliberately *not* their favicon or
 * their og:image: a favicon means either leaking every visitor to an icon
 * service or storing someone's brand mark, and the photographs are the vendor's
 * own work -- showing their work is what the paid tiers exist to do, once they
 * have chosen to upload it.
 *
 * A real logo always wins: the card prefers `cover_url`, then `logo_url`, and
 * only then this.
 */

/**
 * Words that should never start a monogram. "The Collection Bridal" reads as
 * CB, not TC. "A" and "An" are kept, because a name like "A Chair Affair" or
 * "A Beautiful Ceremony" genuinely begins with it.
 */
const SKIP = new Set(["the", "and", "of", "by", "for", "at"]);

/**
 * Up to three characters standing in for a business name.
 *
 * A name beginning with a number keeps the number -- "717 Parking" is 717, not
 * 7P, and "954 Catering" is 954 -- because that digit group is how people say
 * the name. A single leading digit takes the next word's initial with it, so
 * "3 C's Catering" is 3C rather than a lone 3.
 */
export function initials(name: string | null | undefined): string {
  const words = (name ?? "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .filter((w, i, all) => !(SKIP.has(w.toLowerCase()) && all.length > 1));

  if (words.length === 0) return "?";

  const first = words[0];
  if (/^\d+$/.test(first)) {
    // 2+ digits read as a unit ("717"); one digit needs a letter beside it.
    if (first.length >= 2) return first.slice(0, 3);
    return (first + (words[1]?.[0] ?? "")).toUpperCase();
  }

  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/**
 * Warm tints drawn from the brand family. Each is paired with INK below at
 * 6.3:1 or better, so the letters clear WCAG AA on every one -- see
 * `lib/monogram.test.ts`, which computes the ratios rather than trusting this
 * comment.
 */
const TINTS = [
  "#fff1e2",
  "#ffe6cc",
  "#f7ead9",
  "#fde8d3",
  "#f3ece3",
  "#ffe2d0",
  "#fce9dd",
  "#f6e7d2",
] as const;

/** The one letter colour used on every tint. */
export const MONOGRAM_INK = "#8a3a02";

/**
 * Pick a tint for a name. Deterministic, so a listing keeps the same colour
 * across renders, reloads and machines -- a hash seeded by anything
 * per-request (Math.random, Date) would make the grid flicker on navigation
 * and break any visual-diff test.
 */
export function tint(name: string | null | undefined): string {
  const s = name ?? "";
  // FNV-1a: tiny, stable, and spreads single-character changes across buckets
  // far better than a sum of char codes, which would send every "A..." name to
  // the same tint.
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return TINTS[Math.abs(h) % TINTS.length];
}

/** Everything a monogram tile needs, in one call. */
export function monogram(name: string | null | undefined): {
  text: string;
  background: string;
  color: string;
} {
  return { text: initials(name), background: tint(name), color: MONOGRAM_INK };
}
