import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * A sitemap that throws takes the whole build down, and this one now talks to
 * Supabase. CI builds pull requests from forks with no secrets and no
 * guaranteed network egress — a property `.github/workflows/ci.yml` states
 * outright and intends to keep — so "the query failed" has to be an ordinary
 * outcome here, not an exception.
 *
 * That is the test worth having. The happy path is easy to eyeball in review;
 * the failure path is invisible until it turns a fork's pull request red for a
 * reason that has nothing to do with its diff.
 */
const select = vi.fn();
vi.mock("@/lib/supabase", () => ({
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_ANON_KEY: "anon",
  supabasePublic: () => ({
    from: () => ({ select: () => ({ eq: select }) }),
  }),
}));

async function urls() {
  const { default: sitemap } = await import("./sitemap");
  return (await sitemap()).map((e) => e.url);
}

beforeEach(() => {
  vi.resetModules();
  select.mockReset();
});

describe("sitemap", () => {
  it("lists every published vendor as its own /v/<org id> entry", async () => {
    select.mockResolvedValue({
      data: [
        { org_id: "aaa", updated_at: "2026-09-01T00:00:00Z" },
        { org_id: "bbb", updated_at: null },
      ],
      error: null,
    });
    const found = await urls();
    expect(found).toContain("https://bridalteam.com/v/aaa");
    expect(found).toContain("https://bridalteam.com/v/bbb");
  });

  it("still carries the static marketing routes alongside them", async () => {
    select.mockResolvedValue({ data: [{ org_id: "aaa", updated_at: null }], error: null });
    const found = await urls();
    expect(found).toContain("https://bridalteam.com/");
    expect(found).toContain("https://bridalteam.com/vendors");
    expect(found).toContain("https://bridalteam.com/for-vendors");
  });

  it("degrades to the static routes when Supabase returns an error", async () => {
    select.mockResolvedValue({ data: null, error: { code: "PGRST301", message: "no" } });
    const found = await urls();
    expect(found).toContain("https://bridalteam.com/");
    expect(found.some((u) => u.includes("/v/"))).toBe(false);
  });

  it("degrades to the static routes when the request throws outright", async () => {
    // What an unreachable Supabase looks like: a rejected fetch, not an error
    // field. This is the shape CI would hit with no egress.
    select.mockRejectedValue(new Error("fetch failed"));
    const found = await urls();
    expect(found).toContain("https://bridalteam.com/");
    expect(found.some((u) => u.includes("/v/"))).toBe(false);
  });

  it("never emits a draft listing's URL", async () => {
    // Belt and braces: RLS already hides drafts from the publishable key, so a
    // draft cannot reach this code. The filter is still asserted, because the
    // cost of it silently going missing is a vendor's unfinished page being
    // handed to Google.
    select.mockResolvedValue({ data: [], error: null });
    expect((await urls()).some((u) => u.includes("/v/"))).toBe(false);
    expect(select).toHaveBeenCalledWith("status", "published");
  });
});
