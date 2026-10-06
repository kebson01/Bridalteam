import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * That the onboarding step sends no email is a decision, not an accident, so
 * it needs a test. It is one boolean away from reverting, the revert would be
 * invisible in review, and the cost lands on the domain that carries this
 * product's password resets and signup confirmations.
 *
 * The 23505 path is here for a different reason: re-inviting was broken in
 * production for as long as the feature existed, because `wedding_invites` has
 * no UPDATE policy and the old code upserted. Nothing surfaced it — the couple
 * just saw "Couldn't create the invite."
 */
const sendEmail = vi.fn();
const insert = vi.fn();
const selectToken = vi.fn();

vi.mock("@/lib/email", () => ({
  sendEmail: (...args: unknown[]) => sendEmail(...args),
  emailLayout: () => "<html></html>",
}));

vi.mock("@/lib/site", () => ({ SITE_URL: "https://bridalteam.com" }));

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({
    from: (table: string) => {
      if (table === "wedding_invites") {
        return {
          insert: (row: unknown) => ({ select: () => ({ single: () => insert(row) }) }),
          select: () => ({
            eq: () => ({ eq: () => ({ maybeSingle: () => selectToken() }) }),
          }),
        };
      }
      // weddings, for the couple's names
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { partner_one: "Alex", partner_two: "Sam" } }) }),
        }),
      };
    },
  }),
}));

const { createInvite } = await import("./invites");

beforeEach(() => {
  sendEmail.mockReset();
  insert.mockReset();
  selectToken.mockReset();
  sendEmail.mockResolvedValue({ sent: true });
});

const WEDDING = "11111111-1111-1111-1111-111111111111";

describe("createInvite", () => {
  it("sends nothing when send is false, but still returns a usable link", async () => {
    // The onboarding step. This is the assertion that keeps the posture.
    insert.mockResolvedValue({ data: { token: "tok-abc" }, error: null });

    const out = await createInvite(WEDDING, "moh@example.com", "maid_of_honor", { send: false });

    expect(sendEmail).not.toHaveBeenCalled();
    expect(out).toEqual({
      ok: true,
      email: "moh@example.com",
      link: "https://bridalteam.com/invite/tok-abc",
      emailed: false,
      resent: false,
    });
  });

  it("sends when send is true", async () => {
    // The team page, where a couple invites one person deliberately.
    insert.mockResolvedValue({ data: { token: "tok-abc" }, error: null });

    const out = await createInvite(WEDDING, "moh@example.com", "bridesmaid", { send: true });

    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(out.ok && out.emailed).toBe(true);
  });

  it("reports emailed:false when the provider declines, without failing the invite", async () => {
    // No RESEND_API_KEY, or a 4xx from Resend. The invite is still real and the
    // link still works, so this must not read as a failure.
    insert.mockResolvedValue({ data: { token: "tok-abc" }, error: null });
    sendEmail.mockResolvedValue({ sent: false, reason: "no_api_key" });

    const out = await createInvite(WEDDING, "moh@example.com", "bridesmaid", { send: true });

    expect(out.ok).toBe(true);
    expect(out.ok && out.emailed).toBe(false);
    expect(out.ok && out.link).toBe("https://bridalteam.com/invite/tok-abc");
  });

  it("treats a unique violation as already-invited and returns the existing link", async () => {
    // The bug the old upsert hid: wedding_invites has no UPDATE policy, so
    // ON CONFLICT DO UPDATE failed RLS and every re-invite errored.
    insert.mockResolvedValue({ data: null, error: { code: "23505", message: "duplicate key" } });
    selectToken.mockResolvedValue({ data: { token: "tok-existing" }, error: null });

    const out = await createInvite(WEDDING, "mom@example.com", "mother_of_bride", { send: false });

    expect(out).toEqual({
      ok: true,
      email: "mom@example.com",
      link: "https://bridalteam.com/invite/tok-existing",
      emailed: false,
      resent: true,
    });
  });

  it("fails the row, not the batch, on an unexpected database error", async () => {
    insert.mockResolvedValue({ data: null, error: { code: "42501", message: "denied" } });

    const out = await createInvite(WEDDING, "x@example.com", "helper", { send: false });

    expect(out.ok).toBe(false);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects a bad address and a bad role before touching the database", async () => {
    const badEmail = await createInvite(WEDDING, "not-an-email", "helper", { send: true });
    const badRole = await createInvite(WEDDING, "x@example.com", "admin", { send: true });
    const noWedding = await createInvite("", "x@example.com", "helper", { send: true });

    expect(badEmail.ok).toBe(false);
    expect(badRole.ok).toBe(false);
    expect(noWedding.ok).toBe(false);
    expect(insert).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("normalises the address it stores", async () => {
    insert.mockResolvedValue({ data: { token: "tok-abc" }, error: null });

    await createInvite(WEDDING, "  MOM@Example.COM ", "mother_of_bride", { send: false });

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ email: "mom@example.com", wedding_id: WEDDING }),
    );
  });
});
