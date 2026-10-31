/**
 * Bridal Team's "standard" custom sites: a handful of themes, filled from a
 * short brief. This is what the AI planner offers (propose_website) and what
 * the site builder's "Start from a theme" makes — a finished, editable page
 * in one tap, with no extra AI call.
 *
 * The output is ordinary custom-site HTML: it uses the data-bt placeholders
 * (lib/custom-site/runtime.ts), so names, date, cover photo and registry stay
 * live, and the couple can open it in the code editor or hand it to their own
 * assistant to take further.
 *
 * Every brief field is untrusted (it comes from a model or a browser):
 * sanitizeBrief() bounds it, and every string is HTML-escaped on output.
 */

export type ThemeId = "classic" | "garden" | "modern" | "tropical" | "romantic";

interface Theme {
  label: string;
  blurb: string;
  bg: string;
  surface: string;
  ink: string;
  muted: string;
  accent: string;
  heroOverlay: string;
  display: string;
  body: string;
  fonts: string;
}

export const THEMES: Record<ThemeId, Theme> = {
  classic: {
    label: "Classic",
    blurb: "Ivory, gold and a timeless serif.",
    bg: "#fbf8f2", surface: "#ffffff", ink: "#2b2622", muted: "#6f655c", accent: "#b08d57",
    heroOverlay: "linear-gradient(180deg,rgba(30,24,18,.55),rgba(30,24,18,.7))",
    display: "'Cormorant Garamond', Georgia, serif", body: "'Lato', system-ui, sans-serif",
    fonts: "Cormorant+Garamond:wght@500;600&family=Lato:wght@400;700",
  },
  garden: {
    label: "Garden",
    blurb: "Sage greens and soft botanicals.",
    bg: "#f4f6f0", surface: "#ffffff", ink: "#26302a", muted: "#5d6b60", accent: "#6f8f72",
    heroOverlay: "linear-gradient(180deg,rgba(25,40,30,.45),rgba(25,40,30,.7))",
    display: "'Playfair Display', Georgia, serif", body: "'Nunito Sans', system-ui, sans-serif",
    fonts: "Playfair+Display:wght@500;600&family=Nunito+Sans:wght@400;700",
  },
  modern: {
    label: "Modern",
    blurb: "Crisp black and white, bold type.",
    bg: "#ffffff", surface: "#f5f5f4", ink: "#111111", muted: "#555555", accent: "#111111",
    heroOverlay: "linear-gradient(180deg,rgba(0,0,0,.45),rgba(0,0,0,.65))",
    display: "'Jost', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif",
    fonts: "Jost:wght@500;600&family=Inter:wght@400;600",
  },
  tropical: {
    label: "Tropical",
    blurb: "Ocean teal, coral and island light.",
    bg: "#f3faf9", surface: "#ffffff", ink: "#16333a", muted: "#4f6d72", accent: "#f2735a",
    heroOverlay: "linear-gradient(180deg,rgba(8,60,70,.4),rgba(8,60,70,.72))",
    display: "'DM Serif Display', Georgia, serif", body: "'DM Sans', system-ui, sans-serif",
    fonts: "DM+Serif+Display&family=DM+Sans:wght@400;700",
  },
  romantic: {
    label: "Romantic",
    blurb: "Blush, rose and flowing script.",
    bg: "#fdf6f5", surface: "#ffffff", ink: "#3a2a2c", muted: "#7a6265", accent: "#c97b84",
    heroOverlay: "linear-gradient(180deg,rgba(60,30,35,.4),rgba(60,30,35,.68))",
    display: "'Great Vibes', cursive", body: "'Raleway', system-ui, sans-serif",
    fonts: "Great+Vibes&family=Raleway:wght@400;600",
  },
};

export const THEME_IDS = Object.keys(THEMES) as ThemeId[];

