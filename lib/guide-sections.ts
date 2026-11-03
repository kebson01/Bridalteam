import type { Guide } from "@/lib/guides";

/**
 * How /guides groups the guides when nothing is searched or filtered: one
 * guide to start with, the three decisions that come before any deposit, the
 * vendor guides, and everything else.
 *
 * Every guide lands in exactly one place. A guide added to lib/guides.ts
 * without being named here falls into "Logistics & etiquette" (or "Hiring
 * your team" if it is a Vendors guide), so it can never go missing from the
 * page. lib/guide-sections.test.ts checks both.
 */

export const FLAGSHIP_SLUG = "wedding-planning-checklist";

/** Settle these before paying any deposit. Order is the order shown. */
export const FOUNDATION_SLUGS = [
  "how-much-does-a-wedding-cost",
  "wedding-guest-list",
  "how-to-choose-a-wedding-venue",
] as const;

/** Leads the vendor section: it says which of the others to read first. */
const HIRING_LEAD = "when-to-book-wedding-vendors";

export interface GuideSections {
  flagship: Guide | null;
  foundation: Guide[];
  hiring: Guide[];
  logistics: Guide[];
}

export function groupGuides(guides: Guide[]): GuideSections {
  const bySlug = new Map(guides.map((g) => [g.slug, g]));
  const used = new Set<string>();
  const take = (slug: string) => {
    const g = bySlug.get(slug);
    if (g && !used.has(slug)) {
      used.add(slug);
      return g;
    }
    return null;
  };

  const flagship = take(FLAGSHIP_SLUG);
  const foundation = FOUNDATION_SLUGS.map(take).filter((g): g is Guide => g !== null);
  const lead = take(HIRING_LEAD);
  const hiring = [
    ...(lead ? [lead] : []),
    ...guides.filter((g) => g.category === "Vendors" && !used.has(g.slug)),
  ];
  for (const g of hiring) used.add(g.slug);
  const logistics = guides.filter((g) => !used.has(g.slug));
  return { flagship, foundation, hiring, logistics };
}
