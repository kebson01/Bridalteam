import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Served at /manifest.webmanifest. Next links it from <head> automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Bridal Team — Wedding Planning",
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#f25e00",
    categories: ["lifestyle", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android crops this one to its own shape, so it carries extra padding.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Wedding planner", short_name: "Planner", url: "/planner" },
      { name: "Inspiration", short_name: "Ideas", url: "/inspiration" },
    ],
  };
}
