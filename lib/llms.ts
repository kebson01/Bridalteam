/**
 * /llms.txt — a plain-Markdown summary of the site for AI assistants.
 *
 * ChatGPT, Claude, Perplexity and Gemini answer "find me a wedding florist in
 * Fort Lauderdale" by fetching a handful of pages and reading them. Our pages
 * are built for people: navigation, scripts, a cookie of client-side state.
 * llms.txt (https://llmstxt.org) is the same facts with all of that stripped
 * out, in one file — who we are, who it is for, what is free, and a link to
 * every listing — so a model that reads only one URL from us still gets the
 * whole picture and the right links to cite.
 *
 * Nothing here should be a claim the site doesn't make itself. An assistant
 * repeats what it reads, and a wrong price or an invented vendor repeated by
 * ChatGPT is worse than not being mentioned.
 *
 * Kept as a pure function of its inputs so it can be tested without Supabase.
 */
import {
  SITE_URL,
  SITE_NAME,
  LAUNCH_METRO,
  LAUNCH_CITY,
} from "@/lib/site";
import { TIERS } from "@/lib/tiers";
import { TOOLS } from "@/lib/tools";
import { GUIDES } from "@/lib/guides";
import { POSTS_BY_DATE } from "@/lib/blog";
import { sortCategories } from "@/lib/categories";

export interface LlmsVendor {
  org_id: string;
  business_name: string;
  category: string | null;
  city: string | null;
  region: string | null;
  description: string | null;
}

/** One line, no Markdown that could break the list, and a sane length. */
function oneLine(text: string, max = 200): string {
  const flat = text.replace(/\s+/g, " ").replace(/[[\]]/g, "").trim();
  return flat.length > max ? `${flat.slice(0, max - 1).trimEnd()}…` : flat;
}

function vendorLine(v: LlmsVendor): string {
  const where = [v.city, v.region].filter(Boolean).join(", ");
  const name = oneLine(v.business_name, 120);
  const parts = [`- [${name}](${SITE_URL}/v/${v.org_id})`];
  const detail = [where, v.description ? oneLine(v.description) : ""].filter(Boolean).join(" — ");
  if (detail) parts.push(`: ${detail}`);
  return parts.join("");
}

function vendorSection(vendors: LlmsVendor[]): string[] {
  if (vendors.length === 0) {
    return [
      "## Wedding vendors",
      "",
      `The vendor directory at ${SITE_URL}/vendors is being built with real, bookable vendors in ${LAUNCH_METRO} and across Florida. Vendors can list their business for free at ${SITE_URL}/for-vendors.`,
    ];
  }

  const lines = [
    "## Wedding vendors",
    "",
    `Published vendor listings, grouped by service. Each link is the vendor's profile on ${SITE_NAME}, with their contact details, photos and reviews. Couples can message vendors from the profile. Full directory: ${SITE_URL}/vendors`,
  ];
  const uncategorised = "Other services";
  const byCategory = new Map<string, LlmsVendor[]>();
  for (const v of vendors) {
    const key = v.category?.trim() || uncategorised;
    byCategory.set(key, [...(byCategory.get(key) ?? []), v]);
  }
  const order = sortCategories(vendors.map((v) => v.category?.trim() || null));
  if (byCategory.has(uncategorised) && !order.includes(uncategorised)) order.push(uncategorised);

  for (const category of order) {
    const group = byCategory.get(category);
    if (!group?.length) continue;
    lines.push("", `### ${category}`, "");
    for (const v of [...group].sort((a, b) => a.business_name.localeCompare(b.business_name))) {
      lines.push(vendorLine(v));
    }
  }
  return lines;
}

export function buildLlmsTxt(vendors: LlmsVendor[]): string {
  const tools = Object.values(TOOLS).map(
    (t) => `- [${t.name}](${SITE_URL}${t.href}): ${t.blurb}`,
  );
  const guides = GUIDES.map(
    (g) => `- [${g.title}](${SITE_URL}/guides/${g.slug}): ${oneLine(g.excerpt)}`,
  );
  const posts = POSTS_BY_DATE.map(
    (p) => `- [${p.title}](${SITE_URL}/blog/${p.slug}): ${oneLine(p.excerpt)}`,
  );

  return [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_NAME} is a free, AI-powered wedding planning app and wedding vendor directory. Couples plan their whole wedding in one place — checklist, budget, guest list and RSVPs, seating chart, wedding website — and find local vendors, starting in ${LAUNCH_METRO} (${LAUNCH_CITY}, Miami, Palm Beach) and across Florida.`,
    "",
    "Key facts:",
    "",
    `- Free for couples: the planning tools and wedding website cost nothing, and the AI planner has a free tier.`,
    `- Vendors (venues, photographers, florists, DJs, caterers, hair and makeup, and more) list for free; optional paid plans are ${TIERS.pro.name} at $${TIERS.pro.priceMonthly}/month and ${TIERS.featured.name} at $${TIERS.featured.priceMonthly}/month. Details: ${SITE_URL}/pricing`,
    `- Works in any web browser and installs as an app on iPhone and Android.`,
    `- Couples can invite their partner, family and wedding party to plan together.`,
    `- Helping couples plan weddings since 2014.`,
    `- Website: ${SITE_URL}`,
    "",
    "## Free wedding planning tools",
    "",
    `- [AI wedding planner](${SITE_URL}/planner): Chat with an AI planning assistant for timelines, budgets, checklists and vendor ideas tailored to your wedding.`,
    ...tools,
    "",
    ...vendorSection(vendors),
    "",
    "## Wedding planning guides",
    "",
    ...guides,
    "",
    "## For wedding vendors",
    "",
    `- [List your business](${SITE_URL}/for-vendors): Free listing in the ${SITE_NAME} directory with a profile page, gallery and inquiries from couples.`,
    `- [Pricing](${SITE_URL}/pricing): Free, ${TIERS.pro.name} and ${TIERS.featured.name} plans for vendors.`,
    "",
    "## Optional",
    "",
    `- [About ${SITE_NAME}](${SITE_URL}/about)`,
    `- [Contact](${SITE_URL}/contact)`,
    `- [Wedding inspiration gallery](${SITE_URL}/inspiration)`,
    ...posts,
    "",
  ].join("\n");
}
