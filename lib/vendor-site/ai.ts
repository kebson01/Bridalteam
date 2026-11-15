/**
 * Bridal Team's AI designer for vendor websites: writes (or revises) a whole
 * business site from the vendor's description. The model call and reply
 * parsing are shared with couples' sites (lib/custom-site/ai.ts); only the
 * brief differs. The result is saved as a draft; nothing is public until the
 * vendor publishes and it passes the content check.
 */

import { PLACEHOLDER_GUIDE, type VendorSiteData } from "@/lib/vendor-site/runtime";

export { designSite } from "@/lib/custom-site/ai";

export function buildVendorDesignerPrompt(input: { data: VendorSiteData; request: string; current: string | null }): {
  system: string;
  user: string;
} {
  const d = input.data;
  const details = [
    `Business: ${d.business_name}`,
    d.category && `What they do: ${d.category}`,
    d.location && `Based in: ${d.location}`,
    d.price_range && `Price range: ${d.price_range}`,
    d.about ? `About (shown by data-bt="about"): ${d.about.slice(0, 600)}` : "No about text yet (keep a data-bt=\"about\" section).",
    d.highlights.length ? `Highlights: ${d.highlights.map((h) => h.title).join(", ")}` : null,
    d.packages.length
      ? `Packages (rendered by data-bt="packages"): ${d.packages.map((p) => `${p.name} (${p.price})`).join("; ")}`
      : "No packages yet (wrap the packages section in data-bt-if=\"packages\" so it hides until they add some).",
    `Photos in their gallery: ${d.gallery.length} (rendered by data-bt="gallery").`,
    d.reviews.count ? `Reviews: ${d.rating}` : "No reviews yet (wrap the reviews section in data-bt-if=\"reviews\").",
    d.faqs.length ? `FAQs: ${d.faqs.length} (rendered by data-bt="faqs").` : null,
    d.cover_url ? "They have a cover photo (use data-bt=\"cover\")." : "No cover photo: design so the hero looks good without one.",
    d.socials.length ? `Social links: ${d.socials.map((s) => s.label).join(", ")}.` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const system = `You are Bridal Team's website designer for wedding businesses. You write one complete, beautiful, mobile-first website for a wedding vendor as a single HTML document. Couples planning their wedding are the audience: it should make them trust the business and want to get in touch.

${PLACEHOLDER_GUIDE}

Rules:
- Return ONLY the HTML document, starting with <!doctype html>. No commentary, no markdown fences.
- Everything in one file: inline <style> and (only if useful) inline <script>. Google Fonts and well-known CDNs are fine.
- Use the data-bt placeholders for the business name, about text, packages, photos, reviews, FAQs and contact details instead of typing them in, so the site stays correct when the vendor edits their listing. Wrap optional sections in data-bt-if so empty ones hide.
- Every "contact", "book" or "check availability" button links with data-bt="contact". Never build forms, sign-in boxes, or anything that asks for passwords, card numbers or other personal details.
- Never invent facts: no made-up prices, awards, years in business, client names or testimonials. If you want a line the listing doesn't cover, keep it general and true ("Tell us about your day").
- Accessible: real headings, sufficient contrast, alt text, works at 360px wide.
- Keep it under 60 KB.`;

  const user = input.current
    ? `Here is the vendor's current website:\n\n${input.current.slice(0, 120_000)}\n\nBusiness details:\n${details}\n\nRevise the site as they ask, keeping everything they didn't ask to change. Their request:\n${input.request}`
    : `Business details:\n${details}\n\nDesign their website. Their request:\n${input.request}`;

  return { system, user };
}
