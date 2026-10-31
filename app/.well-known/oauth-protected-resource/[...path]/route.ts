import { MCP_RESOURCE_PATH, protectedResourceMetadata } from "@/lib/oauth/core";
import { notFound, oauthAvailable, oauthJson, oauthOptions } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

/**
 * The path-suffixed form (RFC 9728 §3.1): clients that skip the 401 header
 * look for /.well-known/oauth-protected-resource/api/mcp/site. Only the site
 * server (and its URL-key form) is protected; the public /api/mcp is open.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!oauthAvailable()) return notFound();
  const path = `/${(await params).path.join("/")}`;
  if (path !== MCP_RESOURCE_PATH) return notFound();
  return oauthJson(protectedResourceMetadata(path));
}
export const OPTIONS = oauthOptions;
