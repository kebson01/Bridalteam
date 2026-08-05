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
 * AI_ANON_DAILY_GLOBAL_CAP (default 1000/day).
 */
export async function anonChatCeilingExceeded(admin: SupabaseClient): Promise<boolean> {
  const cap = Number.parseInt(process.env.AI_ANON_DAILY_GLOBAL_CAP ?? "1000", 10);
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
 * Checks and consumes one unit of AI quota via the consume_ai_quota RPC. Fails
 * OPEN (allows the call) only if the quota check itself errors — we never want a
 * metering hiccup to break the product — but that path is logged.
 */
export async function consumeAiQuota(
  supabase: SupabaseClient,
  kind: "chat" | "generate",
  ip: string,
): Promise<QuotaResult> {
  const { data, error } = await supabase.rpc("consume_ai_quota", { p_kind: kind, p_ip: ip });
  if (error) {
    console.error("consume_ai_quota failed:", error.code, error.message);
    return { allowed: true, used: 0, limit: 0, tier: "free" };
  }
  return data as QuotaResult;
}
