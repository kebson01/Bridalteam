/**
 * Feature flags.
 *
 * SHOW_VENDOR_DIRECTORY — surfaces the *entry points* to /vendors: the footer
 * link and the homepage teaser. It no longer gates the page itself.
 *
 * It was originally an all-or-nothing hide, because /vendors then rendered the
 * `vendors` table, which holds seeded sample data (invented business names, no
 * websites, no images) that would have read as real listings. That page now
 * reads `vendor_profiles` and shows only rows a vendor published themselves —
 * so with nothing published it shows an honest empty state instead of fiction,
 * and is safe to leave reachable. The seeded `vendors` table survives only
 * behind /admin/venues; nothing public renders it.
 *
 * Set NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY=true to advertise the directory in the
 * nav and on the homepage once there are real listings worth sending people to.
 *
 * Note this is read at build time (NEXT_PUBLIC_*), so flipping it requires
 * a rebuild/redeploy, not just an env change on a running server.
 */
export const SHOW_VENDOR_DIRECTORY =
  process.env.NEXT_PUBLIC_SHOW_VENDOR_DIRECTORY === "true";

/**
 * SHOW_COMMUNITY — surfaces the *entry points* to /community: the primary nav
 * link and the sitemap entry.
 *
 * Same reasoning as SHOW_VENDOR_DIRECTORY, and the same shape deliberately.
 * /community is reachable and renders an honest empty state ("No posts yet —
 * be the first to share something"), which is fine for someone who arrives on
 * purpose and actively harmful as a tab in the header: a visitor who clicks it
 * learns, in one page load, that nobody else is here. That is the single
 * clearest "leave now" signal a new marketplace can send, and it was being
 * sent to every visitor before they had seen anything else.
 *
 * So the page stays; the advertisement stops. Flip this to true once the feed
 * has enough real posts to be worth a click — roughly 30 is the number in
 * COUPLES-ACQUISITION.md — not when the feature merely works.
 *
 * Read at build time (NEXT_PUBLIC_*), so flipping it needs a redeploy.
 */
export const SHOW_COMMUNITY = process.env.NEXT_PUBLIC_SHOW_COMMUNITY === "true";

/**
 * MCP_ENABLED — turns on the public MCP server at /api/mcp (app/api/mcp/route.ts),
 * which lets assistants such as Claude and ChatGPT search the vendor directory,
 * split a budget, plan tables, build a dated checklist and read the guides.
 *
 * Off by default so it ships dark: set MCP_ENABLED=true in the environment to
 * open it. Unlike the NEXT_PUBLIC_* flags above this is read per request on
 * the server, so flipping it needs a restart, not a rebuild. While it is off,
 * /api/mcp answers 404 as though it did not exist.
 */
export function mcpEnabled(): boolean {
  return process.env.MCP_ENABLED === "true";
}
