import { redirect } from "next/navigation";

/**
 * Surfacing failures from server actions.
 *
 * These actions mutate through Supabase and let RLS decide permission, which
 * means a refused write comes back as an error — or as zero rows — rather than
 * an exception. Until now every one of them logged to the server and returned
 * silently, so a failure was indistinguishable from a no-op: you clicked "Build
 * my starter budget", nothing appeared, and nothing told you why.
 *
 * The fix keeps the existing shape (plain server actions in forms, no client
 * state) and leans on the query-param flash the vendor billing page already
 * uses: on failure, bounce back to the page carrying a message, which the page
 * renders. Success is untouched — no redirect, no extra navigation.
 *
 * Messages are written for the couple, not the console. The Supabase code and
 * message still go to the server log for us.
 */

/** Query key carrying a flash message back to a page. */
export const FLASH_KEY = "err";

/**
 * Logs the underlying failure and bounces back to `path` with a readable
 * message. Never returns — `redirect()` throws, so call it last.
 */
export function failWith(
  path: string,
  message: string,
  cause?: { code?: string; message?: string } | null,
): never {
  if (cause) console.error(`${path} failed:`, cause.code, cause.message);
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${FLASH_KEY}=${encodeURIComponent(message)}`);
}

/**
 * Reads a flash message out of a page's searchParams.
 *
 * Length-capped and returned as plain text — it is rendered as a string, never
 * as markup, so a crafted URL can't inject anything, and can't be used to paste
 * a wall of text into someone's page.
 */
export function flashFrom(
  params: Record<string, string | string[] | undefined> | undefined,
): string | null {
  const raw = params?.[FLASH_KEY];
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return null;
  return value.slice(0, 200);
}