export interface SiteBrief {
  theme: ThemeId;
  headline: string | null;
  story: string | null;
  schedule: { time: string; title: string; detail: string | null }[];
  dress_code: string | null;
  travel: string | null;
  faq: { q: string; a: string }[];
  accent: string | null;
}

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").trim().slice(0, max);
  return s || null;
};

export function sanitizeBrief(raw: unknown): SiteBrief {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const theme = THEME_IDS.includes(r.theme as ThemeId) ? (r.theme as ThemeId) : "classic";
  const list = (v: unknown, n: number) => (Array.isArray(v) ? v.slice(0, n) : []);
  return {
    theme,
    headline: text(r.headline, 120),
    story: text(r.story, 1500),
    schedule: list(r.schedule, 10)
      .map((i) => {
        const o = (i ?? {}) as Record<string, unknown>;
        const title = text(o.title, 80);
        return title ? { time: text(o.time, 30) ?? "", title, detail: text(o.detail, 200) } : null;
      })
      .filter((i): i is SiteBrief["schedule"][number] => i !== null),
    dress_code: text(r.dress_code, 200),
    travel: text(r.travel, 1000),
    faq: list(r.faq, 8)
      .map((i) => {
        const o = (i ?? {}) as Record<string, unknown>;
        const q = text(o.q ?? o.question, 160);
        const a = text(o.a ?? o.answer, 600);
        return q && a ? { q, a } : null;
      })
      .filter((i): i is { q: string; a: string } => i !== null),
    accent: typeof r.accent === "string" && /^#[0-9a-f]{6}$/i.test(r.accent) ? r.accent.toLowerCase() : null,
  };
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const paras = (s: string) =>
  s
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

export function buildTemplateSite(input: SiteBrief): string {
  const b = sanitizeBrief(input);
  const t = THEMES[b.theme];
  const accent = b.accent ?? t.accent;
  const e = escapeHtml;

  const sections: string[] = [];

  sections.push(`<section class="intro wrap">
  ${b.headline ? `<h2>${e(b.headline)}</h2>` : ""}
  <p class="welcome" data-bt="welcome"></p>
  ${b.story ? `<div class="story">${paras(b.story)}</div>` : ""}
</section>`);

  if (b.schedule.length) {
    sections.push(`<section class="wrap" id="day">
  <h2>The Day</h2>
  <ol class="schedule">${b.schedule
    .map(
      (s) =>
        `<li><span class="time">${e(s.time)}</span><div><strong>${e(s.title)}</strong>${s.detail ? `<p>${e(s.detail)}</p>` : ""}</div></li>`,
    )
    .join("")}</ol>
</section>`);
  }

  if (b.dress_code || b.travel) {
    sections.push(`<section class="wrap cards">
  ${b.dress_code ? `<div class="card"><h3>Dress code</h3><p>${e(b.dress_code)}</p></div>` : ""}
  ${b.travel ? `<div class="card"><h3>Travel &amp; stay</h3>${paras(b.travel)}</div>` : ""}
</section>`);
  }

  sections.push(`<section class="wrap center" id="rsvp">
  <h2>RSVP</h2>
  <p data-bt="rsvp"></p>
</section>
<section class="wrap center registry-wrap" id="registry">
  <h2>Registry</h2>
  <p class="muted">Your presence is the greatest gift — but if you'd like to celebrate with us:</p>
  <div class="registry" data-bt="registry"></div>
</section>`);

  if (b.faq.length) {
    sections.push(`<section class="wrap" id="faq">
  <h2>Questions</h2>
  ${b.faq.map((f) => `<details><summary>${e(f.q)}</summary><p>${e(f.a)}</p></details>`).join("")}
</section>`);
  }

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Our Wedding</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${t.fonts}&display=swap">
<style>
  :root{--bg:${t.bg};--surface:${t.surface};--ink:${t.ink};--muted:${t.muted};--accent:${accent};--display:${t.display};--body:${t.body}}
  *{box-sizing:border-box}html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);line-height:1.65}
  .hero{position:relative;min-height:88vh;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;padding:5rem 1.25rem;background:var(--ink) center/cover no-repeat}
  .hero::before{content:"";position:absolute;inset:0;background:${t.heroOverlay}}
  .hero>div{position:relative;max-width:46rem}
  .eyebrow{letter-spacing:.32em;font-size:.75rem;text-transform:uppercase;opacity:.85}
  h1{font-family:var(--display);font-weight:500;font-size:clamp(2.8rem,9vw,5.5rem);line-height:1.05;margin:.6rem 0}
  .hero .date{font-size:1.15rem;margin:.25rem 0}.hero .loc{text-transform:uppercase;letter-spacing:.15em;font-size:.8rem;opacity:.8}
  .countdown{display:inline-block;margin-top:1.5rem;padding:.45rem 1.1rem;border:1px solid rgba(255,255,255,.6);border-radius:999px;font-size:.85rem}
  nav{position:sticky;top:0;z-index:5;display:flex;justify-content:center;gap:1.4rem;flex-wrap:wrap;padding:.85rem 1rem;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(6px);border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent);font-size:.8rem;letter-spacing:.12em;text-transform:uppercase}
  nav a{color:var(--muted);text-decoration:none}nav a:hover{color:var(--accent)}
  .wrap{max-width:46rem;margin:0 auto;padding:4rem 1.25rem}
  h2{font-family:var(--display);font-weight:500;font-size:clamp(2rem,5vw,2.75rem);color:var(--accent);margin:0 0 1.25rem;text-align:center}
  h3{font-family:var(--display);font-weight:500;font-size:1.4rem;margin:0 0 .5rem}
  .welcome{font-size:1.1rem;text-align:center;white-space:pre-wrap}.story p{margin:0 0 1rem}
  .center{text-align:center}.muted{color:var(--muted)}
  .schedule{list-style:none;padding:0;margin:0}.schedule li{display:grid;grid-template-columns:7rem 1fr;gap:1rem;padding:1rem 0;border-bottom:1px solid color-mix(in srgb,var(--ink) 10%,transparent)}
  .schedule .time{color:var(--accent);font-weight:700}.schedule p{margin:.2rem 0 0;color:var(--muted)}
  .cards{display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))}
  .card{background:var(--surface);border-radius:1rem;padding:1.5rem;box-shadow:0 1px 3px rgba(0,0,0,.06)}.card p{margin:0 0 .6rem}
  .registry{display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem;margin-top:1.25rem}
  .bt-registry-link{display:inline-block;padding:.7rem 1.4rem;border-radius:999px;border:1px solid var(--accent);color:var(--accent);text-decoration:none;font-weight:700;font-size:.9rem}
  .bt-registry-link:hover{background:var(--accent);color:#fff}
  details{background:var(--surface);border-radius:.75rem;padding:1rem 1.25rem;margin-bottom:.75rem}summary{cursor:pointer;font-weight:700}details p{margin:.6rem 0 0;color:var(--muted)}
  footer{text-align:center;padding:3rem 1rem;color:var(--muted);font-family:var(--display);font-size:1.6rem}
  @media(max-width:520px){.schedule li{grid-template-columns:1fr;gap:.2rem}}
</style>
</head>
<body>
<header class="hero" data-bt="cover">
  <div>
    <p class="eyebrow">Together with their families</p>
    <h1 data-bt="names">Our Wedding</h1>
    <p class="date" data-bt="date"></p>
    <p class="loc" data-bt="location"></p>
    <span class="countdown" data-bt="countdown"></span>
  </div>
</header>
<nav>${b.schedule.length ? '<a href="#day">The Day</a>' : ""}<a href="#rsvp">RSVP</a><a href="#registry">Registry</a>${b.faq.length ? '<a href="#faq">FAQ</a>' : ""}</nav>
<main>
${sections.join("\n")}
</main>
<footer data-bt="names"></footer>
</body>
</html>`;
}
