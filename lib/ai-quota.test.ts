import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { anonChatCeilingExceeded } from "./ai-quota";

/**
 * This is the only thing standing between a rotated-IP flood and an unbounded
 * Anthropic bill, so the two properties worth pinning are the number and the
 * direction it fails in.
 *
 * Failing OPEN is deliberate: a metering hiccup must not take chat down for
 * everyone. That makes it the kind of safety check that can silently stop
 * working — if a typo turned the cap into NaN, chat would keep serving and
 * nothing would look wrong until the invoice.
 */
function fakeAdmin(result: { count: number | null; error: unknown }) {
  // Mirrors the postgrest builder chain: .from().select().like().eq().gt(),
  // where the last call is awaited.
  const chain: Record<string, unknown> = {
    select: () => chain,
    like: () => chain,
    eq: () => chain,
    gt: () => Promise.resolve(result),
  };
  return { from: () => chain } as unknown as SupabaseClient;
}

const KEY = "AI_ANON_DAILY_GLOBAL_CAP";

describe("anonChatCeilingExceeded", () => {
  let saved: string | undefined;
  beforeEach(() => {
    saved = process.env[KEY];
    delete process.env[KEY];
  });
  afterEach(() => {
    if (saved === undefined) delete process.env[KEY];
    else process.env[KEY] = saved;
  });

  it("defaults to 200 a day, not 1000", async () => {
    // 1000/day was ~$11/day of signed-out traffic at Sonnet 5 rates. The
    // default matters more than the env var: an unset variable has to land on
    // the safe number, because that is the case nobody notices.
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: 199, error: null }))).toBe(false);
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: 200, error: null }))).toBe(true);
  });

  it("trips at the cap, not one past it", async () => {
    process.env[KEY] = "10";
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: 9, error: null }))).toBe(false);
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: 10, error: null }))).toBe(true);
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: 11, error: null }))).toBe(true);
  });

  it("lets the environment raise the ceiling", async () => {
    process.env[KEY] = "5000";
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: 900, error: null }))).toBe(false);
  });

  it("fails open when the count query errors", async () => {
    // Chat staying up is worth more than the backstop during a Supabase blip.
    const admin = fakeAdmin({ count: null, error: { code: "57014", message: "timeout" } });
    expect(await anonChatCeilingExceeded(admin)).toBe(false);
  });

  it("fails open on a disabled or unparseable cap", async () => {
    for (const value of ["0", "-1", "unlimited", ""]) {
      process.env[KEY] = value;
      expect(await anonChatCeilingExceeded(fakeAdmin({ count: 10_000, error: null }))).toBe(false);
    }
  });

  it("treats a null count as zero rather than throwing", async () => {
    expect(await anonChatCeilingExceeded(fakeAdmin({ count: null, error: null }))).toBe(false);
  });
});
