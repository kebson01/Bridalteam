import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";

/**
 * OAuth 2.1 for the private site MCP server (/api/mcp/site), so a couple can
 * connect ChatGPT or Claude by logging in instead of pasting a site key.
 *
 * ── The design in one paragraph ─────────────────────────────────────────────
 * The access token IS a site key. When the couple approves on /oauth/authorize
 * (signed in, choosing their wedding), we call create_site_key() as them —
 * the same RPC as the "Your own AI" button, with the same can_edit_wedding()
 * check — and hand that key to the assistant through the standard
 * authorization-code + PKCE flow. So nothing about the MCP server, its
 * permissions or revocation changes: the connection shows up in the Website
 * builder's key list labelled with the assistant's name, and revoking it there
 * disconnects the assistant.
 *
 * ── Why there is no new table ───────────────────────────────────────────────
 * Clients and codes are stateless:
 *   client_id  — the registered redirect URIs, HMAC-signed. Dynamic client
 *                registration (RFC 7591) then needs no storage, and nobody can
 *                forge a client with someone else's redirect.
 *   code       — the new site key and everything the token endpoint must check
 *                (client, redirect, PKCE challenge, expiry), AES-256-GCM
 *                encrypted. Short-lived; PKCE means a stolen code is useless
 *                without the verifier only the real client holds.
 *
 * Keys: OAUTH_SECRET (preferred) or, failing that, derived from
 * SUPABASE_SERVICE_ROLE_KEY. Rotating the secret invalidates registered
 * client_ids (clients re-register) but not issued tokens — those are site
 * keys in the database.
 */

export const SCOPE = "site";
export const MCP_RESOURCE_PATH = "/api/mcp/site";
export const CODE_TTL_MS = 5 * 60_000;
const MAX_REDIRECTS = 5;

export const endpoints = () => ({
  issuer: SITE_URL,
  authorization_endpoint: `${SITE_URL}/oauth/authorize`,
  token_endpoint: `${SITE_URL}/api/oauth/token`,
  registration_endpoint: `${SITE_URL}/api/oauth/register`,
});

/** RFC 8414 authorization server metadata. */
export function authorizationServerMetadata() {
  return {
    ...endpoints(),
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: [SCOPE],
    service_documentation: `${SITE_URL}/wedding-website`,
  };
}

/** RFC 9728 protected resource metadata for the site MCP server. */
export function protectedResourceMetadata(resourcePath = MCP_RESOURCE_PATH) {
  return {
    resource: `${SITE_URL}${resourcePath}`,
    authorization_servers: [SITE_URL],
    scopes_supported: [SCOPE],
    bearer_methods_supported: ["header"],
    resource_name: "Bridal Team — Wedding Website",
  };
}

export const resourceMetadataUrl = () => `${SITE_URL}/.well-known/oauth-protected-resource`;

// ── Keys ────────────────────────────────────────────────────────────────────

export class OAuthNotConfiguredError extends Error {}

function masterSecret(): string {
  const s = process.env.OAUTH_SECRET?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!s) throw new OAuthNotConfiguredError("Set OAUTH_SECRET to enable sign-in for assistants.");
  return s;
}

export const oauthConfigured = () => {
  try {
    masterSecret();
    return true;
  } catch {
    return false;
  }
};

const subkey = (purpose: string) => createHmac("sha256", masterSecret()).update(`bridalteam-oauth:${purpose}`).digest();

const b64u = (b: Buffer) => b.toString("base64url");
const unb64u = (s: string) => Buffer.from(s, "base64url");

function safeEqual(a: Buffer, b: Buffer) {
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Redirect URIs ───────────────────────────────────────────────────────────

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** https anywhere, or http on loopback (desktop clients). No fragments. */
export function isAllowedRedirect(raw: string): boolean {
  if (typeof raw !== "string" || raw.length > 2000) return false;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.hash || u.username || u.password) return false;
  if (u.protocol === "https:") return true;
  return u.protocol === "http:" && LOOPBACK.has(u.hostname);
}

