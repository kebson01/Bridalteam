import { NextResponse } from "next/server";
import { clientIp } from "@/lib/ai-quota";
import { mcpEnabled } from "@/lib/flags";
import { handleMessage, rpcError, JSONRPC_ERRORS } from "@/lib/mcp/protocol";
import { createSiteTools, SITE_SERVER_INFO, SITE_SERVER_INSTRUCTIONS } from "@/lib/mcp/site-tools";
import { supabaseSiteSource } from "@/lib/mcp/site-source";

/**
 * Transport for the private site MCP server (/api/mcp/site). Same stateless
 * Streamable HTTP shape as the public server (app/api/mcp/route.ts), plus a
 * site key.
 *
 * The key can arrive two ways, because clients differ:
 *   Authorization: Bearer btsite_…   — Claude Code, Claude Desktop config,
 *                                       Cursor, the MCP Inspector
 *   /api/mcp/site/btsite_…           — clients that only take a URL (custom
 *                                       connectors in Claude and ChatGPT)
 * The URL form puts the secret in access logs; the site builder says so and
 * offers revocation. Bodies are larger than the public server's because a
 * whole page travels in save_site_draft.
 */

export const KEY_PATTERN = /^btsite_[0-9a-f]{48}$/;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const MAX_BODY_BYTES = 768 * 1024;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(subject: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  const e = hits.get(subject);
  if (!e || now > e.resetAt) {
    hits.set(subject, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store", ...extra } });

export function keyFromHeader(req: Request): string | null {
  const m = req.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i);
  return m ? m[1] : null;
}

export async function handleSitePost(req: Request, key: string | null): Promise<Response> {
  if (!mcpEnabled()) return new NextResponse(null, { status: 404 });

  if (!key || !KEY_PATTERN.test(key)) {
    return json(
      rpcError(null, JSONRPC_ERRORS.invalidRequest, "A Bridal Team site key is required. Create one in your dashboard under Website builder → Your own AI."),
      401,
      { "WWW-Authenticate": 'Bearer realm="bridalteam-site"' },
    );
  }

  if (rateLimited(`${clientIp(req)}|${key.slice(-8)}`)) {
    return json(rpcError(null, JSONRPC_ERRORS.internal, "Too many requests. Wait a minute and try again."), 429);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json(rpcError(null, JSONRPC_ERRORS.invalidRequest, "Request too large. Keep pages under 500 KB."), 413);
  }
  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return json(rpcError(null, JSONRPC_ERRORS.parse, "Body is not valid JSON."), 400);
  }
  if (Array.isArray(message)) {
    return json(rpcError(null, JSONRPC_ERRORS.invalidRequest, "Batch requests are not supported."), 400);
  }

  const response = await handleMessage(message, createSiteTools(supabaseSiteSource(key)), {
    info: SITE_SERVER_INFO,
    instructions: SITE_SERVER_INSTRUCTIONS,
  });
  if (response === null) return new NextResponse(null, { status: 202, headers: CORS });
  return json(response);
}

export function siteMethodNotAllowed(): Response {
  if (!mcpEnabled()) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
}

export function siteOptions(): Response {
  if (!mcpEnabled()) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 204, headers: CORS });
}
