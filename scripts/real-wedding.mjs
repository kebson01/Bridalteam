// Puts a Real Weddings story on the site (/real-weddings).
//
// A story lives in a folder OUTSIDE this repository (the repo is public, and a
// couple's draft and photos are not): a story.json plus its photos. See
// plugins/bridalteam/skills/real-wedding-stories/ for how to write one.
//
//   node scripts/real-wedding.mjs check <folder>      validate story.json and its photos; changes nothing
//   node scripts/real-wedding.mjs upload <folder>     upload the photos and save the story as a private draft
//   node scripts/real-wedding.mjs publish <slug>      make a draft public (needs recorded consent)
//   node scripts/real-wedding.mjs unpublish <slug>    take a story back down to a draft
//
// upload/publish/unpublish need SUPABASE_SERVICE_ROLE_KEY (and optionally
// NEXT_PUBLIC_SUPABASE_URL). Only Node built-ins, so it runs without `npm ci`.

import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { findTells, formatTells } from "./human-voice.mjs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yubcwyfhgxjnqydhgjit.supabase.co";
const BUCKET = "real-weddings";
const MAX_PHOTOS = 12;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const TYPES = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };

/**
 * Checks a parsed story.json. Returns a list of problems; empty means good.
 * Does not touch the file system: photo files are checked in checkFolder.
 *
 * @param {any} s
 * @returns {string[]}
 */
