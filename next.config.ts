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

const nextConfig: NextConfig = {
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
