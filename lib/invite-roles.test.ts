import { describe, it, expect } from "vitest";
import {
  FIRST_INVITE_ROLES,
  INVITE_ROLES,
  INVITE_ROLE_LABELS,
  MAX_INVITES_PER_SUBMIT,
  isEmailish,
  isInviteRole,
  normalizeEmail,
  parseInviteRows,
} from "./invite-roles";

/**
 * The role list lived in two places before this: a Set of valid values in the
 * server action and a separate labelled array in the invite form. They had
 * already drifted — `planner_staff` was accepted by the server and absent from
 * the only form that could send it, so the role existed and was unreachable.
 * These assert the two halves are now one list.
 */
describe("invite roles", () => {
  it("derives the valid set from the labelled list, so they cannot drift", () => {
    expect(INVITE_ROLES.size).toBe(INVITE_ROLE_LABELS.length);
    for (const [value] of INVITE_ROLE_LABELS) expect(INVITE_ROLES.has(value)).toBe(true);
  });

  it("includes planner_staff, which the form used to omit", () => {
    expect(isInviteRole("planner_staff")).toBe(true);
    expect(INVITE_ROLE_LABELS.some(([v]) => v === "planner_staff")).toBe(true);
  });

  it("gives every role a non-empty label", () => {
    for (const [value, label] of INVITE_ROLE_LABELS) {
      expect(label.trim()).not.toBe("");
      expect(value.trim()).not.toBe("");
    }
  });

  it("rejects anything not on the list", () => {
    expect(isInviteRole("admin")).toBe(false);
    expect(isInviteRole("")).toBe(false);
    expect(isInviteRole(null)).toBe(false);
    expect(isInviteRole(undefined)).toBe(false);
  });

  it("opens the onboarding step with roles that exist and fit the cap", () => {
    // A default the select cannot render would silently fall back to the first
    // option, quietly mislabelling the couple's closest people.
    for (const role of FIRST_INVITE_ROLES) expect(INVITE_ROLES.has(role)).toBe(true);
    expect(FIRST_INVITE_ROLES.length).toBeLessThanOrEqual(MAX_INVITES_PER_SUBMIT);
  });
});

describe("normalizeEmail", () => {
  it("lowercases and trims, matching how the unique index sees it", () => {
    // (wedding_id, email) is unique, so "Mom@Example.com " and
    // "mom@example.com" must collide rather than become two invites.
    expect(normalizeEmail("  Mom@Example.COM ")).toBe("mom@example.com");
  });

  it("returns an empty string for anything that is not a string", () => {
    expect(normalizeEmail(null)).toBe("");
    expect(normalizeEmail(undefined)).toBe("");
    expect(normalizeEmail(42)).toBe("");
  });
});

describe("isEmailish", () => {
  it("accepts ordinary addresses", () => {
    expect(isEmailish("mom@example.com")).toBe(true);
    expect(isEmailish("a.b+tag@sub.example.co.uk")).toBe(true);
  });

  it("rejects the ways an onboarding row goes wrong", () => {
    expect(isEmailish("")).toBe(false);
    expect(isEmailish("mom")).toBe(false);
    expect(isEmailish("mom@example")).toBe(false);
    expect(isEmailish("mom @example.com")).toBe(false);
    expect(isEmailish("two@addresses@example.com")).toBe(false);
  });
});

/**
 * The onboarding step's row rules.
 *
 * Each of these is a decision that is invisible once it works and awkward when
 * it doesn't: a couple who types their maid of honour's address twice should
 * not be told she was already invited, and a couple who types their own should
 * not end up with an invitation they cannot accept.
 */
describe("parseInviteRows", () => {
  const form = (o: Record<string, string>) => (k: string) => o[k];

  it("keeps filled rows with their roles, in order", () => {
    const rows = parseInviteRows(
      form({
        email_0: "moh@example.com",
        role_0: "maid_of_honor",
        email_1: "mom@example.com",
        role_1: "mother_of_bride",
      }),
    );
    expect(rows).toEqual([
      { email: "moh@example.com", role: "maid_of_honor" },
      { email: "mom@example.com", role: "mother_of_bride" },
    ]);
  });

  it("skips blank rows rather than failing on them", () => {
    // The normal case: the form opens with three rows and one is filled.
    const rows = parseInviteRows(
      form({ email_0: "", email_1: "moh@example.com", role_1: "bridesmaid", email_2: "   " }),
    );
    expect(rows).toEqual([{ email: "moh@example.com", role: "bridesmaid" }]);
  });

  it("collapses the same address typed twice, keeping the first role", () => {
    const rows = parseInviteRows(
      form({
        email_0: "mom@example.com",
        role_0: "mother_of_bride",
        email_1: " MOM@example.com ",
        role_1: "helper",
      }),
    );
    expect(rows).toEqual([{ email: "mom@example.com", role: "mother_of_bride" }]);
  });

  it("drops the caller's own address, however they capitalise it", () => {
    // Would be a pending invite they can never accept — they own the wedding.
    const rows = parseInviteRows(
      form({ email_0: "Me@Example.com", role_0: "partner", email_1: "moh@example.com", role_1: "maid_of_honor" }),
      "me@example.com",
    );
    expect(rows).toEqual([{ email: "moh@example.com", role: "maid_of_honor" }]);
  });

  it("still works when the caller has no email on record", () => {
    const rows = parseInviteRows(form({ email_0: "moh@example.com", role_0: "bridesmaid" }), "");
    expect(rows).toHaveLength(1);
  });

  it("never returns more rows than the cap, whatever is submitted", () => {
    const many: Record<string, string> = {};
    for (let i = 0; i < MAX_INVITES_PER_SUBMIT + 7; i++) {
      many[`email_${i}`] = `p${i}@example.com`;
      many[`role_${i}`] = "helper";
    }
    expect(parseInviteRows(form(many))).toHaveLength(MAX_INVITES_PER_SUBMIT);
  });

  it("falls back to helper when a role is missing or not a string", () => {
    // A hand-made POST, or a select that never rendered.
    expect(parseInviteRows(form({ email_0: "x@example.com" }))).toEqual([
      { email: "x@example.com", role: "helper" },
    ]);
  });

  it("passes a bad role through for the server to reject, not silently fix", () => {
    // createAndSendInvite checks INVITE_ROLES and reports it per row. Quietly
    // rewriting "admin" to "helper" here would hide a forged submission.
    expect(parseInviteRows(form({ email_0: "x@example.com", role_0: "admin" }))).toEqual([
      { email: "x@example.com", role: "admin" },
    ]);
  });

  it("returns nothing when every row is blank", () => {
    expect(parseInviteRows(form({ email_0: "", email_1: "", email_2: "" }))).toEqual([]);
  });
});
