import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Inspiration photos are hotlinked from Pexels (commercial-use license, no
    // attribution required). See lib/inspiration.ts to swap in your own images.
    remotePatterns: [{ protocol: "https", hostname: "images.pexels.com" }],
  },
};

export default nextConfig;
