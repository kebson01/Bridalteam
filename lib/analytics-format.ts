/** Display helpers for /admin/analytics. Pure, so they're tested on their own. */

/** 0.1234 -> "12.3%", 0.5 -> "50%", null -> "–". */
export function pct(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "–";
  const p = value * 100;
  const rounded = p >= 10 || p === 0 ? Math.round(p) : Math.round(p * 10) / 10;
  return `${rounded}%`;
}

/** Seconds -> "45s", "3m 05s", "1h 02m"; null or 0 -> "–". */
export function duration(seconds: number | null | undefined): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "–";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
}

/** 12345 -> "12,345". */
export const count = (n: number | null | undefined) => (n ?? 0).toLocaleString("en-US");

/** "2026-11-02" -> "Nov 2". Parsed as a calendar date, so no time zone can shift it a day. */
export function shortDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

/** A page path as a person would say it: "/" -> "Home", grouped ids kept readable. */
export function pageLabel(path: string | null | undefined): string {
  if (!path) return "(unknown)";
  if (path === "/") return "Home";
  return path;
}
