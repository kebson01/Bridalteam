/**
 * Schema.org structured data builders.
 *
 * Structured data helps Google show richer results and helps AI search engines
 * (ChatGPT, Perplexity, Gemini) understand and cite the site. Kept as plain
 * objects so any page can render one via the <JsonLd> component.
 */
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";
import type { Post } from "@/lib/blog";

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
