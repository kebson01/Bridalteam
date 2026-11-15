/**
 * One-tap vendor websites: Bridal Team themes filled from the vendor's
 * listing. The page is ordinary vendor-site HTML built on the data-bt
 * placeholders (lib/vendor-site/runtime.ts), so packages, photos, reviews and
 * contact details stay live as the listing changes, and the vendor can take
 * it further in the code editor, with our AI or with their own assistant.
 *
 * Brief fields are untrusted (browser or model): sanitizeVendorBrief() bounds
 * them, and every string is HTML-escaped on output.
 */

export type VendorThemeId = "classic" | "modern" | "garden" | "luxe";

interface Theme {
  label: string;
  blurb: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  onAccent: string;
  heroOverlay: string;
  display: string;
  body: string;
  fonts: string;
}

export const VENDOR_THEMES: Record<VendorThemeId, Theme> = {
  classic: {
    label: "Classic",
    blurb: "Ivory, gold and a timeless serif.",
    bg: "#fbf8f2", surface: "#ffffff", ink: "#2b2622", muted: "#6f655c", accent: "#9a7646", onAccent: "#ffffff",
    heroOverlay: "linear-gradient(180deg,rgba(30,24,18,.45),rgba(30,24,18,.75))",
    display: "'Cormorant Garamond', Georgia, serif", body: "'Lato', system-ui, sans-serif",
    fonts: "Cormorant+Garamond:wght@500;600&family=Lato:wght@400;700",
  },
  modern: {
    label: "Modern",
    blurb: "Clean white, bold type, one strong accent.",
    bg: "#ffffff", surface: "#f5f5f4", ink: "#111111", muted: "#555555", accent: "#e8590c", onAccent: "#ffffff",
    heroOverlay: "linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.7))",
    display: "'Jost', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif",
    fonts: "Jost:wght@500;600&family=Inter:wght@400;600",
  },
  garden: {
    label: "Garden",
    blurb: "Sage greens and soft, natural light.",
    bg: "#f4f6f0", surface: "#ffffff", ink: "#26302a", muted: "#5d6b60", accent: "#5f7f62", onAccent: "#ffffff",
    heroOverlay: "linear-gradient(180deg,rgba(25,40,30,.4),rgba(25,40,30,.72))",
    display: "'Playfair Display', Georgia, serif", body: "'Nunito Sans', system-ui, sans-serif",
    fonts: "Playfair+Display:wght@500;600&family=Nunito+Sans:wght@400;700",
  },
  luxe: {
    label: "Luxe",
    blurb: "Midnight navy with champagne gold.",
    bg: "#0f1626", surface: "#18223a", ink: "#f3efe6", muted: "#b9b3a6", accent: "#d4b46a", onAccent: "#0f1626",
    heroOverlay: "linear-gradient(180deg,rgba(8,12,24,.35),rgba(8,12,24,.85))",
    display: "'Cinzel', Georgia, serif", body: "'Montserrat', system-ui, sans-serif",
    fonts: "Cinzel:wght@500;600&family=Montserrat:wght@400;600",
  },
};

export const VENDOR_THEME_IDS = Object.keys(VENDOR_THEMES) as VendorThemeId[];

export interface VendorBrief {
  theme: VendorThemeId;
  /** Short line under the name in the hero, e.g. "Packed dance floors since 2012". */
  headline: string | null;
  accent: string | null;
}

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/\s+/g, " ").trim().slice(0, max);
  return s || null;
};

