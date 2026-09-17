/**
 * Turns a Supabase Auth error into something a person can act on.
 *
 * The auth panels used to render `error.message` directly, which meant users
 * saw Supabase's internal wording. The worst of those is "Invalid login
 * credentials", which Supabase deliberately returns for BOTH a wrong password
 * and an unconfirmed account — so someone who signed up, never saw the
 * confirmation email, and tried to log in was told their password was wrong.
 * They then reset a password that was never the problem.
 *
 * Two of these now matter more than they did:
 *
 *   - `weak_password` started reaching real users the moment leaked-password
 *     protection was enabled (audit M5). Supabase's own text mentions being
 *     "easy to guess", which sounds like a judgement rather than an
 *     explanation; it is actually a breach-corpus match, so we say that.
 *   - `captcha_failed` will start appearing once Turnstile is enabled
 *     (audit M9), and its raw form — "captcha protection: request
 *     disallowed" — tells a user nothing they can do.
 *
 * Matching is by `code` first, since supabase-js v2 exposes stable codes, with
 * message sniffing as a fallback for anything that predates them. Unknown
 * errors fall through to a generic line rather than leaking internals; the raw
 * error still reaches the console for us.
 */

type MaybeAuthError = { message?: string; code?: string; status?: number } | null | undefined;

const GENERIC = "Something went wrong on our end. Please try again in a moment.";

/** Copy that avoids confirming whether an account exists for a given email. */
const CREDENTIALS_OR_UNCONFIRMED =
  "That email and password don't match. If you've just signed up, open the confirmation link in your inbox first — accounts need confirming before you can log in.";

export function authErrorMessage(
  error: MaybeAuthError,
  mode: "login" | "signup" | "reset" | "update" = "login",
): string {
  if (!error) return GENERIC;

  const code = (error.code ?? "").toLowerCase();
  const raw = (error.message ?? "").toLowerCase();
  const has = (...needles: string[]) => needles.some((n) => raw.includes(n));

  // Wrong password, unknown account, or unconfirmed — Supabase is deliberately
  // ambiguous here, so the copy has to cover all three without picking one.
  if (code === "invalid_credentials" || has("invalid login credentials")) {
    return CREDENTIALS_OR_UNCONFIRMED;
  }

  if (code === "email_not_confirmed" || has("email not confirmed", "not confirmed")) {
    return "Please confirm your email first — open the link we sent you. If it never arrived, use the resend button on the signup screen.";
  }

  if (code === "user_already_exists" || has("already registered", "already been registered")) {
    return "There's already an account with that email. Try logging in, or reset your password if you've forgotten it.";
  }

  // Live since leaked-password protection was turned on.
  if (code === "weak_password" || has("weak", "pwned", "breach")) {
    return "That password shows up in a known data breach, so it isn't safe to use here. Please choose a different one.";
  }

  if (code === "same_password" || has("should be different from the old password")) {
    return "That's the password you already have. Choose a different one.";
  }

  if (has("password should be at least", "password is too short")) {
    return "Passwords need to be at least 8 characters.";
  }

  if (code === "email_address_invalid" || has("invalid email", "unable to validate email")) {
    return "That doesn't look like a valid email address. Check it for typos.";
  }

  // Turnstile, once M9 is active.
  if (code === "captcha_failed" || has("captcha")) {
    return "The security check didn't pass. Reload the page and try again — and if you use an ad or script blocker, allow this page.";
  }

  if (
    code === "over_email_send_rate_limit" ||
    code === "over_request_rate_limit" ||
    error.status === 429 ||
    has("rate limit", "too many requests")
  ) {
    return "Too many attempts. Please wait a few minutes before trying again.";
  }

  if (code === "signup_disabled" || has("signups not allowed", "signup is disabled")) {
    return "New accounts are closed at the moment. Please try again later.";
  }

  // A fetch that never reached Supabase: offline, DNS, blocked request.
  if (has("failed to fetch", "networkerror", "load failed")) {
    return "We couldn't reach the server. Check your connection and try again.";
  }

  if (mode === "signup") {
    return "We couldn't create your account just now. Please try again in a moment.";
  }
  // "reset" is requesting the email; "update" is saving a new password or a
  // profile field through updateUser.
  if (mode === "reset") {
    return "We couldn't send the reset link just now. Please try again in a moment.";
  }
  if (mode === "update") {
    return "We couldn't save that just now. Please try again in a moment.";
  }
  return GENERIC;
}
