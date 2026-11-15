/**
 * The contract between a vendor's website and their Bridal Team listing.
 *
 * Same idea as couples' sites (lib/custom-site/runtime.ts): a vendor site is
 * plain HTML, and before we serve it we inject one small script that exposes
 * the listing as `window.bridalTeam` and fills every element marked with a
 * `data-bt` attribute. A site written once, by a theme, our AI, by hand or
 * by the vendor's own assistant, keeps showing their current packages,
 * photos, reviews and contact details as they edit the listing, without
 * anyone touching the code again.
 *
 * The runtime only ever sets textContent, src, href and background images
 * from data, never HTML, so listing text can't inject markup.
 *
 * The guide text below goes to people in the dashboard, our AI designer and
 * MCP clients alike. Change PLACEHOLDERS and the runtime together.
 */

import { SITE_URL } from "@/lib/site";
import { priceTierLabel } from "@/lib/vendor-extras";
import { readSocialLinks } from "@/lib/social";
import { scriptSafeJson } from "@/lib/custom-site/runtime";

export { MAX_SITE_BYTES, siteByteLength } from "@/lib/custom-site/runtime";

/** What the database's _vendor_site_payload() returns. */
export interface VendorSitePayload {
  org_id: string;
  business_name: string;
  category?: string | null;
  description?: string | null;
  city?: string | null;
  region?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  social_links?: unknown;
  price_tier?: number | null;
  highlights?: unknown;
  packages?: unknown;
  faqs?: unknown;
  listing_published?: boolean;
  gallery?: { image_url?: string | null; title?: string | null; media_type?: string | null; media_url?: string | null }[];
  reviews?: { count?: number; average?: number | string | null; items?: { author_name?: string; rating?: number; body?: string }[] };
}

export interface VendorSiteData {
  business_name: string;
  category: string | null;
  about: string | null;
  city: string | null;
  region: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  socials: { label: string; url: string }[];
  price_range: string | null;
  highlights: { title: string; detail: string | null }[];
  packages: { name: string; price: string; description: string | null; includes: string[]; featured: boolean }[];
  faqs: { q: string; a: string }[];
  gallery: { image_url: string; title: string; video_url: string | null }[];
  reviews: { count: number; average: number | null; items: { author: string; rating: number; body: string }[] };
  rating: string | null;
  logo_url: string | null;
  cover_url: string | null;
  /** Their Bridal Team listing, where couples can message them and read reviews. */
  listing_url: string;
  contact_url: string;
  year: number;
}

export const PLACEHOLDERS: { attr: string; fills: string }[] = [
  { attr: 'data-bt="business-name"', fills: "The business name" },
  { attr: 'data-bt="category"', fills: "What they do, e.g. “DJ” or “Florist”" },
  { attr: 'data-bt="about"', fills: "The “About your business” text from the listing" },
  { attr: 'data-bt="location"', fills: "City, State" },
  { attr: 'data-bt="price-range"', fills: "$ to $$$$ (hidden if not set)" },
  { attr: 'data-bt="rating"', fills: "“4.9 ★ · 23 reviews” (empty when there are no reviews yet)" },
  { attr: 'data-bt="phone"', fills: "Phone number; on an <a> it also becomes a tel: link" },
  { attr: 'data-bt="email"', fills: "Contact email; on an <a> it also becomes a mailto: link" },
  { attr: 'data-bt="website"', fills: "On an <a>: links to their own website" },
  { attr: 'data-bt="contact"', fills: "On an <a>: links to the message form on their Bridal Team listing (the way couples get in touch)" },
  { attr: 'data-bt="listing"', fills: "On an <a>: links to their Bridal Team listing" },
  { attr: 'data-bt="cover"', fills: "Cover photo (the listing cover, else their newest photo): src on an <img>, background-image on anything else" },
  { attr: 'data-bt="logo"', fills: "Logo: sets src on an <img>" },
  { attr: 'data-bt="socials"', fills: "Social links, as <a class=\"bt-social-link\"> elements" },
  { attr: 'data-bt="highlights"', fills: "Highlights, as <li class=\"bt-highlight\"><strong>title</strong><span>detail</span></li>" },
  {
    attr: 'data-bt="packages"',
    fills:
      "Packages, as <article class=\"bt-package\"> (add .bt-featured to the most requested) with <h3>, <p class=\"bt-price\">, <p class=\"bt-desc\"> and <ul> of what's included",
  },
  { attr: 'data-bt="faqs"', fills: "FAQs, as <details class=\"bt-faq\"><summary>question</summary><p>answer</p></details>" },
  { attr: 'data-bt="gallery"', fills: "Their photos, as <figure class=\"bt-gallery-item\"><img></figure> (videos link out)" },
  { attr: 'data-bt="reviews"', fills: "Recent reviews, as <blockquote class=\"bt-review\"><p>text</p><cite>name · ★★★★★</cite></blockquote>" },
  { attr: 'data-bt="year"', fills: "The current year, for a footer" },
  {
    attr: 'data-bt-if="packages|faqs|gallery|reviews|highlights|socials|about|phone|email|website|price-range|rating"',
    fills: "Put on a whole section: it's hidden when that part of the listing is empty",
  },
];

