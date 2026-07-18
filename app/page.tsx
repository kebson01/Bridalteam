import Hero from "@/components/hero";
import Pillars from "@/components/pillars";
import AIPlanner from "@/components/ai-planner";
import Highlights from "@/components/highlights";
import VendorTeaser from "@/components/vendor-teaser";

export default function Home() {
  return (
    <>
      <Hero />
      <Pillars />
      <Highlights />
      <AIPlanner />
      <VendorTeaser />
    </>
  );
}
