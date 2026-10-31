/**
 * Bridal Team's AI site designer: writes (or revises) a complete custom site
 * from the couple's description. The result is saved as a draft like any
 * other custom site; nothing reaches guests until they publish.
 */

import { PLACEHOLDER_GUIDE, MAX_SITE_BYTES, siteByteLength, type SiteData } from "@/lib/custom-site/runtime";

export function buildDesignerPrompt(input: { data: SiteData; style: string | null; request: string; current: string | null }): {
  system: string;
  user: string;
} {
  const d = input.data;
  const details = [
    `Couple: ${d.names}`,
    d.date_display && `Date: ${d.date_display}`,
    d.location && `Location: ${d.location}`,
    input.style && `Style they chose when signing up: ${input.style}`,
    d.welcome_message && `Their welcome message: ${d.welcome_message}`,
    d.cover_image_url ? "They have a cover photo (use data-bt=\"cover\")." : "No cover photo yet: design so the hero looks good without one.",
    d.registry.length
      ? `Registry links: ${d.registry.map((r) => r.label).join(", ")} (rendered by data-bt="registry").`
      : "No registry links yet (keep a data-bt=\"registry\" section; it stays empty until they add some).",
  ]
    .filter(Boolean)
    .join("\n");

  const system = `You are Bridal Team's wedding website designer. You write one complete, beautiful, mobile-first wedding website as a single HTML document.

${PLACEHOLDER_GUIDE}

Rules:
- Return ONLY the HTML document, starting with <!doctype html>. No commentary, no markdown fences.
- Everything in one file: inline <style> and (only if useful) inline <script>. Google Fonts and well-known CDNs are fine.
- Use the data-bt placeholders for names, date, location, countdown, welcome, cover, registry and RSVP instead of typing those details in, so the site stays correct when the couple edits their details.
- Never build forms, sign-in boxes, or anything that asks guests for passwords, payment or personal details.
- Never invent facts (times, addresses, hotels, dress codes) the couple didn't give you. Leave a short, clearly-marked placeholder line instead, e.g. "Schedule coming soon".
- Accessible: real headings, sufficient contrast, alt text, works at 360px wide.
- Keep it under 60 KB.`;

  const user = input.current
    ? `Here is the couple's current site:\n\n${input.current.slice(0, 120_000)}\n\nCouple details:\n${details}\n\nRevise the site as they ask, keeping everything they didn't ask to change. Their request:\n${input.request}`
    : `Couple details:\n${details}\n\nDesign their wedding website. Their request:\n${input.request}`;

  return { system, user };
}

/** Pulls the HTML document out of a model reply, or null if there isn't one. */
export function extractHtml(reply: string): string | null {
  let s = reply.trim();
  const fence = s.match(/```(?:html)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  const start = s.search(/<!doctype html|<html[\s>]/i);
  if (start === -1) return null;
  s = s.slice(start);
  const end = s.toLowerCase().lastIndexOf("</html>");
  if (end !== -1) s = s.slice(0, end + "</html>".length);
  if (siteByteLength(s) > MAX_SITE_BYTES) return null;
  return s;
}

export async function designSite(prompt: { system: string; user: string }): Promise<
  { ok: true; html: string } | { ok: false; error: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "The AI designer isn't available right now." };
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_SITE_MODEL || process.env.ANTHROPIC_MODEL || "claude-sonnet-5",
        max_tokens: 16000,
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
      }),
      signal: AbortSignal.timeout(170_000),
    });
    if (!res.ok) {
      console.error(`Anthropic site design failed: ${res.status}`, (await res.text().catch(() => "")).slice(0, 400));
      return { ok: false, error: "The AI designer is busy. Please try again in a minute." };
    }
    const data = await res.json();
    const text: string = data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ?? "";
    const html = extractHtml(text);
    if (!html) return { ok: false, error: "The AI didn't return a usable page. Try rephrasing your request." };
    return { ok: true, html };
  } catch (err) {
    console.error("Anthropic site design threw:", err);
    return { ok: false, error: "The AI designer timed out. Please try again." };
  }
}
