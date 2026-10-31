import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { randomBytes } from "node:crypto";
import {
  checkAuthorizeRequest,
  decodeClient,
  exchangeCode,
  isAllowedRedirect,
  issueCode,
  knownAssistant,
  pkceChallenge,
  registerClient,
  CODE_TTL_MS,
} from "@/lib/oauth/core";

const CHATGPT = "https://chatgpt.com/connector_platform_oauth_redirect";
const KEY = `btsite_${"b".repeat(48)}`;

beforeEach(() => vi.stubEnv("OAUTH_SECRET", "test-secret-please-ignore"));
afterEach(() => vi.unstubAllEnvs());

function register(uris = [CHATGPT], name = "ChatGPT") {
  const r = registerClient({ client_name: name, redirect_uris: uris, token_endpoint_auth_method: "none" });
  if (!r.ok) throw new Error(r.error);
  return r.client_id;
}

function authorize(overrides: Record<string, string | undefined> = {}) {
  const verifier = randomBytes(32).toString("base64url");
  const params = {
    client_id: register(),
    redirect_uri: CHATGPT,
    response_type: "code",
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
    state: "xyz",
    ...overrides,
  };
  return { params, verifier };
}

describe("redirect URIs", () => {
  it("allows https and loopback http only", () => {
    expect(isAllowedRedirect(CHATGPT)).toBe(true);
    expect(isAllowedRedirect("http://localhost:3334/callback")).toBe(true);
    expect(isAllowedRedirect("http://127.0.0.1/cb")).toBe(true);
    expect(isAllowedRedirect("http://evil.com/cb")).toBe(false);
    expect(isAllowedRedirect("javascript:alert(1)")).toBe(false);
    expect(isAllowedRedirect("https://x.com/cb#frag")).toBe(false);
  });

  it("recognises ChatGPT and Claude", () => {
    expect(knownAssistant(CHATGPT)).toBe("ChatGPT");
    expect(knownAssistant("https://claude.ai/api/mcp/auth_callback")).toBe("Claude");
    expect(knownAssistant("https://phish.example/cb")).toBeNull();
  });
});

describe("dynamic client registration", () => {
  it("round-trips a signed client", () => {
    const id = register();
    expect(decodeClient(id)).toEqual({ name: "ChatGPT", redirectUris: [CHATGPT] });
  });

  it("rejects a tampered client_id", () => {
    const id = register();
    const [payload, sig] = id.slice(4).split(".");
    const forged = Buffer.from(JSON.stringify({ n: "ChatGPT", r: ["https://evil.com/cb"] })).toString("base64url");
    expect(decodeClient(`btc_${forged}.${sig}`)).toBeNull();
    expect(decodeClient(`btc_${payload}.AAAA`)).toBeNull();
  });

  it("rejects a client_id signed with another secret", () => {
    const id = register();
    vi.stubEnv("OAUTH_SECRET", "rotated");
    expect(decodeClient(id)).toBeNull();
  });

  it("refuses bad redirects and confidential clients", () => {
    expect(registerClient({ redirect_uris: ["http://evil.com"] }).ok).toBe(false);
    expect(registerClient({ redirect_uris: [] }).ok).toBe(false);
    expect(registerClient({ redirect_uris: [CHATGPT], token_endpoint_auth_method: "client_secret_basic" }).ok).toBe(false);
  });

  it("names an unnamed client after its redirect host", () => {
    const r = registerClient({ redirect_uris: ["https://claude.ai/api/mcp/auth_callback"] });
    expect(r.ok && r.client.name).toBe("Claude");
  });
});

describe("authorize request checks", () => {
  it("accepts a well-formed request", () => {
    expect(checkAuthorizeRequest(authorize().params).ok).toBe(true);
  });

  it("never redirects for an unknown client or unregistered redirect", () => {
    const bad = checkAuthorizeRequest(authorize({ client_id: "btc_x.y" }).params);
    expect(bad.ok === false && "showHere" in bad).toBe(true);
    const wrong = checkAuthorizeRequest(authorize({ redirect_uri: "https://evil.com/cb" }).params);
    expect(wrong.ok === false && "showHere" in wrong).toBe(true);
  });

  it("sends other errors back to the client with state", () => {
    const r = checkAuthorizeRequest(authorize({ code_challenge_method: "plain" }).params);
    expect(r.ok === false && "redirectTo" in r && r.redirectTo).toMatch(/^https:\/\/chatgpt\.com\/.*error=invalid_request.*state=xyz/);
    const noPkce = checkAuthorizeRequest(authorize({ code_challenge: undefined }).params);
    expect(noPkce.ok).toBe(false);
  });
});

describe("token exchange", () => {
  function codeFor(overrides: Record<string, string | undefined> = {}, now = Date.now()) {
    const { params, verifier } = authorize(overrides);
    const check = checkAuthorizeRequest(params);
    if (!check.ok) throw new Error("bad request");
    return { code: issueCode(check.request, KEY, now), verifier, params };
  }
  const form = (o: Record<string, string>) => new URLSearchParams({ grant_type: "authorization_code", ...o });

  it("returns the site key as the access token", () => {
    const { code, verifier, params } = codeFor();
    const r = exchangeCode(form({ code, code_verifier: verifier, client_id: params.client_id, redirect_uri: CHATGPT }));
    expect(r).toEqual({ ok: true, body: { access_token: KEY, token_type: "Bearer", scope: "site" } });
  });

  it("requires the matching PKCE verifier", () => {
    const { code } = codeFor();
    const r = exchangeCode(form({ code, code_verifier: randomBytes(32).toString("base64url") }));
    expect(r.ok === false && r.body.error).toBe("invalid_grant");
  });

  it("rejects expired, tampered and mismatched codes", () => {
    const old = codeFor({}, Date.now() - CODE_TTL_MS - 1000);
    expect(exchangeCode(form({ code: old.code, code_verifier: old.verifier })).ok).toBe(false);

    const { code, verifier } = codeFor();
    const tampered = code.slice(0, -2) + (code.endsWith("A") ? "BB" : "AA");
    expect(exchangeCode(form({ code: tampered, code_verifier: verifier })).ok).toBe(false);
    expect(exchangeCode(form({ code, code_verifier: verifier, redirect_uri: "https://other.example/cb" })).ok).toBe(false);
    expect(exchangeCode(form({ code, code_verifier: verifier, client_id: register(["https://claude.ai/cb"]) })).ok).toBe(false);
  });

  it("refuses other grant types", () => {
    const r = exchangeCode(new URLSearchParams({ grant_type: "refresh_token", refresh_token: "x" }));
    expect(r.ok === false && r.body.error).toBe("unsupported_grant_type");
  });

  it("does not leak the key inside the code", () => {
    const { code } = codeFor();
    expect(code).not.toContain(KEY);
    expect(Buffer.from(code.slice(7), "base64url").toString("latin1")).not.toContain("btsite_");
  });
});
