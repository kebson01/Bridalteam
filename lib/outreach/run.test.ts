import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { runOutreach } from "./run";
import { claimToken, tokenHash } from "./tokens";
import type { OutreachConfig } from "./config";
import type { SendRequest } from "./delivery";

vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ sent: true })) }));

/**
 * A small in-memory stand-in for the Supabase client: just the query shapes
 * run.ts uses (select/range, in, eq, is, gte, update, insert, head counts).
 */
type Row = Record<string, unknown>;
function fakeDb(tables: Record<string, Row[]>) {
  const from = (table: string) => {
    const filters: ((r: Row) => boolean)[] = [];
    let op: { kind: "select" | "update" | "insert"; payload?: Row; count?: boolean } = { kind: "select" };
    let range: [number, number] | null = null;
    const rows = () => (tables[table] ??= []);
    const b: Record<string, unknown> = {
      select: (_c: string, opts?: { count?: string }) => ((op = { kind: "select", count: !!opts?.count }), b),
      update: (p: Row) => ((op = { kind: "update", payload: p }), b),
      insert: (p: Row) => ((op = { kind: "insert", payload: p }), b),
      order: () => b,
      range: (a: number, z: number) => ((range = [a, z]), b),
      eq: (c: string, v: unknown) => (filters.push((r) => r[c] === v), b),
      is: (c: string, v: unknown) => (filters.push((r) => (r[c] ?? null) === v), b),
      in: (c: string, vs: unknown[]) => (filters.push((r) => vs.includes(r[c])), b),
      gte: (c: string, v: string) => (filters.push((r) => String(r[c]) >= v), b),
      then: (resolve: (v: unknown) => void) => {
        const match = rows().filter((r) => filters.every((f) => f(r)));
        if (op.kind === "insert") {
          rows().push({ created_at: new Date().toISOString(), ...op.payload });
          return resolve({ data: null, error: null });
        }
        if (op.kind === "update") {
          match.forEach((r) => Object.assign(r, op.payload));
          return resolve({ data: null, error: null });
        }
        if (op.count) return resolve({ count: match.length, data: null, error: null });
        return resolve({ data: range ? match.slice(range[0], range[1] + 1) : match, error: null });
      },
    };
    return b;
  };
  return { from } as unknown as SupabaseClient;
}

const config: OutreachConfig = {
  enabled: true,
  secret: "s".repeat(40),
  from: "Kebson at Bridal Team <kebson@outreach.bridalteam.com>",
  replyTo: "vendors@bridalteam.com",
  mailingAddress: "PO Box 1, Fort Lauderdale, FL 33301",
  senderName: "Kebson",
  resendApiKey: "re_test",
  webhookSecret: null,
  offerPro: false,
  dailyMax: 50,
  alertTo: null,
};

const org = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
let tables: Record<string, Row[]>;

function listing(n: number, over: Partial<{ email: string | null; city: string; category: string; status: string }> = {}) {
  tables.vendor_profiles.push({ org_id: org(n), business_name: `Vendor ${n}`, category: over.category ?? "Photography", city: over.city ?? "Miami", status: over.status ?? "published" });
  tables.vendor_claims.push({ id: `c${n}`, org_id: org(n), contact_email: over.email === undefined ? `v${n}@ex.com` : over.email, expires_at: "2026-01-01T00:00:00Z", claimed_at: null, token_hash: "old" });
}

beforeEach(() => {
  tables = { vendor_profiles: [], vendor_claims: [], org_members: [], vendor_outreach: [], outreach_suppressions: [], outreach_events: [], organizations: [] };
});

const sent: SendRequest[] = [];
const send = vi.fn(async (r: SendRequest) => (sent.push(r), { ok: true as const, messageId: `msg-${sent.length}` }));
beforeEach(() => {
  sent.length = 0;
  send.mockClear();
});

