/**
 * Phasing out Bridal Team's own starter content.
 *
 * The inspiration feed launched with stock photos Bridal Team picked itself
 * (`is_seed`). They are labeled "Bridal Team Ideas" so nobody mistakes them for
 * a vendor's or a couple's work, and they step aside as real content arrives:
 *
 * - Real content always comes first; seed pieces sit below it.
 * - For every RETIRE_EVERY real pieces in the feed, one seed piece is retired.
 *   With 20 seed pieces and RETIRE_EVERY = 2, the last seed piece leaves when
 *   the 40th real piece arrives.
 * - The seed pieces that stay are the ones people liked most (newest first on a
 *   tie), so the feed keeps its best starter content longest.
 * - An admin can retire any seed piece by hand (`retired_at`).
 *
 * Nothing is deleted. Change RETIRE_EVERY to speed the phase-out up or slow
 * it down.
 */

export const RETIRE_EVERY = 2;

export interface FeedItem {
  is_seed?: boolean | null;
  retired_at?: string | null;
  like_count?: number | null;
}

export interface ArrangedFeed<T> {
  items: T[];
  realCount: number;
  seedShown: number;
  seedRetired: number;
}

/** How many seed pieces stay visible next to `realCount` real ones. */
export function seedAllowance(seedCount: number, realCount: number, retireEvery = RETIRE_EVERY): number {
  if (retireEvery <= 0) return seedCount;
  return Math.max(0, seedCount - Math.floor(realCount / retireEvery));
}

/**
 * Orders the feed and drops retired seed pieces. `items` should arrive newest
 * first; that order is kept within real content and used as the tie-break for
 * seed content.
 */
export function arrangeFeed<T extends FeedItem>(items: T[], retireEvery = RETIRE_EVERY): ArrangedFeed<T> {
  const real = items.filter((i) => !i.is_seed);
  const seeds = items.filter((i) => i.is_seed && !i.retired_at);
  const allowed = seedAllowance(seeds.length, real.length, retireEvery);

  const keep = new Set(
    seeds
      .map((item, index) => ({ item, index }))
      .sort((a, b) => (b.item.like_count ?? 0) - (a.item.like_count ?? 0) || a.index - b.index)
      .slice(0, allowed)
      .map(({ item }) => item),
  );

  const shownSeeds = seeds.filter((s) => keep.has(s));
  return {
    items: [...real, ...shownSeeds],
    realCount: real.length,
    seedShown: shownSeeds.length,
    seedRetired: items.length - real.length - shownSeeds.length,
  };
}
