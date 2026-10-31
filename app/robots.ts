import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * AI crawlers and assistants, named explicitly.
 *
 * The "*" rule below already lets them in, so this changes nothing about what
 * they may fetch today. It is here so that stays true: these are the agents
 * behind ChatGPT search, Claude, Perplexity, Gemini and Apple Intelligence,
 * and being readable by them is now how couples asking an assistant "who are
 * good wedding photographers in Fort Lauderdale" find our vendors. Listing
 * them makes that a decision someone has to undo on purpose, rather than
 * something a tightened "*" rule could switch off by accident.
 *
 * A crawler that matches a named group ignores the "*" group entirely, so each
 * group carries the same disallow list — never give one an allow without it.
 *
 * Grouped by purpose, so each line reads as what it buys:
 * - search indexes that decide whether we are cited in AI answers,
 * - user-triggered fetches when someone asks an assistant about a page,
 * - training crawlers, which shape what models already know about us.
 */
export const AI_CRAWLERS = [
  // AI search indexes
  "OAI-SearchBot",
  "Claude-SearchBot",
  "PerplexityBot",
  // Fetches made on a user's behalf
  "ChatGPT-User",
  "Claude-User",
  "Perplexity-User",
  // Training / model knowledge
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  // /vendors used to be disallowed here, from back when the page 404'd behind
  // SHOW_VENDOR_DIRECTORY. It no longer reads that flag: it is a public page
  // with an honest empty state, and it sits in the primary navigation as "Find
  // Vendors". Blocking a linked, indexable page was the odd one out, so it is
  // allowed again. SHOW_VENDOR_DIRECTORY now only controls the homepage teaser.
  // /claim/<token> carries its own credential in the URL: a claim link in a
  // search result is a claim link anyone can use. The pages also set
  // robots: { index: false }, but that only helps once a crawler has already
  // fetched the URL, which is exactly what we would rather it never did.
  const disallow = ["/admin", "/api/", "/claim"];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow },
      { userAgent: AI_CRAWLERS, allow: "/", disallow },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
