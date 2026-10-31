import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { randomBytes } from "node:crypto";
import { checkAuthorizeRequest, issueCode, pkceChallenge } from "@/lib/oauth/core";

beforeEach(() => {
  vi.stubEnv("MCP_ENABLED", "true");
  vi.stubEnv("OAUTH_SECRET", "route-test-secret");
});
afterEach(() => vi.unstubAllEnvs());

const CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";

describe("OAuth HTTP endpoints", () => {
  it("serve nothing while MCP is off", async () => {
    vi.stubEnv("MCP_ENABLED", "false");
    const { GET } = await import("@/app/.well-known/oauth-authorization-server/route");
    expect(GET().status).toBe(404);
  });

  it("publish discovery metadata", async () => {
    const as = await (await import("@/app/.well-known/oauth-authorization-server/route")).GET().json();
    expect(as.code_challenge_methods_supported).toEqual(["S256"]);
    expect(as.registration_endpoint).toMatch(/\/api\/oauth\/register$/);
    const pr = await (await import("@/app/.well-known/oauth-protected-resource/route")).GET().json();
    expect(pr.resource).toMatch(/\/api\/mcp\/site$/);
    expect(pr.authorization_servers).toEqual([as.issuer]);
    const suffixed = await import("@/app/.well-known/oauth-protected-resource/[...path]/route");
    const ok = await suffixed.GET(new Request("https://x"), { params: Promise.resolve({ path: ["api", "mcp", "site"] }) });
    expect((await ok.json()).resource).toBe(pr.resource);
    const other = await suffixed.GET(new Request("https://x"), { params: Promise.resolve({ path: ["api", "mcp"] }) });
    expect(other.status).toBe(404);
  });

  it("register → token, end to end", async () => {
    const { POST: register } = await import("@/app/api/oauth/register/route");
    const reg = await register(
      new Request("https://bridalteam.com/api/oauth/register", {
        method: "POST",
        body: JSON.stringify({ client_name: "ChatGPT", redirect_uris: [CHATGPT], token_endpoint_auth_method: "none" }),
      }),
    );
    expect(reg.status).toBe(201);
    const { client_id } = await reg.json();

    const verifier = randomBytes(32).toString("base64url");
    const check = checkAuthorizeRequest({
      client_id,
      redirect_uri: CHATGPT,
      response_type: "code",
      code_challenge: pkceChallenge(verifier),
      code_challenge_method: "S256",
    });
    if (!check.ok) throw new Error("authorize failed");
    const key = `btsite_${"c".repeat(48)}`;
    const code = issueCode(check.request, key);

    const { POST: token } = await import("@/app/api/oauth/token/route");
    const res = await token(
      new Request("https://bridalteam.com/api/oauth/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ grant_type: "authorization_code", code, code_verifier: verifier, client_id, redirect_uri: CHATGPT }),
      }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ access_token: key, token_type: "Bearer" });
  });

  it("reject a bad registration", async () => {
    const { POST } = await import("@/app/api/oauth/register/route");
    const res = await POST(new Request("https://x", { method: "POST", body: JSON.stringify({ redirect_uris: ["http://evil.com"] }) }));
    expect(res.status).toBe(400);
  });
});