/** Hosts we recognise, shown as such on the consent screen. */
const KNOWN_HOSTS: Record<string, string> = {
  "chatgpt.com": "ChatGPT",
  "chat.openai.com": "ChatGPT",
  "claude.ai": "Claude",
  "claude.com": "Claude",
};

export function knownAssistant(redirectUri: string): string | null {
  try {
    const host = new URL(redirectUri).hostname;
    if (LOOPBACK.has(host)) return "an app on this computer";
    return KNOWN_HOSTS[host] ?? null;
  } catch {
    return null;
  }
}

// ── Clients (stateless dynamic registration) ────────────────────────────────

export interface Client {
  name: string;
  redirectUris: string[];
}

export type RegisterResult =
  | { ok: true; client_id: string; client: Client }
  | { ok: false; error: string; error_description: string };

export function registerClient(body: unknown): RegisterResult {
  const b = (body ?? {}) as Record<string, unknown>;
  const uris = Array.isArray(b.redirect_uris) ? b.redirect_uris : [];
  if (uris.length === 0 || uris.length > MAX_REDIRECTS || !uris.every((u) => typeof u === "string" && isAllowedRedirect(u))) {
    return {
      ok: false,
      error: "invalid_redirect_uri",
      error_description: `Send 1–${MAX_REDIRECTS} redirect_uris, each https (or http on localhost) with no fragment.`,
    };
  }
  const method = b.token_endpoint_auth_method;
  if (method !== undefined && method !== "none") {
    return {
      ok: false,
      error: "invalid_client_metadata",
      error_description: "Only public clients are supported: token_endpoint_auth_method must be \"none\" (PKCE is required).",
    };
  }
  const name = (typeof b.client_name === "string" ? b.client_name : "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, 60);
  const client: Client = { name: name || knownAssistant(uris[0] as string) || "AI assistant", redirectUris: uris as string[] };
  return { ok: true, client_id: encodeClient(client), client };
}

export function encodeClient(c: Client): string {
  const payload = b64u(Buffer.from(JSON.stringify({ n: c.name, r: c.redirectUris })));
  const sig = b64u(createHmac("sha256", subkey("client")).update(payload).digest().subarray(0, 16));
  return `btc_${payload}.${sig}`;
}

export function decodeClient(clientId: unknown): Client | null {
  if (typeof clientId !== "string" || clientId.length > 4000) return null;
  const m = clientId.match(/^btc_([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const expected = createHmac("sha256", subkey("client")).update(m[1]).digest().subarray(0, 16);
  if (!safeEqual(unb64u(m[2]), expected)) return null;
  try {
    const { n, r } = JSON.parse(unb64u(m[1]).toString("utf8"));
    if (typeof n !== "string" || !Array.isArray(r) || !r.every((u) => typeof u === "string")) return null;
    return { name: n, redirectUris: r };
  } catch {
    return null;
  }
}

// ── Authorization requests ──────────────────────────────────────────────────

export interface AuthorizeRequest {
  clientId: string;
  client: Client;
  redirectUri: string;
  codeChallenge: string;
  state: string | null;
  resource: string | null;
}

/**
 * Errors split the way RFC 6749 §4.1.2.1 requires: a bad client or redirect
 * must NOT redirect (that would make us an open redirector), so it's shown on
 * our page; anything else goes back to the client's redirect_uri.
 */
export type AuthorizeCheck =
  | { ok: true; request: AuthorizeRequest }
  | { ok: false; showHere: string }
  | { ok: false; redirectTo: string };

export function checkAuthorizeRequest(params: Record<string, string | undefined>): AuthorizeCheck {
  const client = decodeClient(params.client_id);
  if (!client) {
    return { ok: false, showHere: "This connection link isn't valid. Remove the connector in your assistant and add it again." };
  }
  const redirectUri = params.redirect_uri ?? (client.redirectUris.length === 1 ? client.redirectUris[0] : undefined);
  if (!redirectUri || !client.redirectUris.includes(redirectUri)) {
    return { ok: false, showHere: "This connection link doesn't match the assistant that registered it. Add the connector again." };
  }
  const state = params.state ?? null;
  const back = (error: string, description: string) => ({
    ok: false as const,
    redirectTo: withParams(redirectUri, { error, error_description: description, state }),
  });
  if (params.response_type !== "code") return back("unsupported_response_type", "Only response_type=code is supported.");
  if (!params.code_challenge || !/^[A-Za-z0-9_-]{43,128}$/.test(params.code_challenge)) {
    return back("invalid_request", "PKCE is required: send a code_challenge.");
  }
  if ((params.code_challenge_method ?? "plain") !== "S256") {
    return back("invalid_request", "code_challenge_method must be S256.");
  }
  if (params.scope && !params.scope.split(/\s+/).filter(Boolean).every((s) => s === SCOPE)) {
    return back("invalid_scope", `The only scope is "${SCOPE}".`);
  }
  const resource = params.resource ?? null;
  if (resource && !resource.startsWith(`${SITE_URL}${MCP_RESOURCE_PATH}`)) {
    return back("invalid_target", `resource must be ${SITE_URL}${MCP_RESOURCE_PATH}.`);
  }
  return {
    ok: true,
    request: { clientId: params.client_id!, client, redirectUri, codeChallenge: params.code_challenge, state, resource },
  };
}

export function withParams(base: string, params: Record<string, string | null | undefined>): string {
  const u = new URL(base);
  for (const [k, v] of Object.entries(params)) if (v != null) u.searchParams.set(k, v);
  return u.toString();
}

// ── Codes ───────────────────────────────────────────────────────────────────

interface CodePayload {
  k: string; // the site key (becomes the access token)
  c: string; // client_id
  r: string; // redirect_uri
  p: string; // PKCE code_challenge (S256)
  e: number; // expiry, ms since epoch
}

export function issueCode(req: AuthorizeRequest, siteKey: string, now = Date.now()): string {
  const payload: CodePayload = { k: siteKey, c: req.clientId, r: req.redirectUri, p: req.codeChallenge, e: now + CODE_TTL_MS };
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", subkey("code"), iv);
  const body = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return `btcode_${b64u(Buffer.concat([iv, cipher.getAuthTag(), body]))}`;
}

function openCode(code: string): CodePayload | null {
  const m = code.match(/^btcode_([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  const raw = unb64u(m[1]);
  if (raw.length < 29) return null;
  try {
    const decipher = createDecipheriv("aes-256-gcm", subkey("code"), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const json = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
    return JSON.parse(json) as CodePayload;
  } catch {
    return null;
  }
}

export const pkceChallenge = (verifier: string) => b64u(createHash("sha256").update(verifier).digest());

export type TokenResult =
  | { ok: true; body: { access_token: string; token_type: "Bearer"; scope: string } }
  | { ok: false; status: number; body: { error: string; error_description: string } };

/** The token endpoint, minus HTTP. `form` is the urlencoded body. */
export function exchangeCode(form: URLSearchParams, now = Date.now()): TokenResult {
  const fail = (error: string, error_description: string, status = 400): TokenResult => ({
    ok: false,
    status,
    body: { error, error_description },
  });
  if (form.get("grant_type") !== "authorization_code") {
    return fail("unsupported_grant_type", "Only grant_type=authorization_code is supported.");
  }
  const payload = openCode(form.get("code") ?? "");
  if (!payload || payload.e < now) return fail("invalid_grant", "The code is invalid or expired. Start the connection again.");

  const clientId = form.get("client_id");
  if (clientId !== null && clientId !== payload.c) return fail("invalid_grant", "The code was issued to a different client.");
  if (!decodeClient(payload.c)) return fail("invalid_client", "Unknown client.", 401);
  const redirect = form.get("redirect_uri");
  if (redirect !== null && redirect !== payload.r) return fail("invalid_grant", "redirect_uri doesn't match the authorization request.");

  const verifier = form.get("code_verifier") ?? "";
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return fail("invalid_request", "A valid code_verifier is required.");
  if (!safeEqual(Buffer.from(pkceChallenge(verifier)), Buffer.from(payload.p))) {
    return fail("invalid_grant", "code_verifier doesn't match the code_challenge.");
  }
  return { ok: true, body: { access_token: payload.k, token_type: "Bearer", scope: SCOPE } };
}
