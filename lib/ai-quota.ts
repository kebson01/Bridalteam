import type { SupabaseClient } from "@supabase/supabase-js";

/** Best-effort client IP from proxy headers (DigitalOcean sets x-forwarded-for). */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
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
