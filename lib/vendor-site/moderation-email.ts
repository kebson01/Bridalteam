import { emailLayout } from "@/lib/email";
import { SITE_URL } from "@/lib/site";

/** Emails to a vendor's team when an admin takes their website down or lifts the hold (/admin/vendor-sites). */

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const builder = { label: "Open your Website tab", url: `${SITE_URL}/vendor?tab=website` };

export function vendorTakedownEmail(input: { business: string; reason: string }): { subject: string; html: string } {
  const html = emailLayout(
    "Your website has been taken down",
    `<p>${input.business ? `Hi ${escape(input.business)} team,` : "Hi,"}</p>
     <p>We've taken your Bridal Team website offline because it doesn't follow our content rules:</p>
     <p style="padding:12px 16px;background:#f6f4f1;border-radius:8px;"><strong>${escape(input.reason)}</strong></p>
     <p>Your draft and your listing are safe. Please update your site on the Website tab of your vendor account, then reply to this email or contact us and we'll take another look.</p>`,
    builder,
  );
  return { subject: "Your Bridal Team website has been taken down", html };
}

export function vendorRestoreEmail(input: { business: string }): { subject: string; html: string } {
  const html = emailLayout(
    "You can publish your website again",
    `<p>${input.business ? `Hi ${escape(input.business)} team,` : "Hi,"}</p>
     <p>We've reviewed your website again and lifted the hold, so you can publish it again whenever you're ready.</p>`,
    builder,
  );
  return { subject: "You can publish your Bridal Team website again", html };
}
