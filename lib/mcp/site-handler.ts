import { NextResponse } from "next/server";
import { clientIp } from "@/lib/ai-quota";
import { mcpEnabled } from "@/lib/flags";
import { handleMessage, rpcError, JSONRPC_ERRORS } from "@/lib/mcp/protocol";
import { createSiteTools, SITE_SERVER_INFO, SITE_SERVER_INSTRUCTIONS } from "@/lib/mcp/site-tools";
import { supabaseSiteSource } from "@/lib/mcp/site-source";
import { supabasePlannerSource, type PlannerSource } from "@/lib/mcp/planner-source";
import { createPlannerTools, PLANNER_INSTRUCTIONS } from "@/lib/mcp/planner-tools";
import type { ToolRegistry } from "@/lib/mcp/tools";
import { resourceMetadataUrl } from "@/lib/oauth/core";
import { oauthAvailable } from "@/lib/oauth/http";

/**
 * Transport for the private site MCP server (/api/mcp/site). Same stateless
 * Streamable HTTP shape as the public server (app/api/mcp/route.ts), plus a
 * site key.
 *
 * The key can arrive two ways, because clients differ:
 *   Authorization: Bearer btsite_…   — Claude Code, Claude Desktop config,
 *                                       Cursor, the MCP Inspector
 *   /api/mcp/site/btsite_…           — clients that only take a URL
 * and a third way to GET one: OAuth sign-in (lib/oauth/core.ts), whose access
 * token is a site key and so arrives as the Bearer header. The 401 below names
 * the resource metadata that starts that flow (RFC 9728), which is what
 * ChatGPT's and Claude's "OAuth" connector option looks for.
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

function wwwAuthenticate(): string {
  const base = 'Bearer realm="bridalteam-site"';
  return oauthAvailable() ? `${base}, resource_metadata="${resourceMetadataUrl()}", scope="site"` : base;
}

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
      { "WWW-Authenticate": wwwAuthenticate() },
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

  // Website keys get the site tools; planner keys (OAuth sign-in) get those
  // plus the rest of the wedding. See lib/mcp/planner-tools.ts.
  const planner = supabasePlannerSource(key);
  const site = createSiteTools(supabaseSiteSource(key));
  const isPlanner = (await keyScope(planner)) === "planner";
  const response = await handleMessage(message, isPlanner ? mergeTools(site, createPlannerTools(planner)) : site, {
    info: isPlanner ? PLANNER_SERVER_INFO : SITE_SERVER_INFO,
    instructions: isPlanner ? `${SITE_SERVER_INSTRUCTIONS} ${PLANNER_INSTRUCTIONS}` : SITE_SERVER_INSTRUCTIONS,
  });
  if (response === null) return new NextResponse(null, { status: 202, headers: CORS });
  return json(response);
}

const PLANNER_SERVER_INFO = { name: "bridalteam-site", title: "Bridal Team — Your Wedding", version: "1.1.0" };

/**
 * A key's scope. Anything that isn't a confirmed planner key — an unknown
 * key, or a database without the planner migration yet — gets the site
 * tools, which already explain an invalid key to the model.
 */
async function keyScope(source: PlannerSource): Promise<"site" | "planner"> {
  try {
    return await source.scope();
  } catch {
    return "site";
  }
}

function mergeTools(...registries: ToolRegistry[]): ToolRegistry {
  const definitions = registries.flatMap((r) => r.definitions);
  return { definitions, byName: new Map(registries.flatMap((r) => [...r.byName])) };
}

export function siteMethodNotAllowed(): Response {
  if (!mcpEnabled()) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
}

export function siteOptions(): Response {
  if (!mcpEnabled()) return new NextResponse(null, { status: 404 });
  return new NextResponse(null, { status: 204, headers: CORS });
}
