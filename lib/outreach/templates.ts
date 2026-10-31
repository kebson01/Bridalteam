import { SITE_URL } from "@/lib/site";
import { TIERS } from "@/lib/tiers";

/**
 * The two campaign emails: the first message and the one follow-up.
 *
 * Written to VENDOR-OUTREACH.md's rules: honest about reach (no promised
 * bookings), short, one clear action, and an easy way out. Plain text is the
 * main part; the HTML part is the same words with links, no images, no
 * tracking pixels of our own (Resend's open tracking is a setting on the
 * domain, off by default), so it reads like a note from a person rather than
 * a newsletter.
 *
 * Every message carries what CAN-SPAM requires: who it's from, why they got
 * it, a working unsubscribe link and a physical postal address.
 */

export interface VendorForEmail {
  businessName: string;
  category: string | null;
  city: string | null;
  /** Published listings have a public page to point at; drafts don't. */
  published: boolean;
  orgId: string;
  email: string;
}

export interface EmailLinks {
  claimUrl: string;
  unsubscribeUrl: string;
}

export interface EmailSettings {
  senderName: string;
  mailingAddress: string;
  offerPro: boolean;
}

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** "under Photography in Fort Lauderdale"-style phrase, from whatever is known. */
function describe(v: VendorForEmail): string {
  const where = v.city ? ` in ${v.city}` : "";
  return v.category ? `, under ${v.category}${where}` : where;
}

const pageUrl = (v: VendorForEmail) => `${SITE_URL}/v/${v.orgId}`;

function proOffer(s: EmailSettings): string | null {
  if (!s.offerPro) return null;
  return (
    `Because you'd be one of our first vendors, claiming also gets you our Pro plan free for a year ` +
    `(normally $${TIERS.pro.priceMonthly} a month): couples can message you through your page, ` +
    `you can see how many people view it, and you can add as many photos as you like.`
  );
}

function footer(v: VendorForEmail, l: EmailLinks, s: EmailSettings): { text: string; html: string } {
  const why =
    `You're getting this because ${v.email} is the public contact address for ${v.businessName}. ` +
    `We send one email and at most one follow-up.`;
  return {
    text: `--\n${why}\nUnsubscribe or remove your listing: ${l.unsubscribeUrl}\nBridal Team, ${s.mailingAddress}`,
    html:
      `<hr style="border:none;border-top:1px solid #ddd;margin:28px 0 12px">` +
      `<p style="font-size:12px;color:#777;line-height:1.5">${esc(why)}<br>` +
      `<a href="${esc(l.unsubscribeUrl)}" style="color:#777">Unsubscribe or remove your listing</a><br>` +
      `Bridal Team, ${esc(s.mailingAddress)}</p>`,
  };
}

function wrap(paragraphs: string[], foot: string): string {
  return (
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#222;max-width:560px">` +
    paragraphs.map((p) => `<p style="margin:0 0 14px">${p}</p>`).join("") +
    foot +
    `</div>`
  );
}

const link = (href: string, label: string) => `<a href="${esc(href)}" style="color:#d35400">${esc(label)}</a>`;

export function firstEmail(v: VendorForEmail, l: EmailLinks, s: EmailSettings): RenderedEmail {
  const name = v.businessName;
  const offer = proOffer(s);
  const foot = footer(v, l, s);

  const intro =
    `I'm ${s.senderName}, and I run Bridal Team, a wedding planning site for couples in Florida. ` +
    `${name} already has a free listing with us${describe(v)}.`;
  const listingText = v.published
    ? `Here's your page as couples see it: ${pageUrl(v)}`
    : `Your page is ready but not public yet. Claim it to check the details and publish it.`;
  const claimText =
    `Claiming it is free, needs no card and takes a couple of minutes. You can fix anything we got wrong ` +
    `and add a description and photos:`;
  const honest =
    `To be straight with you: we're new, so I can't promise you bookings. What you get is a page you ` +
    `control, listed in our directory and visible to Google, at no cost.`;
  const out = `If you'd rather not be listed at all, use the link at the bottom and we'll take your page down.`;

  const text = [
    `Hi ${name} team,`,
    intro,
    listingText,
    `${claimText}\n${l.claimUrl}`,
    honest,
    ...(offer ? [offer] : []),
    out,
    `${s.senderName}\nBridal Team · bridalteam.com`,
    foot.text,
  ].join("\n\n");

  const html = wrap(
    [
      `Hi ${esc(name)} team,`,
      esc(intro),
      v.published
        ? `Here's your page as couples see it: ${link(pageUrl(v), pageUrl(v).replace(/^https?:\/\//, ""))}`
        : esc(listingText),
      `${esc(claimText)}<br>${link(l.claimUrl, `Claim ${name}'s page`)}`,
      esc(honest),
      ...(offer ? [esc(offer)] : []),
      esc(out),
      `${esc(s.senderName)}<br>Bridal Team · ${link(SITE_URL, "bridalteam.com")}`,
    ],
    foot.html,
  );

  return { subject: `${name} is on Bridal Team. Want to claim it?`, text, html };
}

export function followUpEmail(v: VendorForEmail, l: EmailLinks, s: EmailSettings): RenderedEmail {
  const name = v.businessName;
  const foot = footer(v, l, s);
  const body1 = `Just following up once on my note last week. Your free page on Bridal Team is still waiting for you:`;
  const body2 =
    `Claiming it lets you correct your details and add photos. It's free and needs no card.` +
    (s.offerPro ? ` The free year of Pro I mentioned still stands.` : "");
  const body3 = `If it's not for you, no problem. This is the last email you'll get from me about it.`;

  const text = [
    `Hi ${name} team,`,
    `${body1}\n${l.claimUrl}`,
    body2,
    body3,
    `${s.senderName}\nBridal Team · bridalteam.com`,
    foot.text,
  ].join("\n\n");

  const html = wrap(
    [
      `Hi ${esc(name)} team,`,
      `${esc(body1)}<br>${link(l.claimUrl, `Claim ${name}'s page`)}`,
      esc(body2),
      esc(body3),
      `${esc(s.senderName)}<br>Bridal Team · ${link(SITE_URL, "bridalteam.com")}`,
    ],
    foot.html,
  );

  return { subject: `Following up: ${name} on Bridal Team`, text, html };
}
