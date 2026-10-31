import { emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

/** Admin moderation helpers: the search box, and emails to a couple when an admin takes their guest website down or restores it. */

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function takedownEmail(input: { weddingId: string; names: string; reason: string }): { subject: string; html: string } {
  const html = emailLayout(
    "Your wedding website has been taken down",
    `<p>${input.names ? `Hi ${escape(input.names)},` : "Hi,"}</p>
     <p>We've taken your Bridal Team guest website offline because it doesn't follow our content rules:</p>
     <p style="padding:12px 16px;background:#f6f4f1;border-radius:8px;"><strong>${escape(input.reason)}</strong></p>
     <p>Your draft and the rest of your planning are safe. Please update your site in the Website builder, then reply to this email or contact us and we'll take another look.</p>`,
    { label: "Open the Website builder", url: `${SITE_URL}/w/${input.weddingId}/builder` },
  );
  return { subject: "Your wedding website has been taken down", html };
}

export function restoreEmail(input: { weddingId: string; names: string }): { subject: string; html: string } {
  const html = emailLayout(
    "You can publish your wedding website again",
    `<p>${input.names ? `Hi ${escape(input.names)},` : "Hi,"}</p>
     <p>We've reviewed your site again and lifted the hold, so you can turn your guest website back on and publish again whenever you're ready.</p>`,
    { label: "Open your Website tab", url: `${SITE_URL}/w/${input.weddingId}/website` },
  );
  return { subject: "You can publish your wedding website again", html };
}

/** "https://bridalteam.com/wedding/gene-and-john?x" → "gene-and-john"; plain text is kept. */
export function searchTerm(raw: string): string {
  const fromUrl = raw.match(/\/wedding\/([a-z0-9-]+)/i);
  const term = (fromUrl ? fromUrl[1] : raw).trim().toLowerCase();
  // PostgREST or-filters use , ( ) as syntax; keep only what names and addresses use.
  return term.replace(/[^a-z0-9 '\-]/g, "").slice(0, 80);
}
