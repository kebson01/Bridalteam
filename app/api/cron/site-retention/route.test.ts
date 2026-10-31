import { describe, expect, it, vi, beforeEach } from "vitest";

const rpc = vi.fn();
const sendEmail = vi.fn();
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => ({ rpc }) }));
vi.mock("@/lib/email", async (orig) => ({ ...(await orig<typeof import("@/lib/email")>()), sendEmail: (...a: unknown[]) => sendEmail(...a) }));

import { POST } from "./route";

const SECRET = "s".repeat(40);
const req = (auth?: string) =>
  new Request("https://bridalteam.com/api/cron/site-retention", { method: "POST", headers: auth ? { authorization: auth } : {} });

beforeEach(() => {
  rpc.mockReset();
  sendEmail.mockReset();
  process.env.CRON_SECRET = SECRET;
});

describe("POST /api/cron/site-retention", () => {
  it("hides itself without the right secret", async () => {
    expect((await POST(req())).status).toBe(404);
    expect((await POST(req("Bearer wrong"))).status).toBe(404);
    process.env.CRON_SECRET = "short";
    expect((await POST(req("Bearer short"))).status).toBe(404);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("runs retention and emails each reminder", async () => {
    rpc.mockResolvedValue({
      data: {
        trimmed: 4,
        ended: 1,
        notices: [{ wedding_id: "w1", days: 30, ends_on: "2027-12-06", names: "Ana & Ben", emails: ["a@example.com", "b@example.com"] }],
      },
      error: null,
    });
    sendEmail.mockResolvedValue({ sent: true });
    const res = await POST(req(`Bearer ${SECRET}`));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ trimmed: 4, ended: 1, reminders: 1, emails_sent: 2, emails_failed: 0 });
    expect(rpc).toHaveBeenCalledWith("run_site_retention");
    expect(sendEmail.mock.calls.map((c) => (c[0] as { to: string }).to)).toEqual(["a@example.com", "b@example.com"]);
  });
});
