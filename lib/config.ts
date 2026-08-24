import { SHOW_PLANNER_APP } from "@/lib/flags";

/**
 * Single source of truth for the account/signup state.
 *
 * The header, footer, pricing and for-vendors pages used to each branch on
 * SHOW_PLANNER_APP independently (or hard-code `/signup`), which let them drift
 * out of agreement — some CTAs pointed at the real auth screen while others
 * still sent people to the pre-launch waitlist. Everything now reads from here.
 *
 * SIGNUPS_OPEN mirrors SHOW_PLANNER_APP: when the planner app is live, real
 * accounts are open and every "Start free" CTA points at the real auth screen;
 * otherwise the whole site funnels to the waitlist. Because SHOW_PLANNER_APP is
 * a build-time flag, changing this needs a redeploy, not just an env change.
 */
export const SIGNUPS_OPEN = SHOW_PLANNER_APP;

/** Where every couple "Start free" / signup CTA should point. */
export const SIGNUP_URL = SIGNUPS_OPEN ? "/auth/signup" : "/signup";

/** Where "Log in" should point. */
export const LOGIN_URL = SIGNUPS_OPEN ? "/auth/login" : "/login";

/**
 * Vendor registration entry point. When accounts are open it lands on real
 * signup routed to vendor onboarding; otherwise the vendor waitlist.
 */
export const VENDOR_SIGNUP_URL = SIGNUPS_OPEN
  ? "/auth/signup?next=" + encodeURIComponent("/onboarding?type=vendor")
  : "/signup";
