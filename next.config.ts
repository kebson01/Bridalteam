import type { NextConfig } from "next";

// Baseline security headers applied to every response. Deliberately excludes a
// Content-Security-Policy: a wrong CSP silently breaks Supabase/Stripe/Anthropic
// and the Next inline runtime, so a CSP should be added and verified in staging
// as a separate change.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/**
 * www -> apex, 308.
 *
 * Both hosts served the same pages, which splits ranking signals between them
 * and is why Google still had a 2019 `www.bridalteam.com/page-sitemap.xml`
 * registered alongside the apex. `SITE_URL`, the canonical tags and the
 * sitemap all name the apex, so www is the one that moves.
 *
 * Written as a config redirect rather than a `proxy.ts` (the Next 16 rename of
 * `middleware.ts`): there is no request logic here, and this form is handled
 * before any route renders.
 *
 * The host is matched literally instead of being derived from `SITE_URL`, so
 * the rule can only ever fire for this one hostname. A preview deployment on
 * some other domain is untouched, which is the point -- a redirect that
 * followed `SITE_URL` would bounce previews at production.
 */
const WWW_HOST = "www.bridalteam.com";
const APEX_ORIGIN = "https://bridalteam.com";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: WWW_HOST }],
        destination: `${APEX_ORIGIN}/:path*`,
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      // Curated inspiration (Pexels) and video posters.
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "videos.pexels.com" },
      // Vendor-uploaded photos in Supabase Storage.
      { protocol: "https", hostname: "yubcwyfhgxjnqydhgjit.supabase.co" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
