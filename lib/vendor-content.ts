/**
 * Whether a vendor's public page has enough on it to ask Google to index.
 *
 * Most listings were imported from public business data and nobody has claimed
 * them yet: a name, a category and a city, with the same fallback description
 * on every one ("Photographer on Bridal Team."). Hundreds of those in the
 * sitemap told Google the site was mostly near-identical shells — the kind of
 * scaled, thin content that drags down how a new domain is judged, guides
 * included. In October 2026 that was 710 of the sitemap's ~755 URLs.
 *
 * So a listing goes to Google once it says something of its own: a real
 * description or a picture. Until then the page stays up for anyone browsing
 * the directory, marked noindex but follow. The pitch in VENDOR-OUTREACH.md
 * still holds and is now literally true — claim your page, fill it in, and it
 * is indexed — rather than indexing an empty shell that would never rank.
 */

/** Shorter than this is a placeholder ("Photographer"), not a description. */
export const MIN_DESCRIPTION_CHARS = 50;

export interface VendorContentFields {
  description?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
}

export function hasIndexableContent(v: VendorContentFields, galleryCount = 0): boolean {
  return (
    (v.description?.trim().length ?? 0) >= MIN_DESCRIPTION_CHARS ||
    Boolean(v.logo_url) ||
    Boolean(v.cover_url) ||
    galleryCount > 0
  );
}
