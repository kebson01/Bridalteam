/**
 * A vendor's social media profiles, stored in vendor_profiles.social_links as
 * { platform: "https://..." }.
 *
 * Vendors type whatever they have: "@djmikecooley", "djmikecooley",
 * "instagram.com/djmikecooley" or a full URL. normalizeSocial() turns each into
 * one canonical https URL on that platform's own domain, and refuses anything
 * else. A link field that accepted any URL would let a listing point couples
 * at an arbitrary site (or a javascript: URL) under an "Instagram" label.
 *
 * The database enforces the same rule (vendor_social_links_ok() in
 * supabase/migrations/20261103150000_vendor_social_links.sql), because vendors
 * can also write their row directly through the API. Keep the domains here and
 * there in step.
 */

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "youtube" | "pinterest" | "x";

export type SocialLinks = Partial<Record<SocialPlatform, string>>;

interface PlatformInfo {
  key: SocialPlatform;
  label: string;
  /** Registrable domains whose URLs are accepted. The first is canonical. */
  domains: string[];
  /** Profile URL for a bare handle. */
  fromHandle: (handle: string) => string;
  placeholder: string;
}

export const SOCIAL_PLATFORMS: readonly PlatformInfo[] = [
  {
    key: "instagram",
    label: "Instagram",
    domains: ["instagram.com"],
    fromHandle: (h) => `https://www.instagram.com/${h}`,
    placeholder: "@yourbusiness",
  },
  {
    key: "facebook",
    label: "Facebook",
    domains: ["facebook.com", "fb.com"],
    fromHandle: (h) => `https://www.facebook.com/${h}`,
    placeholder: "facebook.com/yourbusiness",
  },
  {
    key: "tiktok",
    label: "TikTok",
    domains: ["tiktok.com"],
    fromHandle: (h) => `https://www.tiktok.com/@${h}`,
    placeholder: "@yourbusiness",
  },
  {
    key: "youtube",
    label: "YouTube",
    domains: ["youtube.com"],
    fromHandle: (h) => `https://www.youtube.com/@${h}`,
    placeholder: "@yourchannel",
  },
  {
    key: "pinterest",
    label: "Pinterest",
    domains: ["pinterest.com"],
    fromHandle: (h) => `https://www.pinterest.com/${h}`,
    placeholder: "@yourbusiness",
  },
  {
    key: "x",
    label: "X (Twitter)",
    domains: ["x.com", "twitter.com"],
    fromHandle: (h) => `https://x.com/${h}`,
    placeholder: "@yourbusiness",
  },
];

const HANDLE = /^[A-Za-z0-9._-]{1,100}$/;
const MAX_URL = 300;

function onDomain(host: string, domains: string[]) {
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
}

/**
 * The canonical profile URL for what a vendor typed, null for a blank field,
 * or an error message when it isn't a profile on that platform.
 */
export function normalizeSocial(
  platform: SocialPlatform,
  input: string | null | undefined,
): { url: string | null; error?: undefined } | { url?: undefined; error: string } {
  const info = SOCIAL_PLATFORMS.find((p) => p.key === platform);
  if (!info) return { error: "Unknown platform." };
  const raw = String(input ?? "").trim();
  if (!raw) return { url: null };

  const invalid = { error: `That doesn't look like a ${info.label} handle or link.` };

  // A bare handle: "@name" or "name" with no dots-then-slash URL shape.
  const handle = raw.replace(/^@/, "");
  if (HANDLE.test(handle) && !onDomain(handle.toLowerCase(), info.domains)) {
    return { url: info.fromHandle(handle) };
  }

  let parsed: URL;
  try {
    parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return invalid;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return invalid;
  if (parsed.username || parsed.password || parsed.port) return invalid;
  const host = parsed.hostname.toLowerCase();
  if (!onDomain(host, info.domains)) return invalid;

  const path = parsed.pathname.replace(/\/+$/, "");
  if (!path || path === "/") return invalid; // the platform's homepage, not a profile
  // Facebook's numeric profile pages carry the id in the query string.
  const keepQuery = platform === "facebook" && path === "/profile.php" && parsed.searchParams.get("id");
  const url =
    `https://${host}${path}` + (keepQuery ? `?id=${encodeURIComponent(parsed.searchParams.get("id")!)}` : "");
  if (url.length > MAX_URL || /[\s<>"']/.test(url)) return invalid;
  return { url };
}

/**
 * Reads the stored links, keeping only known platforms with a URL on that
 * platform's domain. Guards the page against a row written before (or around)
 * the database check.
 */
export function readSocialLinks(value: unknown): { platform: SocialPlatform; label: string; url: string }[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  const links = value as Record<string, unknown>;
  const out: { platform: SocialPlatform; label: string; url: string }[] = [];
  for (const info of SOCIAL_PLATFORMS) {
    const url = links[info.key];
    if (typeof url !== "string") continue;
    const checked = normalizeSocial(info.key, url);
    if (checked.url) out.push({ platform: info.key, label: info.label, url: checked.url });
  }
  return out;
}
