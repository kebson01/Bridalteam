import { protectedResourceMetadata } from "@/lib/oauth/core";
import { notFound, oauthAvailable, oauthJson, oauthOptions } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

/** RFC 9728: where /api/mcp/site's 401 points assistants to find our sign-in. */
export function GET() {
  if (!oauthAvailable()) return notFound();
  return oauthJson(protectedResourceMetadata());
}
export const OPTIONS = oauthOptions;
