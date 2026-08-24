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
