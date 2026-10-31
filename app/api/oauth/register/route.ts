import { registerClient } from "@/lib/oauth/core";
import { notFound, oauthAvailable, oauthJson, oauthOptions } from "@/lib/oauth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** RFC 7591 dynamic client registration. Stateless — see lib/oauth/core.ts. */
export async function POST(req: Request) {
  if (!oauthAvailable()) return notFound();
  let body: unknown;
  try {
    body = JSON.parse((await req.text()).slice(0, 16_384));
  } catch {
    return oauthJson({ error: "invalid_client_metadata", error_description: "Body must be JSON." }, 400);
  }
  const result = registerClient(body);
  if (!result.ok) return oauthJson({ error: result.error, error_description: result.error_description }, 400);
  return oauthJson(
    {
      client_id: result.client_id,
      client_id_issued_at: Math.floor(Date.now() / 1000),
      client_name: result.client.name,
      redirect_uris: result.client.redirectUris,
      grant_types: ["authorization_code"],
      response_types: ["code"],
      token_endpoint_auth_method: "none",
    },
    201,
  );
}
export const OPTIONS = oauthOptions;
