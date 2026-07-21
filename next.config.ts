import type { NextConfig } from "next";

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
};

export default nextConfig;