/** Plain-text guide for AI prompts and MCP results. */
export const PLACEHOLDER_GUIDE = [
  "The website is plain HTML: inline CSS/JS, or scripts and stylesheets from cdn.jsdelivr.net, cdnjs.cloudflare.com,",
  "unpkg.com, cdn.tailwindcss.com, code.jquery.com, ajax.googleapis.com or Google Fonts. Images, fonts and video",
  "can come from any https URL; embeds from YouTube, Vimeo or Google Maps. Scripts can't fetch() or call APIs.",
  "Before it goes live, the page is checked against Bridal Team's content policy: no sexual or explicit content,",
  "hate or harassment, scams (never ask visitors for passwords or card details), nothing that mocks, attacks or",
  "impersonates Bridal Team, and no ads for anything other than this business.",
  "Bridal Team fills these attributes from the vendor's live listing, so use them instead of typing the details in:",
  ...PLACEHOLDERS.map((p) => `  <… ${p.attr}> → ${p.fills}`),
  "For custom scripting, window.bridalTeam holds the same data (business_name, category, about, location, phone,",
  "email, website, socials, price_range, highlights, packages, faqs, gallery, reviews, rating, cover_url, logo_url,",
  "listing_url, contact_url); a 'bridalteam:ready' event fires on document once it has been filled.",
  "Limits: 500 KB total. Host large images elsewhere (https URLs) rather than inlining base64.",
  "The page runs sandboxed: no cookies or localStorage, forms can't submit, and links to other sites open in a new",
  "tab. Don't build a contact form: link a button to data-bt=\"contact\", which opens the vendor's message form on",
  "Bridal Team.",
].join("\n");

const safeUrl = (u: unknown): string | null =>
  typeof u === "string" && /^https?:\/\/[^\s<>"]+$/i.test(u) ? u : null;
const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s || null;
};
const arr = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object") : [];

