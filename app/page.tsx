import Hero from "@/components/hero";
import Pillars from "@/components/pillars";
import AIPlanner from "@/components/ai-planner";
import Highlights from "@/components/highlights";
import VendorTeaser from "@/components/vendor-teaser";
import { SHOW_VENDOR_DIRECTORY } from "@/lib/flags";

export default function Home() {
  return (
    <>
      <Hero />
      <Pillars />
      <Highlights />
      <AIPlanner />
      {SHOW_VENDOR_DIRECTORY && <VendorTeaser />}
    </>
  );
}
