/**
 * The contract between a couple's custom site and Bridal Team.
 *
 * A custom site is plain HTML. Before we serve it we inject one small script
 * that (a) exposes the wedding's live details as `window.bridalTeam` and
 * (b) fills any element marked with a `data-bt` attribute. So a site written
 * once — by hand, by our AI, or by the couple's own assistant — keeps showing
 * the right date, names and registry links when they change in the dashboard,
 * without anyone editing the code again.
 *
 * The same guide text is shown to people in the dashboard, sent to our AI
 * designer, and returned to MCP clients, so all three write against one
 * contract. Change PLACEHOLDERS and the runtime together.
 */

export interface SiteData {
  partner_one: string | null;
  partner_two: string | null;
  names: string;
  /** YYYY-MM-DD, or null when no date is set. */
  event_date: string | null;
  date_display: string | null;
  venue: string | null;
  city: string | null;
  region: string | null;
  location: string | null;
  welcome_message: string | null;
  cover_image_url: string | null;
  registry: { label: string; url: string }[];
}

export const PLACEHOLDERS: { attr: string; fills: string }[] = [
  { attr: 'data-bt="names"', fills: "Both names, e.g. “Ana & Ben”" },
  { attr: 'data-bt="partner-one"', fills: "First partner's name" },
  { attr: 'data-bt="partner-two"', fills: "Second partner's name" },
  { attr: 'data-bt="date"', fills: "The wedding date, written out (Saturday, June 6, 2027)" },
  { attr: 'data-bt="countdown"', fills: "“123 days to go” (or “Today’s the day!”)" },
  { attr: 'data-bt="location"', fills: "Venue · City · State" },
  { attr: 'data-bt="venue"', fills: "Venue name" },
  { attr: 'data-bt="welcome"', fills: "The welcome message from the dashboard" },
  { attr: 'data-bt="cover"', fills: "Cover photo: sets src on an <img>, background-image on anything else" },
  {
    attr: 'data-bt="registry"',
    fills: "Registry links, as <a class=\"bt-registry-link\"> elements (style that class). Left alone if it already has children.",
  },
  { attr: 'data-bt="rsvp"', fills: "The RSVP note: replies come through each guest's private invitation link" },
];

/** Plain-text guide for AI prompts and MCP results. */
export const PLACEHOLDER_GUIDE = [
  "Your page is plain HTML: inline CSS/JS, or scripts and stylesheets from cdn.jsdelivr.net, cdnjs.cloudflare.com,",
  "unpkg.com, cdn.tailwindcss.com, code.jquery.com, ajax.googleapis.com or Google Fonts. Images, fonts and video",
  "can come from any https URL; embeds from YouTube, Vimeo or Google Maps. Scripts can't fetch() or call APIs.",
  "Before it goes live, the page is checked against Bridal Team's content policy: no sexual or explicit content,",
  "hate or harassment, scams (never ask guests for passwords or payment details outside a registry or gift fund),",
  "nothing that mocks, attacks or impersonates Bridal Team, and no ads or spam.",
  "Bridal Team fills these attributes with the couple's live details, so prefer them over hard-coding:",
  ...PLACEHOLDERS.map((p) => `  <… ${p.attr}> → ${p.fills}`),
  "For custom scripting, window.bridalTeam holds the same data (names, event_date, date_display, location,",
  "venue, city, region, welcome_message, cover_image_url, registry[{label,url}]); a 'bridalteam:ready' event",
  "fires on document once it has been filled.",
  "Limits: 500 KB total. Host large images elsewhere (https URLs) rather than inlining base64.",
  "The page runs sandboxed: no cookies or localStorage, forms can't submit, and links to other sites open",
  "in a new tab. RSVPs are invite-only, so don't build an RSVP form — use data-bt=\"rsvp\" instead.",
].join("\n");

const RSVP_NOTE =
  "Each invitation has its own private RSVP link. Please reply using the link in your invitation.";

