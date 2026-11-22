/**
 * GA4 measurement id (G-XXXXXXXXXX), or undefined when Google Analytics is off.
 *
 * Validated so a typo'd or pasted value can't be interpolated into the inline
 * gtag snippet or the script URL. Inlined by Next at build time.
 */
export function parseMeasurementId(raw: string | undefined): string | undefined {
  const id = raw?.trim();
  return id && /^G-[A-Z0-9]{4,20}$/.test(id) ? id : undefined;
}

export const GA_MEASUREMENT_ID = parseMeasurementId(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID);

/** Hosts gtag.js loads from and reports to. Listed in the CSP when GA is on. */
export const GA_SCRIPT_HOSTS = ["https://www.googletagmanager.com"];
export const GA_CONNECT_HOSTS = [
  "https://www.googletagmanager.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];
