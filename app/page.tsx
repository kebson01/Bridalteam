import SiteHeader from "@/components/site-header";
import Hero from "@/components/hero";
import Pillars from "@/components/pillars";
import AIPlanner from "@/components/ai-planner";
import Highlights from "@/components/highlights";
import VendorTeaser from "@/components/vendor-teaser";
import SiteFooter from "@/components/site-footer";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Pillars />
        <Highlights />
        <AIPlanner />
        <VendorTeaser />
      </main>
      <SiteFooter />
    </>
  );
}
