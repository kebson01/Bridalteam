/**
 * The Google tag id from NEXT_PUBLIC_GOOGLE_TAG_ID, or undefined when Google
 * Analytics is off. Two shapes are accepted:
 *
 *   GTM-XXXXXXX   a Google Tag Manager / Google tag container (gtm.js). What
 *                 GA's "Install manually" screen hands out for a container.
 *                 Which tags fire (GA4 etc.) is configured in GTM, not here.
 *   G-XXXXXXXXXX  a bare GA4 measurement id (gtag.js), configured in code.
 *
 * Validated so a typo'd or pasted value can't be interpolated into the inline
 * snippet or the script URL. Inlined by Next at build time.
 */
export function parseGoogleTagId(raw: string | undefined): string | undefined {
  const id = raw?.trim().toUpperCase();
  return id && /^(G|GTM)-[A-Z0-9]{4,20}$/.test(id) ? id : undefined;
}

export const GOOGLE_TAG_ID = parseGoogleTagId(process.env.NEXT_PUBLIC_GOOGLE_TAG_ID);

export function isTagManagerId(id: string): boolean {
  return id.startsWith("GTM-");
}

/** The loader script for an id: gtm.js for a container, gtag.js for GA4. */
export function googleTagScriptUrl(id: string): string {
  const file = isTagManagerId(id) ? "gtm.js" : "gtag/js";
  return `https://www.googletagmanager.com/${file}?id=${id}`;
}

/** Hosts the tag loads from and reports to. Listed in the CSP when it's on. */
export const GA_SCRIPT_HOSTS = ["https://www.googletagmanager.com"];
export const GA_CONNECT_HOSTS = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];
