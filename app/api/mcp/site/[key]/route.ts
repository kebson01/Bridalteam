import { handleSitePost, keyFromHeader, siteMethodNotAllowed, siteOptions } from "@/lib/mcp/site-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Private site MCP server, key in the URL (for URL-only clients). See lib/mcp/site-handler.ts. */
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return handleSitePost(req, keyFromHeader(req) ?? key);
}
export const GET = siteMethodNotAllowed;
export const DELETE = siteMethodNotAllowed;
export const OPTIONS = siteOptions;