export function buildVendorSiteData(p: VendorSitePayload, now = new Date()): VendorSiteData {
  const listing = `${SITE_URL}/v/${p.org_id}`;
  const gallery = (p.gallery ?? [])
    .map((g) => {
      const image = safeUrl(g.image_url);
      if (!image) return null;
      return {
        image_url: image,
        title: str(g.title, 160) ?? "",
        video_url: g.media_type && g.media_type !== "photo" ? safeUrl(g.media_url) : null,
      };
    })
    .filter((g): g is VendorSiteData["gallery"][number] => g !== null);

  const count = Math.max(0, Number(p.reviews?.count ?? 0) || 0);
  const avg = p.reviews?.average == null ? null : Number(p.reviews.average);
  const average = avg !== null && Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null;

  const packages = arr(p.packages)
    .map((x) => {
      const name = str(x.name, 60);
      if (!name) return null;
      const price = typeof x.price === "number" && x.price > 0 ? `From $${x.price.toLocaleString("en-US")}` : "Ask for a quote";
      return {
        name,
        price,
        description: str(x.description, 400),
        includes: (Array.isArray(x.includes) ? x.includes : [])
          .map((i) => str(i, 120))
          .filter((i): i is string => Boolean(i))
          .slice(0, 10),
        featured: x.featured === true,
      };
    })
    .filter((x): x is VendorSiteData["packages"][number] => x !== null)
    .sort((a, b) => Number(b.featured) - Number(a.featured));

  return {
    business_name: str(p.business_name, 160) ?? "Our business",
    category: str(p.category, 80),
    about: str(p.description, 2000),
    city: str(p.city, 100),
    region: str(p.region, 100),
    location: [p.city, p.region].map((x) => str(x, 100)).filter(Boolean).join(", ") || null,
    phone: str(p.phone, 40),
    email: typeof p.email === "string" && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(p.email.trim()) ? p.email.trim() : null,
    website: safeUrl(p.website),
    socials: readSocialLinks(p.social_links).map((s) => ({ label: s.label, url: s.url })),
    price_range: priceTierLabel(p.price_tier),
    highlights: arr(p.highlights)
      .map((h) => {
        const title = str(h.title, 40);
        return title ? { title, detail: str(h.detail, 60) } : null;
      })
      .filter((h): h is VendorSiteData["highlights"][number] => h !== null),
    packages,
    faqs: arr(p.faqs)
      .map((f) => {
        const q = str(f.q, 200);
        const a = str(f.a, 1000);
        return q && a ? { q, a } : null;
      })
      .filter((f): f is { q: string; a: string } => f !== null),
    gallery,
    reviews: {
      count,
      average,
      items: (p.reviews?.items ?? [])
        .map((r) => {
          const body = str(r.body, 600);
          const rating = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0)));
          return body ? { author: str(r.author_name, 60) ?? "A couple", rating, body } : null;
        })
        .filter((r): r is VendorSiteData["reviews"]["items"][number] => r !== null),
    },
    rating: count && average ? `${average.toFixed(1)} ★ · ${count} review${count === 1 ? "" : "s"}` : null,
    logo_url: safeUrl(p.logo_url),
    cover_url: safeUrl(p.cover_url) ?? gallery.find((g) => !g.video_url)?.image_url ?? gallery[0]?.image_url ?? null,
    listing_url: listing,
    contact_url: `${listing}#contact`,
    year: now.getFullYear(),
  };
}

