import { authorizationServerMetadata } from "@/lib/oauth/core";
import { notFound, oauthAvailable, oauthJson, oauthOptions } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

/** RFC 8414 metadata: the sign-in, token and registration endpoints. */
export function GET() {
  if (!oauthAvailable()) return notFound();
  return oauthJson(authorizationServerMetadata());
}
export const OPTIONS = oauthOptions;
