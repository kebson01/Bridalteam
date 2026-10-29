/**
 * Single source of truth for the signup and login links.
 *
 * The header, footer, pricing and for-vendors pages used to build these links
 * themselves, which let them drift out of agreement. Everything now reads from
 * here. Accounts are open, so every CTA goes straight to the real auth screens;
 * the old /signup and /login paths only redirect there.
 */

/** Where every couple "Start free" / signup CTA should point. */
export const SIGNUP_URL = "/auth/signup";

/** Where "Log in" should point. */
export const LOGIN_URL = "/auth/login";

/** Vendor registration: real signup, then vendor onboarding. */
export const VENDOR_SIGNUP_URL =
  "/auth/signup?next=" + encodeURIComponent("/onboarding?type=vendor");
