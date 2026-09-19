import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Trusted client IP from proxy headers.
 *
 * `X-Forwarded-For` is a comma-separated chain "client, proxy1, proxy2, …": each
 * proxy appends the address it received the request from. A client can forge the
 * LEFT-most entries, so trusting the left-most (as this used to) let anyone spoof
 * their IP and reset per-IP AI quota at will. Instead we trust the entry the
 * outermost proxy we control actually observed — i.e. count in from the RIGHT by
 * the number of proxies in front of the app.
 *
 * On DigitalOcean (App Platform / a droplet behind their LB) there is one trusted
 * hop, so the right-most entry is the real client — the default. Override with
 * AI_TRUSTED_PROXY_HOPS if you add proxies (e.g. Cloudflare in front → 2).
 */
export function clientIp(req: Request): string {
  const hops = Math.max(1, Number.parseInt(process.env.AI_TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length) return parts[Math.max(0, parts.length - hops)]!;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Global backstop for anonymous AI cost: caps total anon chat calls per day
 * across ALL IPs, so even a flood from rotated/spoofed IPs can't run the
 * Anthropic key up without bound. Defense in depth behind the per-IP metering.
 *
 * Reads with the service-role client (bypasses RLS). Fails OPEN on any error or
 * a non-positive cap — a metering hiccup must never take chat down. Tune with
 * AI_ANON_DAILY_GLOBAL_CAP.
 *
 * The default is 200/day, not 1000. At Claude Sonnet 5 rates a chat turn runs
 * about $0.011, so 1000 was roughly $11/day — sustained, since the window
 * rolls daily rather than monthly — from traffic that is by definition not
 * signed up. 200 caps that near $2/day and is still far more anonymous chat
 * than this site has ever seen in a day.
 *
 * Deliberately a code default rather than a value someone has to remember to
 * set in the environment: an unset variable should land on the safe number.
 * Raise it here or override per-environment once real demand justifies it —
 * and note the window is a rolling 24 hours, so a burst pushes the ceiling out
 * rather than resetting at midnight.
 *
 * Tripping it is not an outage: anonymous callers get a "planner is at
 * capacity, sign up free" reply and signed-in tiers are untouched.
 */
export async function anonChatCeilingExceeded(admin: SupabaseClient): Promise<boolean> {
  const cap = Number.parseInt(process.env.AI_ANON_DAILY_GLOBAL_CAP ?? "200", 10);
  if (!Number.isFinite(cap) || cap <= 0) return false;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await admin
    .from("ai_usage")
    .select("*", { count: "exact", head: true })
    .like("subject", "ip:%")
    .eq("kind", "chat")
    .gt("created_at", since);
  if (error) {
    console.error("anon AI ceiling check failed:", error.code, error.message);
    return false;
  }
  return (count ?? 0) >= cap;
}

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  tier: "anon" | "free" | "paid";
}

/**
 * Checks and consumes one unit of AI quota via the consume_ai_quota RPC.
 *
 * Takes the SERVICE-ROLE client and an explicit user id (null when signed out).
 * This is deliberate. The older 2-arg overload read auth.uid() itself, which
 * meant it had to be executable by `anon` — and therefore callable straight from
 * PostgREST with the publishable key. Each such call inserts an ai_usage row, so
 * roughly a thousand of them would trip the global anonymous ceiling below and
 * switch the planner off for every signed-out visitor for a day. The 3-arg
 * overload is granted to service_role only, so quota rows can only be written by
 * the server, which already derives both the uid and a trusted IP.
 *
 * Fails OPEN (allows the call) if the quota check itself errors — a metering
 * hiccup must never break the product — but that path is logged.
 */
export async function consumeAiQuota(
  admin: SupabaseClient,
  kind: "chat" | "generate",
  ip: string,
  uid: string | null,
): Promise<QuotaResult> {
  const { data, error } = await admin.rpc("consume_ai_quota", {
    p_kind: kind,
    p_ip: ip,
    p_uid: uid,
  });
  if (error) {
    console.error("consume_ai_quota failed:", error.code, error.message);
    return { allowed: true, used: 0, limit: 0, tier: uid ? "free" : "anon" };
  }
  return data as QuotaResult;
}

/**
 * Quota result used when metering can't run at all (no service-role key
 * configured). Fails open for the same reason consumeAiQuota does.
 */
export const QUOTA_UNMETERED: QuotaResult = { allowed: true, used: 0, limit: 0, tier: "free" };
