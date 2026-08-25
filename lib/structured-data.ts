/**
 * Schema.org structured data builders.
 *
 * Structured data helps Google show richer results and helps AI search engines
 * (ChatGPT, Perplexity, Gemini) understand and cite the site. Kept as plain
 * objects so any page can render one via the <JsonLd> component.
 */
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import type { Post } from "@/lib/blog";
import type { Guide, FAQ } from "@/lib/guides";

const LOGO_URL = `${SITE_URL}/icon-512.png`;
const ORG_ID = `${SITE_URL}/#organization`;

/** Public social profiles — mirrors the footer. */
export const SOCIAL_PROFILES = [
  "https://www.instagram.com/bridalteam",
  "https://www.facebook.com/bridalteam",
  "https://www.pinterest.com/bridalteam",
];

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: { "@type": "ImageObject", url: LOGO_URL },
    description: SITE_DESCRIPTION,
    foundingDate: "2012",
    sameAs: SOCIAL_PROFILES,
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-US",
  };
}

/**
 * A published vendor's profile page as a LocalBusiness.
 *
 * These are the pages vendors pay to be found on, and they were the only public
 * page type emitting no structured data at all. LocalBusiness is what lets a
 * florist in Fort Lauderdale surface for "wedding florist near me" with their
 * rating and contact details attached, rather than as an anonymous blue link.
 *
 * Only ever describe a *published* profile — an unclaimed or draft listing must
 * not be presented to search engines as a real business.
 *
 * The vendor's own website is included only when their plan actually links it
 * (entitlements().canLinkSite). Advertising an outbound link in the markup that
 * the page itself withholds would misrepresent what the free tier includes.
 */
export function localBusinessSchema(vendor: {
  orgId: string;
  name: string;
  description?: string | null;
  category?: string | null;
  city?: string | null;
  region?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  image?: string | null;
  reviews?: { rating: number }[];
}) {
  const url = `${SITE_URL}/v/${vendor.orgId}`;
  const ratings = (vendor.reviews ?? [])
    .map((r) => r.rating)
    .filter((n) => typeof n === "number" && n > 0);

  const address =
    vendor.city || vendor.region
      ? {
          "@type": "PostalAddress",
          ...(vendor.city ? { addressLocality: vendor.city } : {}),
          ...(vendor.region ? { addressRegion: vendor.region } : {}),
        }
      : undefined;

  // Google ignores an aggregateRating with no reviews, and inventing one would
  // be a rich-result violation — so it's omitted entirely until a rating exists.
  const aggregateRating = ratings.length
    ? {
        "@type": "AggregateRating",
        ratingValue: +(ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2),
        reviewCount: ratings.length,
        bestRating: 5,
        worstRating: 1,
      }
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${url}#business`,
    name: vendor.name,
    url,
    ...(vendor.description ? { description: vendor.description } : {}),
    ...(vendor.category ? { additionalType: vendor.category } : {}),
    ...(address ? { address } : {}),
    ...(vendor.phone ? { telephone: vendor.phone } : {}),
    ...(vendor.email ? { email: vendor.email } : {}),
    ...(vendor.image ? { image: vendor.image } : {}),
    ...(vendor.website ? { sameAs: [vendor.website] } : {}),
    ...(aggregateRating ? { aggregateRating } : {}),
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

export function blogPostingSchema(post: Post) {
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    articleSection: post.category,
    wordCount: post.body.reduce(
      (n, b) => n + ("p" in b ? b.p.split(/\s+/).length : "ul" in b ? b.ul.join(" ").split(/\s+/).length : 0),
      0,
    ),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

/** Article schema for a planning guide. */
export function guideArticleSchema(guide: Guide) {
  const url = `${SITE_URL}/guides/${guide.slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.excerpt,
    datePublished: guide.updated,
    dateModified: guide.updated,
    articleSection: guide.category,
    keywords: guide.keywords.join(", "),
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: { "@id": ORG_ID },
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
}

/** FAQPage schema — powers Google's FAQ rich results and helps AI answers. */
export function faqSchema(faqs: FAQ[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** BreadcrumbList schema from [name, path] pairs. */
export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
