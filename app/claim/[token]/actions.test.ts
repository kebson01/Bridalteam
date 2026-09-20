import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * The claim action is the last gate on an outreach link, and the interesting
 * behaviour is in which failures a vendor is allowed to read.
 *
 * "You already have a workspace" tells someone exactly what to do next (sign
 * up with a separate email); "Something went wrong" tells them to give up. The
 * RPC writes those messages for a vendor's eyes, so the passthrough list is a
 * real feature and not a convenience — and it has to stay a *list*, because
 * passing every error through would leak PostgREST internals to a stranger
 * holding a link.
 */
const rpc = vi.fn();
const getUser = vi.fn();
const redirect = vi.fn(() => {
  throw new Error("NEXT_REDIRECT");
});

vi.mock("@/lib/supabase/server", () => ({
  supabaseServer: async () => ({ rpc, auth: { getUser } }),
}));
vi.mock("next/navigation", () => ({ redirect }));

async function claim(token = "tok") {
  const { claimListing } = await import("./actions");
  return claimListing(token, { error: null }, new FormData());
}

beforeEach(() => {
  vi.resetModules();
  rpc.mockReset();
  getUser.mockReset();
  redirect.mockClear();
  getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
});

describe("claimListing", () => {
  it("asks an anonymous visitor to sign in first", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await claim()).error).toMatch(/sign in/i);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("sends the token from the route, not from the form", async () => {
    // The token is the entire authorization. Reading it from a form field
    // would let another page post one of its choosing.
    rpc.mockResolvedValue({ data: "org-1", error: null });
    await claim("abc123").catch(() => {});
    expect(rpc).toHaveBeenCalledWith("claim_vendor_listing", { p_token: "abc123" });
  });

  it("lands the vendor in their account on success", async () => {
    rpc.mockResolvedValue({ data: "org-1", error: null });
    await claim().catch(() => {});
    expect(redirect).toHaveBeenCalledWith("/vendor");
  });

  it.each([
    ["That listing has already been claimed"],
    ["That claim link has expired"],
    ["That claim link is not valid"],
    ["This account already has a workspace. Sign up with a separate email for your business."],
  ])("passes through the actionable message: %s", async (message) => {
    rpc.mockResolvedValue({ data: null, error: { code: "P0001", message } });
    expect((await claim()).error).toBe(message);
  });

  it("does not leak an unexpected database error to the vendor", async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { code: "42P01", message: 'relation "vendor_claims" does not exist' },
    });
    const { error } = await claim();
    expect(error).toBe("Something went wrong. Please try again.");
    expect(error).not.toMatch(/vendor_claims/);
  });

  it("does not redirect when the RPC returns nothing", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    expect((await claim()).error).toMatch(/not valid/i);
    expect(redirect).not.toHaveBeenCalled();
  });
});
