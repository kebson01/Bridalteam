import JsonLd from "@/components/json-ld";
import { breadcrumbSchema } from "@/lib/structured-data";
import { GUIDES, type Guide } from "@/lib/guides";
import { groupGuides } from "@/lib/guide-sections";
import GuidesLibrary, { GuidesHeader, type GuideCard } from "@/components/guides-library";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  path: "/guides",
  title: "Wedding Planning Guides",
  description:
    "Free, in-depth wedding planning guides — checklists, budgets, venues, vendors, guest lists and timelines to help you plan with confidence.",
});

const card = (g: Guide): GuideCard => ({
  slug: g.slug,
  title: g.title,
  category: g.category,
  readMinutes: g.readMinutes,
  excerpt: g.excerpt,
});

export default function GuidesPage() {
  const sections = groupGuides(GUIDES);
  const groups = {
    flagship: sections.flagship ? card(sections.flagship) : null,
    foundation: sections.foundation.map(card),
    hiring: sections.hiring.map(card),
    logistics: sections.logistics.map(card),
  };

  return (
    <>
      <JsonLd
        data={breadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
        ])}
      />
      <section className="mx-auto max-w-6xl px-5 pb-20 pt-10 sm:pt-14">
        <GuidesHeader count={GUIDES.length} />
        <GuidesLibrary guides={GUIDES.map(card)} groups={groups} />
      </section>
    </>
  );
}