function formatDate(d: string | null): string | null {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return null;
  return new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

const safeUrl = (u: unknown): string | null =>
  typeof u === "string" && /^https?:\/\/[^\s<>"]+$/i.test(u) ? u : null;

export function buildSiteData(w: {
  partner_one?: string | null;
  partner_two?: string | null;
  event_date?: string | null;
  venue?: string | null;
  city?: string | null;
  region?: string | null;
  welcome_message?: string | null;
  cover_image_url?: string | null;
  registry?: { label: string; url: string }[] | null;
}): SiteData {
  const names = [w.partner_one, w.partner_two].filter(Boolean).join(" & ") || "Our Wedding";
  const location = [w.venue, w.city, w.region].filter(Boolean).join(" · ") || null;
  return {
    partner_one: w.partner_one ?? null,
    partner_two: w.partner_two ?? null,
    names,
    event_date: w.event_date ?? null,
    date_display: formatDate(w.event_date ?? null),
    venue: w.venue ?? null,
    city: w.city ?? null,
    region: w.region ?? null,
    location,
    welcome_message: w.welcome_message ?? null,
    cover_image_url: safeUrl(w.cover_image_url),
    registry: (w.registry ?? [])
      .map((r) => ({ label: String(r.label ?? "").slice(0, 80), url: safeUrl(r.url) }))
      .filter((r): r is { label: string; url: string } => Boolean(r.label && r.url)),
  };
}

/**
 * JSON that is safe inside a <script> element: `<` can't close the tag and
 * the two JS-only line terminators can't break the literal.
 */
export function scriptSafeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

// The runtime itself. Kept tiny, dependency-free and defensive: it runs inside
// whatever the couple wrote and must never be the thing that breaks the page.
const RUNTIME = `(function(){var d=window.bridalTeam;if(!d)return;
function t(el,v){if(v!=null&&v!=="")el.textContent=v;}
function days(){if(!d.event_date)return null;var e=new Date(d.event_date+"T00:00:00");var n=new Date();n.setHours(0,0,0,0);var x=Math.round((e-n)/864e5);return x>1?x+" days to go":x===1?"1 day to go":x===0?"Today\\u2019s the day!":"Just married";}
function fill(){var els=document.querySelectorAll("[data-bt]");for(var i=0;i<els.length;i++){var el=els[i];try{switch(el.getAttribute("data-bt")){
case"names":t(el,d.names);break;case"partner-one":t(el,d.partner_one);break;case"partner-two":t(el,d.partner_two);break;
case"date":t(el,d.date_display);break;case"countdown":t(el,days());break;case"location":t(el,d.location);break;
case"venue":t(el,d.venue);break;case"welcome":t(el,d.welcome_message);break;case"rsvp":t(el,d.rsvp_note);break;
case"cover":if(d.cover_image_url){if(el.tagName==="IMG")el.src=d.cover_image_url;else el.style.backgroundImage="url(\\""+d.cover_image_url+"\\")";}break;
case"registry":if(!el.children.length){for(var j=0;j<d.registry.length;j++){var a=document.createElement("a");a.className="bt-registry-link";a.href=d.registry[j].url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=d.registry[j].label;el.appendChild(a);}}break;}}catch(_){}}
try{document.dispatchEvent(new CustomEvent("bridalteam:ready",{detail:d}));}catch(_){}}
document.addEventListener("click",function(ev){var a=ev.target&&ev.target.closest?ev.target.closest("a[href]"):null;if(!a)return;var h=a.getAttribute("href")||"";if(/^https?:/i.test(h)&&!a.target){a.target="_blank";a.rel="noopener noreferrer";}},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fill);else fill();})();`;

export function runtimeScript(data: SiteData): string {
  return `<script>window.bridalTeam=${scriptSafeJson({ ...data, rsvp_note: RSVP_NOTE })};${RUNTIME}</script>`;
}

/**
 * Puts the runtime at the top of <head> (so the couple's own scripts can read
 * window.bridalTeam), wrapping fragments in a minimal document first.
 */
export function injectRuntime(html: string, data: SiteData): string {
  const tag = runtimeScript(data);
  const meta = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
  const head = /<head(\s[^>]*)?>/i;
  const root = /<html(\s[^>]*)?>/i;
  if (head.test(html)) return html.replace(head, (m) => `${m}${tag}`);
  if (root.test(html)) return html.replace(root, (m) => `${m}<head>${meta}${tag}</head>`);
  return `<!doctype html><html><head>${meta}${tag}</head><body>${html}</body></html>`;
}

export const MAX_SITE_BYTES = 512_000;

export function siteByteLength(html: string): number {
  return new TextEncoder().encode(html).length;
}
