/**
 * Canonical public origin, used for metadataBase, canonical URLs, sitemap and
 * robots. bridalteam.net already 301s here, so .com is the canonical host.
 *
 * Override with NEXT_PUBLIC_SITE_URL for preview/staging deployments so they
 * don't advertise production URLs. On Vercel, VERCEL_PROJECT_PRODUCTION_URL is
 * used as a fallback when no explicit value is set.
 */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "https://bridalteam.com";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Bridal Team";

export const SITE_TAGLINE =
  "Fun, simple wedding planning. Organize details. Find ideas. Collaborate with your team.";

export const SITE_DESCRIPTION =
  "Organize details, find ideas, and collaborate with your team — now supercharged with AI. Plan your whole wedding in one place with Bridal Team.";
