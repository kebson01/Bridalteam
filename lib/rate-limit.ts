import type { supabaseServer } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof supabaseServer>>;

/** Per-action limits: at most `max` creations per `windowSeconds` per user. */
export const RATE_LIMITS = {
  post: { max: 6, windowSeconds: 300 }, // 6 posts / 5 min
  comment: { max: 20, windowSeconds: 300 }, // 20 comments / 5 min
  group: { max: 5, windowSeconds: 600 }, // 5 groups / 10 min
  event: { max: 5, windowSeconds: 600 }, // 5 events / 10 min
} as const;

type LimitConfig = { max: number; windowSeconds: number };

/**
 * Lightweight per-user rate limit. Counts how many rows this user created in
 * `table` within the sliding window and returns true if they are at/over the
 * limit.
 *
 * Deliberately schema-free: it reuses each table's existing `created_at`
 * column, so it adds no migration and is safe against a shared database.
 * Runs as the signed-in user (RLS-safe — a user can always count their own
 * rows) and fails OPEN: a transient DB error never blocks a legitimate post.
 */
export async function overRateLimit(
  supabase: ServerClient,
  table: string,
  column: string,
  userId: string,
  { max, windowSeconds }: LimitConfig,
): Promise<boolean> {
  const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
  const { count, error } = await supabase
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq(column, userId)
    .gte("created_at", since);
  if (error) {
    console.error(`rate-limit check failed for ${table}:`, error.code, error.message);
    return false; // fail open
  }
  return (count ?? 0) >= max;
}
