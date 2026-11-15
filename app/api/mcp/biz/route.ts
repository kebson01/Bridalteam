import { bizKeyFromHeader, bizMethodNotAllowed, bizOptions, handleBizPost } from "@/lib/mcp/biz-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Publishing runs the content check, which can take a while for a page with many photos.
export const maxDuration = 120;

/** Vendor website MCP server, key in `Authorization: Bearer`. See lib/mcp/biz-handler.ts. */
export function POST(req: Request) {
  return handleBizPost(req, bizKeyFromHeader(req));
}
export const GET = bizMethodNotAllowed;
export const DELETE = bizMethodNotAllowed;
export const OPTIONS = bizOptions;
