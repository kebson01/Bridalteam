/**
 * Canonical public origin, used for metadataBase, canonical URLs, sitemap and
 * robots. bridalteam.net already 301s here, so .com is the canonical host.
 *
 * Override with NEXT_PUBLIC_SITE_URL for preview/staging deployments so they
 * don't advertise production URLs. Failing that, fall back to whatever host the
 * platform reports: DigitalOcean App Platform (where this deploys) sets APP_URL
 * to the live app URL. VERCEL_PROJECT_PRODUCTION_URL is kept behind it so a
 * preview built on Vercel still names itself rather than claiming to be
 * production; drop that line once nothing deploys there.
 *
 * APP_URL arrives with a scheme and VERCEL_PROJECT_PRODUCTION_URL without one,
 * so normalise both to a bare origin.
 */
function withScheme(host: string): string {
  const trimmed = host.replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, "");

  const platform =
    process.env.APP_URL?.trim() || process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (platform) return withScheme(platform);

  return "https://bridalteam.com";
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Bridal Team";

export const SITE_TAGLINE =
  "Fun, simple wedding planning. Organize details. Find ideas. Collaborate with your team.";

export const SITE_DESCRIPTION =
  "Organize details, find ideas, and collaborate with your team — now supercharged with AI. Plan your whole wedding in one place with Bridal Team.";

/**
 * Per-route metadata builder. Sets a self-referencing canonical plus matching
 * Open Graph / Twitter tags, so each page advertises its own URL and card
 * instead of inheriting the homepage's (the root layout only sets defaults).
 *
 * `path` is root-relative ("/pricing"); it resolves against metadataBase.
 * `ogTitle` defaults to "<title> — Bridal Team" so social cards carry the brand
 * even though the tab-title template isn't applied to Open Graph titles.
 */
export function pageMetadata({
  path,
  title,
  description,
  ogTitle,
  images,
}: {
  path: string;
  title: string;
  description?: string;
  ogTitle?: string;
  images?: string[];
}): import("next").Metadata {
  const socialTitle = ogTitle ?? `${title} — ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: path,
      title: socialTitle,
      description,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(images ? { images } : {}),
    },
  };
}