describe("runOutreach", () => {
  it("dry run plans the first day's 20 and writes nothing", async () => {
    for (let i = 1; i <= 30; i++) listing(i);
    const r = await runOutreach({ db: fakeDb(tables), config, send, acceptsMail: async () => true }, true);
    expect(r.cap).toBe(20);
    expect(r.planned).toEqual({ followUps: 0, finals: 0, firsts: 20 });
    expect(r.remaining).toBe(10);
    expect(send).not.toHaveBeenCalled();
    expect(tables.vendor_outreach).toHaveLength(0);
    expect(tables.vendor_claims.every((c) => c.token_hash === "old")).toBe(true);
  });

  it("sends, makes each claim link work for 60 days, and records it", async () => {
    listing(1);
    listing(2, { email: null }); // no address: not a candidate
    const now = new Date("2026-11-10T15:00:00Z");
    const r = await runOutreach({ db: fakeDb(tables), config, now, send, acceptsMail: async () => true }, false);

    expect(r.sent.firsts).toBe(1);
    expect(sent[0].to).toBe("v1@ex.com");
    expect(sent[0].idempotencyKey).toBe(`vendor-claim-first-${org(1)}`);
    expect(sent[0].email.text).toContain(`/claim/${claimToken(config.secret, org(1))}`);

    const claim = tables.vendor_claims[0];
    expect(claim.token_hash).toBe(tokenHash(claimToken(config.secret, org(1))));
    expect(String(claim.expires_at).slice(0, 10)).toBe("2027-01-09");
    expect(tables.vendor_outreach[0]).toMatchObject({ org_id: org(1), status: "sent", last_message_id: "msg-1" });
    expect(tables.outreach_events.map((e) => e.kind)).toEqual(["sent_first"]);
  });

  it("follows up after a week, sends a final note 15 days later, then never again", async () => {
    listing(1);
    const db = fakeDb(tables);
    const run = (day: string) => runOutreach({ db, config, now: new Date(`${day}T15:00:00Z`), send, acceptsMail: async () => true }, false);
    await run("2026-11-02");
    // Day 5: too early.
    let r = await run("2026-11-07");
    expect(r.sent).toEqual({ followUps: 0, finals: 0, firsts: 0 });
    // Day 8: the follow-up, with the same claim link, and it doesn't call itself the last email.
    r = await run("2026-11-10");
    expect(r.sent.followUps).toBe(1);
    expect(sent[1].email.subject).toMatch(/Following up/);
    expect(sent[1].email.text).toContain(`/claim/${claimToken(config.secret, org(1))}`);
    expect(sent[1].email.text).not.toMatch(/last email/i);
    expect(tables.vendor_outreach[0]).toMatchObject({ status: "followed_up", final_allowed: true });
    // 14 days after the follow-up: not yet.
    r = await run("2026-11-24");
    expect(r.sent).toEqual({ followUps: 0, finals: 0, firsts: 0 });
    // 15 days after: the final note, same link, which still works for 30+ days.
    r = await run("2026-11-25");
    expect(r.sent.finals).toBe(1);
    expect(sent[2].email.subject).toMatch(/^Last note/);
    expect(sent[2].email.text).toMatch(/last email you'll get/);
    expect(sent[2].email.text).toContain(`/claim/${claimToken(config.secret, org(1))}`);
    expect(sent[2].idempotencyKey).toBe(`vendor-claim-final-${org(1)}`);
    expect(tables.vendor_outreach[0]).toMatchObject({ status: "final_sent" });
    expect(tables.outreach_events.map((e) => e.kind)).toEqual(["sent_first", "sent_followup", "sent_final"]);
    expect(new Date(String(tables.vendor_claims[0].expires_at)).getTime()).toBeGreaterThanOrEqual(new Date("2026-12-25T15:00:00Z").getTime());
    // Later: nothing left.
    r = await run("2026-12-20");
    expect(r.sent).toEqual({ followUps: 0, finals: 0, firsts: 0 });
    expect(send).toHaveBeenCalledTimes(3);
  });

  it("never sends a final note to a vendor whose follow-up said it was the last email", async () => {
    listing(1);
    // A follow-up sent before the final note existed: final_allowed stays false.
    tables.vendor_outreach.push({ org_id: org(1), email: "v1@ex.com", status: "followed_up", first_sent_at: "2026-11-02T15:00:00Z", followup_sent_at: "2026-11-10T15:00:00Z", final_allowed: false });
    tables.outreach_events.push({ kind: "sent_first", created_at: "2026-11-02T15:00:00Z" }, { kind: "sent_followup", created_at: "2026-11-10T15:00:00Z" });
    const r = await runOutreach({ db: fakeDb(tables), config, now: new Date("2026-12-01T15:00:00Z"), send, acceptsMail: async () => true }, false);
    expect(r.planned.finals).toBe(0);
    expect(send).not.toHaveBeenCalled();
  });

  it("sends no final note once a vendor claims", async () => {
    listing(1);
    tables.vendor_outreach.push({ org_id: org(1), email: "v1@ex.com", status: "followed_up", first_sent_at: "2026-11-02T15:00:00Z", followup_sent_at: "2026-11-10T15:00:00Z", final_allowed: true });
    tables.org_members.push({ org_id: org(1) });
    const r = await runOutreach({ db: fakeDb(tables), config, now: new Date("2026-12-01T15:00:00Z"), send, acceptsMail: async () => true }, false);
    expect(r.newlyClaimed).toBe(1);
    expect(send).not.toHaveBeenCalled();
    expect(tables.vendor_outreach[0].status).toBe("claimed");
  });

  it("skips claimed listings, suppressed addresses and domains that take no mail", async () => {
    listing(1);
    listing(2);
    listing(3);
    tables.org_members.push({ org_id: org(1) });
    tables.outreach_suppressions.push({ email: "v2@ex.com" });
    const r = await runOutreach({ db: fakeDb(tables), config, send, acceptsMail: async (e) => e !== "v3@ex.com" }, false);
    expect(send).not.toHaveBeenCalled();
    expect(r.skippedInvalid).toEqual(["v3@ex.com"]);
    expect(tables.vendor_outreach).toEqual([expect.objectContaining({ org_id: org(3), status: "invalid" })]);
  });

  it("stops sending a vendor follow-ups once they claim", async () => {
    listing(1);
    const db = fakeDb(tables);
    await runOutreach({ db, config, now: new Date("2026-11-02T15:00:00Z"), send, acceptsMail: async () => true }, false);
    tables.org_members.push({ org_id: org(1) });
    const r = await runOutreach({ db, config, now: new Date("2026-11-10T15:00:00Z"), send, acceptsMail: async () => true }, false);
    expect(r.newlyClaimed).toBe(1);
    expect(r.sent.followUps).toBe(0);
    expect(tables.vendor_outreach[0].status).toBe("claimed");
  });

  it("treats a listing as taken when the vendor signed up separately under the same name", async () => {
    listing(1);
    listing(2);
    // Listing 1 was emailed; then the vendor made their own account instead of claiming.
    tables.vendor_outreach.push({ org_id: org(1), email: "v1@ex.com", status: "sent", first_sent_at: "2026-11-02T15:00:00Z", final_allowed: false });
    tables.outreach_events.push({ kind: "sent_first", created_at: "2026-11-02T15:00:00Z" });
    tables.vendor_profiles.push({ org_id: org(91), business_name: "VENDOR-1", category: "Photography", city: "Miami", status: "published" });
    tables.org_members.push({ org_id: org(91) });
    // Listing 2 was never emailed; its owner also signed up separately.
    tables.vendor_profiles.push({ org_id: org(92), business_name: "vendor 2", category: "Photography", city: "Miami", status: "draft" });
    tables.org_members.push({ org_id: org(92) });

    const r = await runOutreach({ db: fakeDb(tables), config, now: new Date("2026-11-10T15:00:00Z"), send, acceptsMail: async () => true }, false);
    expect(send).not.toHaveBeenCalled();
    expect(r.newlyClaimed).toBe(1);
    expect(tables.vendor_outreach.find((o) => o.org_id === org(1))?.status).toBe("claimed");
    expect(r.planned).toEqual({ followUps: 0, finals: 0, firsts: 0 });
  });

  it("pauses on complaints and sends nothing until resumed", async () => {
    listing(1);
    tables.outreach_events.push(
      ...Array.from({ length: 50 }, () => ({ kind: "sent_first", created_at: "2026-11-01T15:00:00Z" })),
      { kind: "complained", created_at: "2026-11-02T10:00:00Z" },
      { kind: "complained", created_at: "2026-11-02T11:00:00Z" },
    );
    const db = fakeDb(tables);
    let r = await runOutreach({ db, config, now: new Date("2026-11-03T15:00:00Z"), send, acceptsMail: async () => true }, false);
    expect(r.paused).toMatch(/complaints/);
    expect(send).not.toHaveBeenCalled();

    tables.outreach_events.push({ kind: "resumed", created_at: "2026-11-03T16:00:00Z" });
    r = await runOutreach({ db, config, now: new Date("2026-11-04T15:00:00Z"), send, acceptsMail: async () => true }, false);
    expect(r.paused).toBeNull();
    expect(send).toHaveBeenCalledTimes(1);
  });

  it("on a setup error (unverified domain) stops at once and leaves every vendor for the next run", async () => {
    listing(1);
    listing(2);
    const refused = vi.fn(async () => ({ ok: false as const, error: "Resend 403: domain is not verified", scope: "setup" as const }));
    const r = await runOutreach({ db: fakeDb(tables), config, send: refused, acceptsMail: async () => true }, false);
    expect(refused).toHaveBeenCalledTimes(1);
    expect(r.failures).toHaveLength(1);
    expect(tables.vendor_outreach).toHaveLength(0);
  });

  it("skips an address Resend rejects for good, and carries on with the rest", async () => {
    listing(1, { email: "bad@ex.com" });
    listing(2);
    const picky = vi.fn(async (req: SendRequest) =>
      req.to === "bad@ex.com"
        ? { ok: false as const, error: "Resend 422: invalid to", scope: "address" as const }
        : { ok: true as const, messageId: "m-ok" },
    );
    const r = await runOutreach({ db: fakeDb(tables), config, send: picky, acceptsMail: async () => true }, false);
    expect(picky).toHaveBeenCalledTimes(2);
    expect(r.sent.firsts).toBe(1);
    expect(r.skippedInvalid).toEqual(["bad@ex.com"]);
    expect(tables.vendor_outreach.find((o) => o.email === "bad@ex.com")?.status).toBe("invalid");
  });

  it("stops for the day on a rate limit instead of working through the list", async () => {
    listing(1);
    listing(2);
    const failing = vi.fn(async () => ({ ok: false as const, error: "Resend 429", scope: "temporary" as const }));
    const r = await runOutreach({ db: fakeDb(tables), config, send: failing, acceptsMail: async () => true }, false);
    expect(failing).toHaveBeenCalledTimes(1);
    expect(r.failures).toHaveLength(1);
    expect(tables.vendor_outreach).toHaveLength(0); // retried on the next run
  });
});
