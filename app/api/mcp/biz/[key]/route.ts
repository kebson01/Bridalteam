import { bizKeyFromHeader, bizMethodNotAllowed, bizOptions, handleBizPost } from "@/lib/mcp/biz-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Vendor website MCP server, key in the URL (for URL-only clients). See lib/mcp/biz-handler.ts. */
export async function POST(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  return handleBizPost(req, bizKeyFromHeader(req) ?? key);
}
export const GET = bizMethodNotAllowed;
export const DELETE = bizMethodNotAllowed;
export const OPTIONS = bizOptions;
