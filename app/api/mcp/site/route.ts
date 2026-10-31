import { handleSitePost, keyFromHeader, siteMethodNotAllowed, siteOptions } from "@/lib/mcp/site-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Private site MCP server, key in `Authorization: Bearer`. See lib/mcp/site-handler.ts. */
export function POST(req: Request) {
  return handleSitePost(req, keyFromHeader(req));
}
export const GET = siteMethodNotAllowed;
export const DELETE = siteMethodNotAllowed;
export const OPTIONS = siteOptions;
