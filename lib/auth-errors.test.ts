import { describe, it, expect } from "vitest";
import { authErrorMessage } from "./auth-errors";

/**
 * These strings are what a locked-out person reads, so the tests assert the
 * distinction each branch exists to make rather than the exact wording —
 * copy should be free to change without breaking the suite, but a branch
 * quietly collapsing into the generic fallback should not be.
 */
describe("authErrorMessage", () => {
  it("covers wrong password AND unconfirmed account in one message", () => {
    // Supabase returns invalid_credentials for both. Telling someone their
    // password is wrong when the real problem is an unopened confirmation
    // email sends them to reset a password that was never the issue.
    const msg = authErrorMessage({ code: "invalid_credentials" }, "login");
    expect(msg).toMatch(/don't match/i);
    expect(msg).toMatch(/confirm/i);
  });

  it("matches on the legacy message when no code is present", () => {
    // supabase-js only grew stable codes in v2; older errors carry message only.
    expect(authErrorMessage({ message: "Invalid login credentials" })).toBe(
      authErrorMessage({ code: "invalid_credentials" }),
    );
  });

  it("explains weak_password as a breach match, not a judgement", () => {
    // Live since leaked-password protection was enabled (audit M5). Supabase's
    // own wording ("easy to guess") reads as an opinion about the user.
    const msg = authErrorMessage({ code: "weak_password" }, "signup");
    expect(msg).toMatch(/data breach/i);
  });

  it("makes captcha_failed actionable", () => {
    // Raw form is "captcha protection: request disallowed", which tells a
    // visitor nothing they can do.
    const msg = authErrorMessage({ code: "captcha_failed" }, "login");
    expect(msg).toMatch(/security check/i);
    expect(msg).not.toMatch(/disallowed/i);
  });

  it("treats a 429 without a code as a rate limit", () => {
    expect(authErrorMessage({ status: 429 })).toMatch(/too many attempts/i);
  });

  it("names a network failure rather than blaming the credentials", () => {
    expect(authErrorMessage({ message: "Failed to fetch" })).toMatch(/couldn't reach the server/i);
  });

  it.each([
    ["email_not_confirmed", /confirm your email/i],
    ["user_already_exists", /already an account/i],
    ["same_password", /already have/i],
    ["email_address_invalid", /valid email/i],
    ["signup_disabled", /closed at the moment/i],
  ])("maps %s to its own message", (code, pattern) => {
    expect(authErrorMessage({ code })).toMatch(pattern);
  });

  it("never leaks the raw Supabase message for an unknown error", () => {
    const msg = authErrorMessage({ message: "pq: duplicate key value violates unique constraint" });
    expect(msg).not.toMatch(/pq:|constraint/i);
  });

  it("falls back per mode so the generic line still fits the action", () => {
    const unknown = { message: "something we have never seen" };
    expect(authErrorMessage(unknown, "signup")).toMatch(/create your account/i);
    expect(authErrorMessage(unknown, "reset")).toMatch(/send the reset link/i);
    expect(authErrorMessage(unknown, "update")).toMatch(/save that/i);
  });

  it("handles a null error without throwing", () => {
    expect(authErrorMessage(null)).toBeTruthy();
    expect(authErrorMessage(undefined)).toBeTruthy();
  });
});
