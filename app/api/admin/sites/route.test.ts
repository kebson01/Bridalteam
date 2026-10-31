import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const rpc = vi.fn();
const sendEmail = vi.fn();
let authorized = true;
vi.mock("@/lib/admin-auth", () => ({
  adminGuard: async () => (authorized ? { rpc } : NextResponse.json({ error: "Not authorized." }, { status: 401 })),
  adminUsername: async () => "kebson",
}));
vi.mock("@/lib/email", async (orig) => ({ ...(await orig<typeof import("@/lib/email")>()), sendEmail: (...a: unknown[]) => sendEmail(...a) }));

import { POST } from "./route";

const ID = "10000000-0000-0000-0000-000000000001";
const post = (body: unknown) =>
  new Request("https://bridalteam.com/api/admin/sites", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  rpc.mockReset();
  sendEmail.mockReset();
  authorized = true;
});

describe("POST /api/admin/sites", () => {
  it("requires an admin", async () => {
    authorized = false;
    expect((await POST(post({ wedding_id: ID, action: "takedown", reason: "x" }))).status).toBe(401);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("requires a reason to take a site down", async () => {
    const res = await POST(post({ wedding_id: ID, action: "takedown", reason: "  " }));
    expect(res.status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects unknown actions and ids", async () => {
    expect((await POST(post({ wedding_id: "nope", action: "takedown", reason: "x" }))).status).toBe(400);
    expect((await POST(post({ wedding_id: ID, action: "delete", reason: "x" }))).status).toBe(400);
  });

  it("takes the site down, logs the admin and emails the couple the reason", async () => {
    rpc.mockResolvedValue({ data: { names: "Ana & Ben", slug: "ana-and-ben", emails: ["a@example.com"] }, error: null });
    sendEmail.mockResolvedValue({ sent: true });
    const res = await POST(post({ wedding_id: ID, action: "takedown", reason: "Sexual or explicit content: gallery" }));
    expect(await res.json()).toEqual({ ok: true, action: "takedown", emailed: 1, notified: 1 });
    expect(rpc).toHaveBeenCalledWith("admin_take_down_site", {
      p_wid: ID,
      p_reason: "Sexual or explicit content: gallery",
      p_admin: "kebson",
    });
    const mail = sendEmail.mock.calls[0][0] as { to: string; subject: string; html: string };
    expect(mail.to).toBe("a@example.com");
    expect(mail.subject).toContain("taken down");
    expect(mail.html).toContain("Sexual or explicit content: gallery");
  });

  it("restores with an optional note", async () => {
    rpc.mockResolvedValue({ data: { names: "", slug: null, emails: [] }, error: null });
    const res = await POST(post({ wedding_id: ID, action: "restore", reason: "" }));
    expect(await res.json()).toEqual({ ok: true, action: "restore", emailed: 0, notified: 0 });
    expect(rpc).toHaveBeenCalledWith("admin_restore_site", { p_wid: ID, p_note: null, p_admin: "kebson" });
  });

  it("explains a restore of a site that isn't taken down", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "22023", message: "this site is not taken down" } });
    const res = await POST(post({ wedding_id: ID, action: "restore" }));
    expect(res.status).toBe(409);
    expect((await res.json()).error).toBe("this site is not taken down");
  });
});
