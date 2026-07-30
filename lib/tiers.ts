/**
 * Vendor subscription tiers — the single source of truth for what each plan
 * unlocks. Read `entitlements(plan)` anywhere you need to gate a feature; never
 * hardcode a plan-name comparison in feature code, so the matrix stays in one
 * place.
 *
 * Plans map 1:1 to `organizations.plan` ("free" | "pro" | "featured").
 */

export type Plan = "free" | "pro" | "featured";

export const PLANS: Plan[] = ["free", "pro", "featured"];

/** Rank for comparisons (e.g. "at least Pro"). */
export const PLAN_RANK: Record<Plan, number> = { free: 0, pro: 1, featured: 2 };

export type Entitlements = {
  /** Max gallery images. null = unlimited. */
  galleryLimit: number | null;
  /** Vendor's media appears in the public Inspiration feed. */
  canPostInspiration: boolean;
  /** Outbound link to the vendor's own website is shown. */
  canLinkSite: boolean;
  /** Couples can send inquiries; vendor gets a lead inbox. */
  canReceiveInquiries: boolean;
  /** Basic view/click analytics. */
  hasStats: boolean;
  /** Top-of-category placement + homepage/Inspiration boosts. */
  featuredPlacement: boolean;
  /** "Featured" badge on the listing. */
  badge: boolean;
};

export type TierMeta = {
  plan: Plan;
  name: string;
  /** Monthly price in whole dollars; 0 for Free. */
  priceMonthly: number;
  tagline: string;
  entitlements: Entitlements;
};

export const TIERS: Record<Plan, TierMeta> = {
  free: {
    plan: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "Claim your listing and show a few photos.",
    entitlements: {
      galleryLimit: 5,
      canPostInspiration: false,
      canLinkSite: false,
      canReceiveInquiries: false,
      hasStats: false,
      featuredPlacement: false,
      badge: false,
    },
  },
  pro: {
    plan: "pro",
    name: "Pro",
    priceMonthly: 29,
    tagline: "Grow — unlimited gallery, links, inquiries and stats.",
    entitlements: {
      galleryLimit: null,
      canPostInspiration: true,
      canLinkSite: true,
      canReceiveInquiries: true,
      hasStats: true,
      featuredPlacement: false,
      badge: false,
    },
  },
  featured: {
    plan: "featured",
    name: "Featured",
    priceMonthly: 79,
    tagline: "Everything in Pro, plus top placement and a badge.",
    entitlements: {
      galleryLimit: null,
      canPostInspiration: true,
      canLinkSite: true,
      canReceiveInquiries: true,
      hasStats: true,
      featuredPlacement: true,
      badge: true,
    },
  },
};

/** Normalize any stored plan string to a known Plan (unknown → free). */
export function normalizePlan(plan: string | null | undefined): Plan {
  return plan === "pro" || plan === "featured" ? plan : "free";
}

/** Entitlements for a stored plan string. Safe on unknown/null (treated Free). */
export function entitlements(plan: string | null | undefined): Entitlements {
  return TIERS[normalizePlan(plan)].entitlements;
}

/** True if `plan` is at least `min` in the tier order. */
export function planAtLeast(plan: string | null | undefined, min: Plan): boolean {
  return PLAN_RANK[normalizePlan(plan)] >= PLAN_RANK[min];
}
