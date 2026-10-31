import { emailLayout } from "@/lib/email";
import { formatDay, SITE_MONTHS_AFTER_WEDDING } from "@/lib/custom-site/retention";
import { SITE_URL } from "@/lib/site";

/** One reminder from public.run_site_retention(). */
export interface RetentionNotice {
  wedding_id: string;
  days: number;
  ends_on: string;
  names: string;
  emails: string[];
}

const escape = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export function reminderEmail(n: RetentionNotice): { subject: string; html: string } {
  const when = formatDay(n.ends_on);
  const builder = `${SITE_URL}/w/${n.wedding_id}/builder`;
  const subject =
    n.days <= 7 ? `Your wedding website comes down in ${n.days} ${n.days === 1 ? "day" : "days"}` : `Your wedding website comes down on ${when}`;
  const html = emailLayout(
    n.names ? `${escape(n.names)}, your wedding website comes down on ${when}` : `Your wedding website comes down on ${when}`,
    `<p>Congratulations again! Bridal Team keeps guest websites up for ${SITE_MONTHS_AFTER_WEDDING} months after the wedding, so yours will be taken down on <strong>${when}</strong>.</p>
     <p>If you'd like to keep a copy of your custom site, open the Website builder and choose <strong>Download my site</strong> before then. Your planning (guests, budget, checklist) stays in your account.</p>`,
    { label: "Open the Website builder", url: builder },
  );
  return { subject, html };
}

