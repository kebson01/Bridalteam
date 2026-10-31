import { describe, expect, it, vi, beforeEach } from "vitest";

const rpc = vi.fn();
let adminAvailable = true;
vi.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: () => (adminAvailable ? { rpc } : null) }));

import { approveForPublish } from "@/lib/custom-site/publish-gate";
import { siteHash } from "@/lib/custom-site/policy";

beforeEach(() => {
  rpc.mockReset();
  adminAvailable = true;
});

describe("approveForPublish", () => {
  it("skips the review when this exact draft was already approved", async () => {
    const review = vi.fn();
    expect(await approveForPublish("w1", { html: "<p>x</p>", approvedHash: siteHash("<p>x</p>") }, review)).toEqual({ ok: true });
    expect(review).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalled();
  });

  it("records the approval with the draft's hash when it passes", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    const r = await approveForPublish("w1", { html: "<p>x</p>", approvedHash: null }, async () => ({ status: "pass" }));
    expect(r).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith("approve_custom_site_draft", { p_wid: "w1", p_hash: siteHash("<p>x</p>") });
  });

  it("explains a failure and doesn't approve", async () => {
    const r = await approveForPublish("w1", { html: "<p>x</p>", approvedHash: null }, async () => ({ status: "fail", reason: "Remove the scam link." }));
    expect(r.ok === false && r.error).toContain("Remove the scam link.");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("blocks when the checker or the service key is unavailable", async () => {
    const down = await approveForPublish("w1", { html: "<p>x</p>", approvedHash: null }, async () => ({ status: "unavailable" }));
    expect(down.ok === false && down.error).toContain("try again in a few minutes");
    adminAvailable = false;
    const noKey = await approveForPublish("w1", { html: "<p>x</p>", approvedHash: null }, async () => ({ status: "pass" }));
    expect(noKey.ok).toBe(false);
  });

  it("asks to publish again if the draft changed during the check", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    const r = await approveForPublish("w1", { html: "<p>x</p>", approvedHash: null }, async () => ({ status: "pass" }));
    expect(r.ok === false && r.error).toContain("changed");
  });
});
