import { NextResponse } from "next/server";
import { mcpEnabled } from "@/lib/flags";
import { oauthConfigured } from "@/lib/oauth/core";

/** CORS + no-store for the OAuth endpoints, which assistants call from anywhere. */
export const OAUTH_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Mcp-Protocol-Version",
  "Access-Control-Max-Age": "86400",
};

export const oauthJson = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { ...OAUTH_CORS, "Cache-Control": "no-store" } });

/** Sign-in for assistants exists only while the site MCP server does. */
export const oauthAvailable = () => mcpEnabled() && oauthConfigured();

export const notFound = () => new NextResponse(null, { status: 404 });

export function oauthOptions(): Response {
  if (!oauthAvailable()) return notFound();
  return new NextResponse(null, { status: 204, headers: OAUTH_CORS });
}
