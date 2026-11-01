import { exchangeCode } from "@/lib/oauth/core";
import { notFound, oauthAvailable, oauthJson, oauthOptions } from "@/lib/oauth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Code + PKCE verifier in, site key out (as the bearer access token). */
export async function POST(req: Request) {
  if (!oauthAvailable()) return notFound();
  const raw = (await req.text()).slice(0, 16_384);
  const type = req.headers.get("content-type") ?? "";
  let form: URLSearchParams;
  if (type.includes("application/json")) {
    try {
      const obj = JSON.parse(raw) as Record<string, unknown>;
      form = new URLSearchParams(Object.entries(obj).map(([k, v]) => [k, String(v)]));
    } catch {
      return oauthJson({ error: "invalid_request", error_description: "Body must be form-encoded." }, 400);
    }
  } else {
    form = new URLSearchParams(raw);
  }
  const result = exchangeCode(form);
  return oauthJson(result.body, result.ok ? 200 : result.status);
}
export const OPTIONS = oauthOptions;