// The runtime. Tiny, dependency-free and defensive: it runs inside whatever
// the vendor wrote and must never be the thing that breaks their page. Every
// value is set as text or as an attribute, never parsed as HTML.
const RUNTIME = `(function(){var d=window.bridalTeam;if(!d)return;
function c(tag,cls,txt){var e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null&&txt!=="")e.textContent=txt;return e;}
function t(el,v){if(v!=null&&v!=="")el.textContent=v;}
function link(el,href){if(el.tagName==="A"&&href){el.href=href;if(/^https?:/i.test(href)){el.target="_blank";el.rel="noopener noreferrer";}}}
function empty(k){var v=d[k==="price-range"?"price_range":k];if(k==="reviews")return !d.reviews||!d.reviews.items.length;if(Array.isArray(v))return !v.length;return v==null||v==="";}
function fill(){
var gs=document.querySelectorAll("[data-bt-if]");for(var g=0;g<gs.length;g++){if(empty(gs[g].getAttribute("data-bt-if")))gs[g].style.display="none";}
var els=document.querySelectorAll("[data-bt]");for(var i=0;i<els.length;i++){var el=els[i];try{var k=el.getAttribute("data-bt"),j,a;switch(k){
case"business-name":t(el,d.business_name);break;case"category":t(el,d.category);break;case"about":t(el,d.about);break;
case"location":t(el,d.location);break;case"price-range":t(el,d.price_range);break;case"rating":t(el,d.rating);break;case"year":t(el,String(d.year));break;
case"phone":if(d.phone){if(!el.children.length)t(el,d.phone);link(el,"tel:"+d.phone.replace(/[^0-9+]/g,""));}break;
case"email":if(d.email){if(!el.children.length)t(el,d.email);link(el,"mailto:"+d.email);}break;
case"website":link(el,d.website);break;case"contact":link(el,d.contact_url);break;case"listing":link(el,d.listing_url);break;
case"cover":if(d.cover_url){if(el.tagName==="IMG")el.src=d.cover_url;else el.style.backgroundImage="url(\\""+d.cover_url+"\\")";}break;
case"logo":if(d.logo_url&&el.tagName==="IMG")el.src=d.logo_url;break;
case"socials":if(!el.children.length)for(j=0;j<d.socials.length;j++){a=c("a","bt-social-link",d.socials[j].label);link(a,d.socials[j].url);el.appendChild(a);}break;
case"highlights":if(!el.children.length)for(j=0;j<d.highlights.length;j++){a=c("li","bt-highlight");a.appendChild(c("strong","",d.highlights[j].title));if(d.highlights[j].detail)a.appendChild(c("span","",d.highlights[j].detail));el.appendChild(a);}break;
case"packages":if(!el.children.length)for(j=0;j<d.packages.length;j++){var p=d.packages[j];a=c("article","bt-package"+(p.featured?" bt-featured":""));if(p.featured)a.appendChild(c("p","bt-badge","Most requested"));a.appendChild(c("h3","",p.name));a.appendChild(c("p","bt-price",p.price));if(p.description)a.appendChild(c("p","bt-desc",p.description));if(p.includes.length){var ul=c("ul");for(var q=0;q<p.includes.length;q++)ul.appendChild(c("li","",p.includes[q]));a.appendChild(ul);}el.appendChild(a);}break;
case"faqs":if(!el.children.length)for(j=0;j<d.faqs.length;j++){a=c("details","bt-faq");a.appendChild(c("summary","",d.faqs[j].q));a.appendChild(c("p","",d.faqs[j].a));el.appendChild(a);}break;
case"gallery":if(!el.children.length)for(j=0;j<d.gallery.length;j++){var gi=d.gallery[j];a=c("figure","bt-gallery-item");var im=c("img");im.src=gi.image_url;im.alt=gi.title||d.business_name;im.loading="lazy";if(gi.video_url){var l=c("a");link(l,gi.video_url);l.appendChild(im);a.appendChild(l);}else a.appendChild(im);el.appendChild(a);}break;
case"reviews":if(!el.children.length)for(j=0;j<d.reviews.items.length;j++){var r=d.reviews.items[j];a=c("blockquote","bt-review");a.appendChild(c("p","",r.body));a.appendChild(c("cite","",r.author+" \\u00b7 "+"\\u2605\\u2605\\u2605\\u2605\\u2605".slice(0,r.rating)));el.appendChild(a);}break;}}catch(_){}}
try{document.dispatchEvent(new CustomEvent("bridalteam:ready",{detail:d}));}catch(_){}}
document.addEventListener("click",function(ev){var x=ev.target&&ev.target.closest?ev.target.closest("a[href]"):null;if(!x)return;var h=x.getAttribute("href")||"";if(/^https?:/i.test(h)&&!x.target){x.target="_blank";x.rel="noopener noreferrer";}},true);
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fill);else fill();})();`;

export function vendorRuntimeScript(data: VendorSiteData): string {
  return `<script>window.bridalTeam=${scriptSafeJson(data)};${RUNTIME}</script>`;
}

/** Puts the runtime at the top of <head>, wrapping fragments in a document first. */
export function injectVendorRuntime(html: string, data: VendorSiteData): string {
  const tag = vendorRuntimeScript(data);
  const meta = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">';
  const head = /<head(\s[^>]*)?>/i;
  const root = /<html(\s[^>]*)?>/i;
  if (head.test(html)) return html.replace(head, (m) => `${m}${tag}`);
  if (root.test(html)) return html.replace(root, (m) => `${m}<head>${meta}${tag}</head>`);
  return `<!doctype html><html><head>${meta}${tag}</head><body>${html}</body></html>`;
}
