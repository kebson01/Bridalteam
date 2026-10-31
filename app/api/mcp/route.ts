import { NextResponse } from "next/server";
import { clientIp } from "@/lib/ai-quota";
import { mcpEnabled } from "@/lib/flags";
import { handleMessage, rpcError, JSONRPC_ERRORS } from "@/lib/mcp/protocol";
import { createTools, type ToolRegistry } from "@/lib/mcp/tools";
import { supabaseVendorSource } from "@/lib/mcp/vendor-source";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bridal Team's public MCP server (Streamable HTTP transport, stateless).
 *
 * Connect an assistant to https://bridalteam.com/api/mcp. Read-only, no
 * sign-in: see lib/mcp/tools.ts for what it offers and lib/mcp/protocol.ts
 * for the protocol handling.
 *
 * Off unless MCP_ENABLED=true (lib/flags.ts); when off the endpoint is a 404.
 *
 * Transport notes:
 *  - POST only. Every request gets one JSON response; the server never opens
 *    an SSE stream, so GET is 405 as the spec allows.
 *  - No sessions: no Mcp-Session-Id is issued, so DELETE is 405 too.
 *  - CORS is open because nothing here is tied to cookies or a user; it lets
 *    browser-based clients such as the MCP Inspector connect.
 */

// Fixed-window per-IP limit, the same shape as /api/track. The app runs as
// one persistent Node process, so a module-level counter is enough to stop a
// looping agent hammering the database. One assistant turn rarely makes more
// than a handful of calls, so 60 a minute is generous.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 60;
const MAX_BODY_BYTES = 64 * 1024;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
  }
  const e = hits.get(ip);
  if (!e || now > e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id",
  "Access-Control-Max-Age": "86400",
};

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { ...CORS, "Cache-Control": "no-store" } });

let registry: ToolRegistry | null = null;
const tools = () => (registry ??= createTools(supabaseVendorSource()));

const notFound = () => new NextResponse(null, { status: 404 });

export async function POST(req: Request) {
  if (!mcpEnabled()) return notFound();

  if (rateLimited(clientIp(req))) {
    return json(rpcError(null, JSONRPC_ERRORS.internal, "Too many requests. Wait a minute and try again."), 429);
  }

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return json(rpcError(null, JSONRPC_ERRORS.invalidRequest, "Request too large."), 413);
  }

  let message: unknown;
  try {
    message = JSON.parse(raw);
  } catch {
    return json(rpcError(null, JSONRPC_ERRORS.parse, "Body is not valid JSON."), 400);
  }

  // JSON-RPC batches were dropped from MCP in 2025-06-18 and no current
  // client sends them.
  if (Array.isArray(message)) {
    return json(rpcError(null, JSONRPC_ERRORS.invalidRequest, "Batch requests are not supported."), 400);
  }

  const response = await handleMessage(message, tools());
  if (response === null) return new NextResponse(null, { status: 202, headers: CORS });
  return json(response);
}

function methodNotAllowed() {
  if (!mcpEnabled()) return notFound();
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
}

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;

export function OPTIONS() {
  if (!mcpEnabled()) return notFound();
  return new NextResponse(null, { status: 204, headers: CORS });
}
