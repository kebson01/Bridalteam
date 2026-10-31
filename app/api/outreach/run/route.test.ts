import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const runOutreach = vi.fn(async (_deps: unknown, dryRun: boolean) => ({ dryRun, paused: null, planned: { followUps: 0, firsts: 3 } }));
vi.mock("@/lib/outreach/run", () => ({ runOutreach }));
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({}) }));

const SECRET = "k".repeat(40);
const KEYS = ["OUTREACH_ENABLED", "OUTREACH_SECRET", "OUTREACH_FROM", "OUTREACH_REPLY_TO", "OUTREACH_MAILING_ADDRESS", "RESEND_API_KEY"];

async function call(query = "", auth: string | null = `Bearer ${SECRET}`) {
  const { POST } = await import("./route");
  return POST(new Request(`https://bridalteam.com/api/outreach/run${query}`, { method: "POST", headers: auth ? { authorization: auth } : {} }));
}

beforeEach(() => {
  vi.resetModules();
  runOutreach.mockClear();
  process.env.OUTREACH_SECRET = SECRET;
});
afterEach(() => KEYS.forEach((k) => delete process.env[k]));

describe("POST /api/outreach/run", () => {
  it("refuses a missing or wrong secret", async () => {
    expect((await call("", null)).status).toBe(401);
    expect((await call("", "Bearer wrong")).status).toBe(401);
    expect(runOutreach).not.toHaveBeenCalled();
  });

  it("sends nothing while OUTREACH_ENABLED is off, but allows a dry run", async () => {
    const off = await call();
    expect((await off.json()).status).toBe("disabled");
    expect(runOutreach).not.toHaveBeenCalled();

    const dry = await call("?dry_run=1");
    expect(dry.status).toBe(200);
    expect(runOutreach).toHaveBeenCalledWith(expect.anything(), true);
  });

  it("won't send without the mailing address and other required settings", async () => {
    process.env.OUTREACH_ENABLED = "true";
    const res = await call();
    expect(res.status).toBe(503);
    expect((await res.json()).missing).toContain("OUTREACH_MAILING_ADDRESS");
    expect(runOutreach).not.toHaveBeenCalled();
  });

  it("runs for real once everything is set", async () => {
    Object.assign(process.env, {
      OUTREACH_ENABLED: "true",
      OUTREACH_FROM: "K <k@outreach.bridalteam.com>",
      OUTREACH_REPLY_TO: "vendors@bridalteam.com",
      OUTREACH_MAILING_ADDRESS: "PO Box 1, Fort Lauderdale, FL",
      RESEND_API_KEY: "re_x",
    });
    const res = await call();
    expect(res.status).toBe(200);
    expect(runOutreach).toHaveBeenCalledWith(expect.anything(), false);
  });
});
