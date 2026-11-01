import { describe, it, expect } from "vitest";
import { createHash, createHmac } from "node:crypto";
import { claimToken, tokenHash, verifyUnsubscribe, unsubscribeSignature, bearerMatches } from "./tokens";
import { firstEmail, followUpEmail, type VendorForEmail } from "./templates";
import { planToday, pauseReason, warmupCap, type Candidate } from "./plan";
import { classifyResendEvent, domainAcceptsMail, verifyResendWebhook } from "./delivery";

const SECRET = "x".repeat(40);
const ORG = "11111111-1111-4111-8111-111111111111";

describe("links", () => {
  it("derives the same claim token every time, and stores only its SHA-256 hex", () => {
    const t = claimToken(SECRET, ORG);
    expect(t).toBe(claimToken(SECRET, ORG)); // the follow-up reuses the first email's link
    expect(t).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(claimToken(SECRET, "22222222-2222-4222-8222-222222222222")).not.toBe(t);
    // Must equal what get_claim_preview computes: encode(digest(token, 'sha256'), 'hex').
    expect(tokenHash(t)).toBe(createHash("sha256").update(t).digest("hex"));
  });

  it("accepts only a correctly signed unsubscribe link", () => {
    const s = unsubscribeSignature(SECRET, ORG);
    expect(verifyUnsubscribe(SECRET, ORG, s)).toBe(true);
    expect(verifyUnsubscribe(SECRET, "22222222-2222-4222-8222-222222222222", s)).toBe(false);
    expect(verifyUnsubscribe(SECRET, ORG, s.slice(1))).toBe(false);
    expect(verifyUnsubscribe("", ORG, s)).toBe(false);
  });

  it("checks the run endpoint's bearer token", () => {
    expect(bearerMatches(`Bearer ${SECRET}`, SECRET)).toBe(true);
    expect(bearerMatches("Bearer nope", SECRET)).toBe(false);
    expect(bearerMatches(null, SECRET)).toBe(false);
  });
});

