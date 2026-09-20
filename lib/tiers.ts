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

/**
 * The shape `effectivePlan` reads. Matches the `organizations` columns, so a
 * row can be passed straight in.
 */
export type PlanSource = {
  plan?: string | null;
  /** A plan granted by us rather than bought — see effectivePlan(). */
  comp_plan?: string | null;
  /** When the comp lapses. null = open-ended. */
  comp_expires_at?: string | null;
};

/**
 * The plan a vendor's features should actually be gated on: the better of what
 * they pay for and what we've comped them.
 *
 * Founding vendors are the reason this exists. The directory launched with no
 * couples in it, so the honest pitch to an early vendor cannot be leads — and
 * a Free listing hides the one asset they care most about, the link to their
 * own website. Comping Pro costs nothing while nobody is paying, and makes the
 * listing worth claiming.
 *
 * **Why not just set `plan`.** `organizations.plan` means "what Stripe says",
 * and the M1 fix in SECURITY-AUDIT-MAIN.md is built on that: `plan` was
 * revoked from `authenticated` precisely so a vendor could not award
 * themselves a paid tier. A row reading `plan = 'pro'` with no
 * `stripe_subscription_id` is exactly what that exploit leaves behind, so
 * writing comps there would make a granted tier indistinguishable from a
 * stolen one in the data, and a later audit unable to tell them apart. A
 * separate column keeps `plan` honest, makes comps greppable, and lets them
 * expire.
 *
 * Takes the *higher* of the two rather than preferring the comp: a comped
 * vendor who later subscribes to Featured must not be dragged back down to a
 * leftover Pro comp.
 */
export function effectivePlan(org: PlanSource | null | undefined, now: Date = new Date()): Plan {
  const paid = normalizePlan(org?.plan);
  const expiry = org?.comp_expires_at ? new Date(org.comp_expires_at) : null;
  // An unparseable expiry is treated as expired: failing toward the *lower*
  // tier is the safe direction for an entitlement, and a bad timestamp should
  // not silently hand out a paid feature forever.
  const compLive = !expiry || (!Number.isNaN(expiry.getTime()) && expiry > now);
  const comp = compLive ? normalizePlan(org?.comp_plan) : "free";
  return PLAN_RANK[comp] > PLAN_RANK[paid] ? comp : paid;
}

/** The columns `effectivePlan` needs, for a PostgREST `select`. */
export const PLAN_COLUMNS = "plan, comp_plan, comp_expires_at";
