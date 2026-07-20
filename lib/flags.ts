/**
 * Feature flags.
 *
 * SHOW_VENDOR_DIRECTORY — the /vendors directory is hidden at launch because
 * the `vendors` table currently holds seeded sample data (no websites, no
 * images, invented business names) rather than real, bookable vendors.
 * Publishing it as-is would misrepresent fictional listings as real ones.
 *
 * To bring it back once the table holds real listings, set
 * NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY=true. Nothing else needs to change:
 * the page, the admin tools and the queries all still work.
 *
 * Note this is read at build time (NEXT_PUBLIC_*), so flipping it requires
 * a rebuild/redeploy, not just an env change on a running server.
 */
export const SHOW_VENDOR_DIRECTORY =
  process.env.NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY === "true";

/**
 * SHOW_PLANNER_APP — the signed-in planner (accounts, onboarding, dashboard,
 * wedding workspace). Off by default so the live marketing site keeps
 * deploying from `main` while this is being built.
 *
 * The public /signup and /login pages stay on the waitlist until this is on;
 * flipping it is what "accounts are open" means. Read at build time, so it
 * needs a redeploy, not just an env change.
 */
export const SHOW_PLANNER_APP =
  process.env.NEXT_PUBLIC_SHOW_PLANNER_APP === "true";