describe("emails", () => {
  const v: VendorForEmail = {
    businessName: "Sunrise <Photo>",
    category: "Photography",
    city: "Fort Lauderdale",
    published: true,
    orgId: ORG,
    email: "hello@sunrise.example",
  };
  const links = { claimUrl: "https://bridalteam.com/claim/abc", unsubscribeUrl: "https://bridalteam.com/unsubscribe?o=1&s=2" };
  const settings = { senderName: "Kebson", mailingAddress: "123 Main St #4, Fort Lauderdale, FL 33301", offerPro: false };

  it("carries everything CAN-SPAM requires, in both parts", () => {
    for (const e of [firstEmail(v, links, settings), followUpEmail(v, links, settings)]) {
      for (const part of [e.text, e.html]) {
        expect(part).toContain("123 Main St #4");
        expect(part).toContain(links.unsubscribeUrl.replace(/&/g, part === e.html ? "&amp;" : "&"));
        expect(part).toContain("hello@sunrise.example");
        expect(part).toContain(links.claimUrl);
      }
    }
  });

  it("is honest about reach and escapes vendor-supplied text in HTML", () => {
    const e = firstEmail(v, links, settings);
    expect(e.text).toMatch(/can't promise you bookings/);
    expect(e.html).toContain("Sunrise &lt;Photo&gt;");
    expect(e.html).not.toContain("<Photo>");
    expect(e.text).toContain(`/v/${ORG}`);
    expect(e.text).toContain("a free listing with us, under Photography in Fort Lauderdale.");
    expect(firstEmail({ ...v, category: null, city: null }, links, settings).text).toContain("a free listing with us.");
  });

  it("only mentions the Pro offer when it is switched on", () => {
    expect(firstEmail(v, links, settings).text).not.toMatch(/Pro/);
    expect(firstEmail(v, links, { ...settings, offerPro: true }).text).toMatch(/Pro plan free for a year/);
  });

  it("doesn't point a draft listing at a page that isn't public", () => {
    const e = firstEmail({ ...v, published: false }, links, settings);
    expect(e.text).not.toContain(`/v/${ORG}`);
    expect(e.text).toMatch(/not public yet/);
  });
});

describe("planning a day", () => {
  const now = new Date("2026-11-10T15:00:00Z");
  const c = (over: Partial<Candidate>): Candidate => ({
    orgId: over.orgId ?? Math.random().toString(36),
    email: over.email ?? `${Math.random().toString(36).slice(2)}@ex.com`,
    businessName: over.businessName ?? "A",
    category: over.category ?? "Photography",
    city: over.city ?? "Miami",
    published: over.published ?? true,
  });
  const base = { followUps: [], blocked: new Set<string>(), suppressed: new Set<string>(), now };

  it("warms up 20 → 35 → 50 a day, never above the configured maximum", () => {
    expect(warmupCap(0, 50)).toBe(20);
    expect(warmupCap(5, 50)).toBe(35);
    expect(warmupCap(10, 50)).toBe(50);
    expect(warmupCap(30, 40)).toBe(40);
  });

  it("works one metro at a time and leaves venues for last", () => {
    const list = [
      c({ businessName: "Orlando Photo", city: "Orlando" }),
      c({ businessName: "Miami Venue", category: "Venue" }),
      c({ businessName: "Miami Florist", category: "Florist" }),
      c({ businessName: "Miami Photo" }),
    ];
    const { firsts } = planToday({ ...base, candidates: list, cap: 10 });
    expect(firsts.map((f) => f.businessName)).toEqual(["Miami Photo", "Miami Florist", "Miami Venue", "Orlando Photo"]);
  });

  it("never emails a blocked, malformed or duplicate address, and respects the cap", () => {
    const list = [
      c({ email: "same@ex.com" }),
      c({ email: "SAME@ex.com" }),
      c({ email: "blocked@ex.com" }),
      c({ email: "not-an-email" }),
      ...Array.from({ length: 30 }, () => c({})),
    ];
    const { firsts } = planToday({ ...base, candidates: list, blocked: new Set(["blocked@ex.com"]), cap: 20 });
    expect(firsts).toHaveLength(20);
    const emails = firsts.map((f) => f.email.toLowerCase());
    expect(new Set(emails).size).toBe(20);
    expect(emails).not.toContain("blocked@ex.com");
    expect(emails).not.toContain("not-an-email");
  });

  it("sends follow-ups first, only after 7 days, and not to suppressed addresses", () => {
    const followUps = [
      { orgId: "a", email: "a@ex.com", firstSentAt: "2026-11-02T15:00:00Z" }, // 8 days
      { orgId: "b", email: "b@ex.com", firstSentAt: "2026-11-05T15:00:00Z" }, // 5 days: not yet
      { orgId: "c", email: "c@ex.com", firstSentAt: "2026-11-01T15:00:00Z" }, // suppressed
    ];
    const plan = planToday({
      ...base,
      candidates: [c({}), c({}), c({})],
      followUps,
      suppressed: new Set(["c@ex.com"]),
      cap: 3,
    });
    expect(plan.followUps.map((f) => f.orgId)).toEqual(["a"]);
    expect(plan.firsts).toHaveLength(2);
  });

  it("pauses on bounces or complaints", () => {
    expect(pauseReason({ sent: 100, bounced: 3, complained: 0 })).toBeNull();
    expect(pauseReason({ sent: 100, bounced: 6, complained: 0 })).toMatch(/bounced/);
    expect(pauseReason({ sent: 20, bounced: 5, complained: 0 })).toBeNull(); // too few to judge
    expect(pauseReason({ sent: 50, bounced: 0, complained: 2 })).toMatch(/complaints/);
  });
});

describe("Resend webhooks", () => {
  const secret = `whsec_${Buffer.from("webhook-key-bytes").toString("base64")}`;
  const body = JSON.stringify({ type: "email.bounced", data: { email_id: "m1", bounce: { type: "Permanent" } } });
  const sign = (id: string, ts: string, b: string) =>
    "v1," + createHmac("sha256", Buffer.from("webhook-key-bytes")).update(`${id}.${ts}.${b}`).digest("base64");
  const now = 1_800_000_000;

  it("accepts a correctly signed, fresh event", () => {
    const ts = String(now);
    expect(verifyResendWebhook(secret, { id: "msg_1", timestamp: ts, signature: sign("msg_1", ts, body) }, body, now)).toBe(true);
  });

  it("rejects tampering, a wrong secret and replays", () => {
    const ts = String(now);
    const sig = sign("msg_1", ts, body);
    expect(verifyResendWebhook(secret, { id: "msg_1", timestamp: ts, signature: sig }, body + " ", now)).toBe(false);
    expect(verifyResendWebhook("whsec_" + Buffer.from("other").toString("base64"), { id: "msg_1", timestamp: ts, signature: sig }, body, now)).toBe(false);
    expect(verifyResendWebhook(secret, { id: "msg_1", timestamp: ts, signature: sig }, body, now + 600)).toBe(false);
  });

  it("suppresses on hard bounces and complaints only", () => {
    expect(classifyResendEvent({ type: "email.bounced", data: { bounce: { type: "Permanent" } } })).toEqual({ kind: "bounced", suppress: true });
    expect(classifyResendEvent({ type: "email.bounced", data: { bounce: { type: "Transient" } } })).toEqual({ kind: "soft_bounced" });
    expect(classifyResendEvent({ type: "email.bounced" })).toEqual({ kind: "bounced", suppress: true });
    expect(classifyResendEvent({ type: "email.complained" })).toEqual({ kind: "complained", suppress: true });
    expect(classifyResendEvent({ type: "email.delivered" })).toEqual({ kind: "delivered" });
    expect(classifyResendEvent({ type: "contact.created" })).toBeNull();
  });
});

describe("MX check", () => {
  it("treats a missing domain as undeliverable but a DNS outage as deliverable", async () => {
    const fail = (code: string) => async () => { throw Object.assign(new Error(code), { code }); };
    expect(await domainAcceptsMail("a@ex.com", async () => [{ exchange: "mx.ex.com", priority: 10 }])).toBe(true);
    expect(await domainAcceptsMail("a@gone.example", fail("ENOTFOUND"))).toBe(false);
    expect(await domainAcceptsMail("a@ex.com", fail("ETIMEOUT"))).toBe(true);
    expect(await domainAcceptsMail("no-at-sign", async () => [])).toBe(false);
  });
});
