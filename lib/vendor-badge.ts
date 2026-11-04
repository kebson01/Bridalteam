import { SITE_URL } from "@/lib/site";

/**
 * The "Find us on Bridal Team" badge vendors put on their own website.
 *
 * Each badge is a plain followed link to the vendor's profile: the point is
 * that couples on the vendor's site can click through, and that search
 * engines see real sites linking to bridalteam.com. The images are static
 * SVGs in public/badges, so a vendor's page loads nothing else from us.
 */

export type BadgeStyle = "light" | "dark";

export const BADGE_IMAGES: Record<BadgeStyle, string> = {
  light: "/badges/bridal-team-badge.svg",
  dark: "/badges/bridal-team-badge-dark.svg",
};

export const BADGE_WIDTH = 200;
export const BADGE_HEIGHT = 56;

const escapeAttr = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function vendorProfileUrl(orgId: string): string {
  return `${SITE_URL}/v/${orgId}`;
}

/** The HTML a vendor pastes into their site. */
export function badgeHtml(orgId: string, businessName: string, style: BadgeStyle = "light"): string {
  const title = escapeAttr(`${businessName} on Bridal Team`);
  return (
    `<a href="${vendorProfileUrl(orgId)}" title="${title}">` +
    `<img src="${SITE_URL}${BADGE_IMAGES[style]}" alt="Find us on Bridal Team" ` +
    `width="${BADGE_WIDTH}" height="${BADGE_HEIGHT}" style="border:0" /></a>`
  );
}
