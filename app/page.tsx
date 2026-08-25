import Hero from "@/components/hero";
import Pillars from "@/components/pillars";
import AIPlanner from "@/components/ai-planner";
import Highlights from "@/components/highlights";
import VendorTeaser from "@/components/vendor-teaser";
import GetTheApp from "@/components/get-the-app";
import type { Metadata } from "next";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";
import { SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

// Self-canonical for the homepage. og:url has to be stated here rather than
// inherited: the root layout deliberately no longer carries a page-specific url
// (that inheritance is what canonicalised the whole site to "/"), so a page that
// doesn't declare its own gets none. Title/description still fall through to the
// root layout defaults.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: "Bridal Team — Fun, Simple, AI-Powered Wedding Planning",
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
};

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
