import Hero from "@/components/hero";
import Pillars from "@/components/pillars";
import AIPlanner from "@/components/ai-planner";
import Highlights from "@/components/highlights";
import VendorTeaser from "@/components/vendor-teaser";
import GetTheApp from "@/components/get-the-app";
import type { Metadata } from "next";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";

// Self-canonical for the homepage; title/description/OG fall through to the
// root layout defaults.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <>
      <Hero />
      <Pillars />
      <Highlights />
      <AIPlanner />
      {SHOW_VENDOR_DIRECTORY && <VendorTeaser />}
      <GetTheApp />
    </>
  );
}