export function validateStory(s) {
  const problems = [];
  if (!s || typeof s !== "object") return ["story.json must be an object"];
  const need = ["slug", "couple_names", "wedding_date", "city", "title", "story", "cover"];
  for (const key of need) if (!s[key] || (Array.isArray(s[key]) && s[key].length === 0)) problems.push(`missing "${key}"`);
  if (s.slug && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s.slug)) problems.push(`slug "${s.slug}" must be lowercase words joined by hyphens`);
  if (s.wedding_date && !/^\d{4}-\d{2}-\d{2}$/.test(s.wedding_date)) problems.push(`wedding_date must look like 2012-05-05`);
  if (s.story && typeof s.story !== "string" && !Array.isArray(s.story)) problems.push(`"story" must be text or a list of paragraphs`);
  if (s.photos && !Array.isArray(s.photos)) problems.push(`"photos" must be a list`);
  const photos = Array.isArray(s.photos) ? s.photos : [];
  if (photos.length > MAX_PHOTOS) problems.push(`${photos.length} photos; keep it to ${MAX_PHOTOS}`);
  for (const [i, p] of photos.entries()) {
    if (!p?.file) problems.push(`photos[${i}] has no "file"`);
    if (!p?.alt) problems.push(`photos[${i}] needs "alt" text describing it`);
  }
  for (const [i, v] of (Array.isArray(s.vendors) ? s.vendors : []).entries()) {
    if (!v?.role || !v?.name) problems.push(`vendors[${i}] needs "role" and "name"`);
  }

  // Facts we don't have yet are written as [brackets]. None may go live.
  const text = JSON.stringify(s);
  for (const m of text.matchAll(/\[[^\]"]{2,}\]/g)) problems.push(`placeholder still in the story: ${m[0]}`);

  if (!s.photographer) problems.push(`"photographer" is empty: credit whoever took the photos`);
  return problems;
}

/** Problems that block publishing, on top of validateStory. */
export function publishProblems(s) {
  const problems = [];
  if (!s?.consent?.confirmed_at) problems.push(`no consent recorded: set consent.confirmed_at once the couple (and anyone clearly shown) has said yes`);
  return problems;
}

export function storyText(s) {
  return Array.isArray(s.story) ? s.story.join("\n\n") : String(s.story ?? "");
}

async function loadFolder(folder) {
  const file = path.join(folder, "story.json");
  const story = JSON.parse(await readFile(file, "utf8"));
  return { story, file };
}

async function checkFolder(folder) {
  const { story } = await loadFolder(folder);
  const problems = validateStory(story);
  const files = [story.cover, ...(story.photos ?? []).map((p) => p.file)].filter(Boolean);
  for (const f of new Set(files)) {
    const ext = path.extname(f).toLowerCase();
    if (!TYPES[ext]) problems.push(`${f}: use .jpg, .png or .webp (convert .avif first)`);
    try {
      const { size } = await stat(path.join(folder, f));
      if (size > MAX_PHOTO_BYTES) problems.push(`${f} is ${(size / 1048576).toFixed(1)} MB; keep photos under 5 MB`);
    } catch {
      problems.push(`${f} is not in ${folder}`);
    }
  }
  const tells = findTells(storyText(story)).filter((t) => t.level === "fix");
  return { story, problems, tells };
}

function serviceKey() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Set SUPABASE_SERVICE_ROLE_KEY to upload or publish.");
  return key;
}

async function api(method, url, body, headers = {}) {
  const key = serviceKey();
  const res = await fetch(`${SUPABASE_URL}${url}`, {
    method,
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...headers },
    body,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${url} failed (${res.status}): ${text}`);
  return text ? JSON.parse(text) : null;
}

async function uploadPhoto(folder, slug, file) {
  const bytes = await readFile(path.join(folder, file));
  const name = path.basename(file).toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
  const objectPath = `${slug}/${name}`;
  await api("POST", `/storage/v1/object/${BUCKET}/${objectPath}`, bytes, {
    "Content-Type": TYPES[path.extname(file).toLowerCase()],
    "x-upsert": "true",
    "cache-control": "3600",
  });
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`;
}

async function upload(folder) {
  const { story, problems, tells } = await checkFolder(folder);
  if (problems.length || tells.length) {
    report(problems, tells);
    throw new Error("Fix the problems above before uploading.");
  }
  const urls = new Map();
  for (const f of new Set([story.cover, ...(story.photos ?? []).map((p) => p.file)])) {
    urls.set(f, await uploadPhoto(folder, story.slug, f));
    console.log(`uploaded ${f}`);
  }
  const row = {
    slug: story.slug,
    couple_names: story.couple_names,
    wedding_date: story.wedding_date,
    city: story.city,
    venue: story.venue ?? null,
    title: story.title,
    summary: story.summary ?? null,
    story: storyText(story),
    cover_url: urls.get(story.cover),
    photos: (story.photos ?? []).map((p) => ({ url: urls.get(p.file), alt: p.alt })),
    vendors: story.vendors ?? [],
    photographer: story.photographer,
    consent_confirmed_at: story.consent?.confirmed_at ?? null,
    consent_note: story.consent?.note ?? null,
    updated_at: new Date().toISOString(),
  };
  // Upserting never changes status: a published story stays published when
  // re-uploaded with fixes, and a new one starts as a draft.
  await api("POST", `/rest/v1/real_weddings?on_conflict=slug`, JSON.stringify(row), {
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates,return=minimal",
  });
  console.log(`saved "${story.title}" (${story.slug}). It stays private until: node scripts/real-wedding.mjs publish ${story.slug}`);
}

async function setStatus(slug, status) {
  const patch = status === "published" ? { status, published_at: new Date().toISOString() } : { status };
  const rows = await api("PATCH", `/rest/v1/real_weddings?slug=eq.${encodeURIComponent(slug)}`, JSON.stringify(patch), {
    "Content-Type": "application/json",
    Prefer: "return=representation",
  });
  if (!rows?.length) throw new Error(`No story with slug "${slug}". Upload it first.`);
  console.log(status === "published" ? `published: /real-weddings/${slug}` : `${slug} is a private draft again`);
}

function report(problems, tells) {
  for (const p of problems) console.log(`  ✗ ${p}`);
  if (tells.length) console.log(formatTells(tells));
}

async function main([cmd, arg]) {
  if (cmd === "check" && arg) {
    const { story, problems, tells } = await checkFolder(arg);
    const blocking = [...problems, ...publishProblems(story)];
    report(blocking, tells);
    if (problems.length || tells.length) process.exit(1);
    console.log(blocking.length ? "Ready to upload as a draft (not to publish yet)." : "Ready to upload and publish.");
    return;
  }
  if (cmd === "upload" && arg) return upload(arg);
  if (cmd === "publish" && arg) return setStatus(arg, "published");
  if (cmd === "unpublish" && arg) return setStatus(arg, "draft");
  console.log("usage: node scripts/real-wedding.mjs check|upload <folder> | publish|unpublish <slug>");
  process.exit(2);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
}
