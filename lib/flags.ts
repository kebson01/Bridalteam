/**
 * Feature flags.
 *
 * SHOW_VENDOR_DIRECTORY — surfaces the *entry points* to /vendors: the footer
 * link and the homepage teaser. It no longer gates the page itself.
 *
 * It was originally an all-or-nothing hide, because /vendors then rendered the
 * `vendors` table, which holds seeded sample data (invented business names, no
 * websites, no images) that would have read as real listings. That page now
 * reads `vendor_profiles` and shows only rows a vendor published themselves —
 * so with nothing published it shows an honest empty state instead of fiction,
 * and is safe to leave reachable. The seeded `vendors` table survives only
 * behind /admin/venues; nothing public renders it.
 *
 * Set NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY=true to advertise the directory in the
 * nav and on the homepage once there are real listings worth sending people to.
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