export function sanitizeVendorBrief(raw: unknown): VendorBrief {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    theme: VENDOR_THEME_IDS.includes(r.theme as VendorThemeId) ? (r.theme as VendorThemeId) : "classic",
    headline: text(r.headline, 120),
    accent: typeof r.accent === "string" && /^#[0-9a-f]{6}$/i.test(r.accent) ? r.accent.toLowerCase() : null,
  };
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** A complete vendor website for a theme and brief. Business details come from data-bt at serve time. */
export function buildVendorTemplateSite(brief: VendorBrief): string {
  const t = VENDOR_THEMES[brief.theme];
  const accent = brief.accent ?? t.accent;
  const headline = brief.headline ? `<p class="headline">${esc(brief.headline)}</p>` : "";

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Our business</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${t.fonts}&display=swap">
<style>
:root{--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--accent:${accent};--on-accent:${t.onAccent};--display:${t.display};--body:${t.body}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.65;font-size:17px}
img{max-width:100%;display:block}
a{color:var(--accent)}
.wrap{max-width:1080px;margin:0 auto;padding:0 22px}
nav{position:sticky;top:0;z-index:10;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
nav .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px;height:64px}
nav .brand{font-family:var(--display);font-size:22px;font-weight:600;color:var(--ink);text-decoration:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
nav .links{display:flex;gap:20px;align-items:center;font-size:14px}
nav .links a{color:var(--muted);text-decoration:none}
nav .links a:hover{color:var(--ink)}
@media(max-width:720px){nav .links a.opt{display:none}}
.btn{display:inline-block;background:var(--accent);color:var(--on-accent)!important;padding:12px 26px;border-radius:999px;font-weight:600;text-decoration:none;font-size:15px}
.btn.ghost{background:transparent;color:#fff!important;border:1.5px solid rgba(255,255,255,.8)}
.hero{position:relative;min-height:78vh;display:flex;align-items:flex-end;background:#333 center/cover no-repeat;color:#fff}
.hero::before{content:"";position:absolute;inset:0;background:${t.heroOverlay}}
.hero .wrap{position:relative;padding-top:120px;padding-bottom:72px;width:100%}
.eyebrow{text-transform:uppercase;letter-spacing:.22em;font-size:13px;opacity:.9;margin:0}
.hero h1{font-family:var(--display);font-weight:500;font-size:clamp(42px,7vw,84px);line-height:1.05;margin:.2em 0 .15em}
.hero .headline{font-size:clamp(18px,2.4vw,22px);max-width:640px;opacity:.95;margin:0 0 6px}
.hero .meta{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:15px;opacity:.9;margin:6px 0 26px}
.hero .actions{display:flex;flex-wrap:wrap;gap:12px}
section.block{padding:84px 0}
section.block.alt{background:var(--surface)}
h2{font-family:var(--display);font-weight:500;font-size:clamp(30px,4vw,44px);margin:0 0 10px;line-height:1.15}
.lead{color:var(--muted);margin:0 0 34px;max-width:620px}
.about{white-space:pre-line;font-size:18px;max-width:760px}
.highlights{list-style:none;padding:0;margin:34px 0 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.bt-highlight{background:var(--surface);border:1px solid color-mix(in srgb,var(--ink) 10%,transparent);border-radius:14px;padding:18px}
.alt .bt-highlight{background:var(--bg)}
.bt-highlight strong{display:block;font-size:16px}.bt-highlight span{color:var(--muted);font-size:14px}
.packages{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
.bt-package{position:relative;background:var(--bg);border:1px solid color-mix(in srgb,var(--ink) 12%,transparent);border-radius:18px;padding:28px}
.bt-package.bt-featured{border:2px solid var(--accent)}
.bt-badge{position:absolute;top:-12px;left:24px;margin:0;background:var(--accent);color:var(--on-accent);font-size:12px;font-weight:600;padding:3px 12px;border-radius:999px}
.bt-package h3{font-family:var(--display);font-weight:500;font-size:26px;margin:0}
.bt-price{color:var(--accent);font-weight:600;margin:4px 0 12px}
.bt-desc{color:var(--muted);margin:0 0 12px;white-space:pre-line}
.bt-package ul{margin:0;padding-left:20px}.bt-package li{margin:4px 0}
.gallery{columns:3 260px;column-gap:14px}
.bt-gallery-item{margin:0 0 14px;break-inside:avoid;border-radius:14px;overflow:hidden}
.bt-gallery-item img{width:100%;height:auto}
.reviews{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.bt-review{margin:0;background:var(--surface);border-radius:18px;padding:26px}
.alt .bt-review{background:var(--bg)}
.bt-review p{margin:0 0 14px;font-size:17px;white-space:pre-line}
.bt-review cite{font-style:normal;color:var(--muted);font-size:14px}
.rating{color:var(--accent);font-weight:600;margin:0 0 30px}
.faqs{max-width:780px}
.bt-faq{border-bottom:1px solid color-mix(in srgb,var(--ink) 12%,transparent);padding:16px 0}
.bt-faq summary{cursor:pointer;font-weight:600;font-size:18px;list-style:none}
.bt-faq summary::-webkit-details-marker{display:none}
.bt-faq summary::after{content:"+";float:right;color:var(--accent)}
.bt-faq[open] summary::after{content:"\\2212"}
.bt-faq p{color:var(--muted);margin:10px 0 0;white-space:pre-line}
.contact{text-align:center}
.contact .lead{margin-left:auto;margin-right:auto}
.contact-lines{display:flex;flex-wrap:wrap;justify-content:center;gap:10px 28px;margin:24px 0 8px;font-size:17px}
.contact-lines a{color:var(--ink);text-decoration:none;border-bottom:1px solid color-mix(in srgb,var(--accent) 60%,transparent)}
.socials{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:22px}
.bt-social-link{border:1px solid color-mix(in srgb,var(--ink) 18%,transparent);border-radius:999px;padding:7px 16px;font-size:14px;color:var(--ink);text-decoration:none}
footer{padding:34px 0;font-size:14px;color:var(--muted);border-top:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
footer .wrap{display:flex;flex-wrap:wrap;justify-content:space-between;gap:10px}
footer a{color:var(--muted)}
.fade{opacity:0;transform:translateY(18px);transition:opacity .7s ease,transform .7s ease}
.fade.in{opacity:1;transform:none}
@media(prefers-reduced-motion:reduce){.fade{opacity:1;transform:none;transition:none}}
</style>
</head>
<body>
<nav>
  <div class="wrap">
    <a class="brand" href="#top" data-bt="business-name">Our business</a>
    <div class="links">
      <a class="opt" href="#packages" data-bt-if="packages">Packages</a>
      <a class="opt" href="#gallery" data-bt-if="gallery">Gallery</a>
      <a class="opt" href="#reviews" data-bt-if="reviews">Reviews</a>
      <a class="btn" data-bt="contact" href="#contact">Check availability</a>
    </div>
  </div>
</nav>

<header class="hero" id="top" data-bt="cover">
  <div class="wrap">
    <p class="eyebrow" data-bt="category"></p>
    <h1 data-bt="business-name">Our business</h1>
    ${headline}
    <p class="meta"><span data-bt="location"></span><span data-bt="price-range"></span><span data-bt="rating"></span></p>
    <div class="actions">
      <a class="btn" data-bt="contact" href="#contact">Check availability</a>
      <a class="btn ghost" href="#packages" data-bt-if="packages">See packages</a>
    </div>
  </div>
</header>

<section class="block fade" id="about" data-bt-if="about">
  <div class="wrap">
    <h2>About us</h2>
    <p class="about" data-bt="about"></p>
    <ul class="highlights" data-bt="highlights" data-bt-if="highlights"></ul>
  </div>
</section>

<section class="block alt fade" id="packages" data-bt-if="packages">
  <div class="wrap">
    <h2>Packages</h2>
    <p class="lead">Every wedding is different. Reach out and we'll tailor a package to your day.</p>
    <div class="packages" data-bt="packages"></div>
  </div>
</section>

<section class="block fade" id="gallery" data-bt-if="gallery">
  <div class="wrap">
    <h2>Our work</h2>
    <p class="lead">A few moments from weddings we've been part of.</p>
    <div class="gallery" data-bt="gallery"></div>
  </div>
</section>

<section class="block alt fade" id="reviews" data-bt-if="reviews">
  <div class="wrap">
    <h2>Kind words</h2>
    <p class="rating" data-bt="rating"></p>
    <div class="reviews" data-bt="reviews"></div>
  </div>
</section>

<section class="block fade" id="faq" data-bt-if="faqs">
  <div class="wrap">
    <h2>Questions couples ask</h2>
    <div class="faqs" data-bt="faqs"></div>
  </div>
</section>

<section class="block alt contact fade" id="contact">
  <div class="wrap">
    <h2>Let's talk about your day</h2>
    <p class="lead">Tell us your date and plans, and we'll get back to you.</p>
    <a class="btn" data-bt="contact" href="#">Send us a message</a>
    <div class="contact-lines">
      <a data-bt="phone" data-bt-if="phone" href="#"></a>
      <a data-bt="email" data-bt-if="email" href="#"></a>
      <a data-bt="website" data-bt-if="website" href="#">Our website</a>
    </div>
    <div class="socials" data-bt="socials" data-bt-if="socials"></div>
  </div>
</section>

<footer>
  <div class="wrap">
    <span>&copy; <span data-bt="year"></span> <span data-bt="business-name"></span></span>
    <a data-bt="listing" href="#">Find us on Bridal Team</a>
  </div>
</footer>

<script>
(function(){var els=document.querySelectorAll(".fade");if(!("IntersectionObserver" in window)){for(var i=0;i<els.length;i++)els[i].classList.add("in");return;}
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}});},{threshold:.12});
for(var j=0;j<els.length;j++)io.observe(els[j]);})();
document.addEventListener("bridalteam:ready",function(e){try{document.title=e.detail.business_name+(e.detail.category?" · "+e.detail.category:"");}catch(_){}});
</script>
</body>
</html>`;
}
