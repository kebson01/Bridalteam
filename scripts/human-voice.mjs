// Flags the habits that make a message read as machine-written: emoji, em
// dashes, stock AI phrases, sales-letter openers. Everything Bridal Team sends
// to the public (Facebook posts, group posts, replies, vendor emails, pitches)
// goes through it before anyone sees it. The bridalteam:human-voice skill
// covers the judgment calls a script can't make.
//
//   node scripts/human-voice.mjs <file>...   check files (post.json: its message; anything else: the whole text)
//   node scripts/human-voice.mjs -           check text from stdin
//
// Exits 1 if anything at level "fix" is found. "look" items are worth a second
// read but can stay when they're how a person would really say it.
//
// Only Node built-ins, so it runs without `npm ci`.

import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import path from "node:path";

/** @typedef {{ level: "fix" | "look", rule: string, match: string, line: number, hint: string }} Tell */

// Words and phrases people almost never write but language models write all
// the time. Matched case-insensitively on word boundaries.
const STOCK_PHRASES = [
  ["i hope (this|my) (email|message|note) finds you well", "Start with the point."],
  ["i hope you('| a)re (doing )?well", "Start with the point."],
  ["i wanted to reach out", "Just say why you're writing."],
  ["(just )?(circling|touching) back", "Say what you want: \"Did you get a chance to look?\""],
  ["(please )?(don't|do not) hesitate to", "\"Just reply\" or \"Call me at...\"."],
  ["feel free to reach out", "\"Just reply\"."],
  ["delve|delving", "\"look at\", \"get into\"."],
  ["tapestry", "Cut it."],
  ["(is|stands as) a testament to", "Say what it shows."],
  ["elevate (your|the)", "Say what actually gets better."],
  ["seamless(ly)?", "Say what's easy about it."],
  ["effortless(ly)?", "Say what's easy about it."],
  ["unlock (the|your)", "Say what they get."],
  ["game[- ]changer", "Say what changes."],
  ["(in )?today's (fast[- ]paced|digital) (world|age)", "Cut it."],
  ["look no further", "Cut it."],
  ["(it's|it is) (important|worth) (to note|noting)", "Just say the thing."],
  ["embark(ing)? on", "\"start\"."],
  ["(your|this|the|our) (wedding |planning )*journey", "\"planning\", \"the next few months\"."],
  ["dive (in|into)|let's dive", "Cut it."],
  ["navigat(e|ing) the (world|complexities|process|ins and outs)", "\"work out\", \"figure out\"."],
  ["realm", "Cut it."],
  ["plethora|myriad", "\"lots of\", or the actual number."],
  ["meticulous(ly)?", "Say what they're careful about."],
  ["nestled", "\"in\", \"on\", \"near\"."],
  ["boasts", "\"has\"."],
  ["bustling|vibrant", "Name the specific thing."],
  ["(say goodbye to|wave goodbye to)", "Cut it."],
  ["picture this|imagine (this|a world)", "Start with the point."],
  ["ever wondered", "Ask the real question."],
  ["here's the (thing|kicker|secret)", "Cut it."],
  ["the best part\\?", "Just say it."],
  ["whether you're (a|an|planning|looking)", "Talk to one reader."],
  ["(certainly|absolutely|great question)!", "Cut it."],
  ["in conclusion|in summary|to sum up", "Cut it."],
  ["moreover|furthermore|additionally,", "\"also\", or a new sentence."],
  ["(a|your) one-stop[- ]shop", "Say what's there."],
  ["(take|takes) (it|things|your \\w+) to the next level", "Say what gets better."],
  ["(curated|bespoke) ", "Fine for a vendor's own words, rarely for ours."],
  ["as an ai", "Never."],
];

// Constructions rather than words. Each is a common model tic.
const PATTERNS = [
  [/\b(it's|it is|this is|that's) not (just|only|merely)? ?[^.!?\n]{1,40}[,;—–-]+ ?(it's|it is|but)\b/gi,
    "not-x-but-y", "fix", "\"It's not X, it's Y\". Say Y."],
  [/\bnot (just|only|merely) [^.!?\n]{1,40},? but (also )?/gi,
    "not-x-but-y", "fix", "\"Not just X but Y\". Say Y."],
  [/\b(no|zero) \w+\.? (no|zero) \w+\.? (just|only) /gi,
    "no-x-no-y-just-z", "fix", "\"No X. No Y. Just Z.\" Say Z plainly."],
];

// Words that keep their capitals in sentence case, so they don't make a line
// look like a Title Case headline.
export const PROPER_NOUNS = new Set([
  "I", "AI", "DJ", "DJs", "RSVP", "RSVPs", "FAQ", "Facebook", "Pinterest", "Instagram",
  "Florida", "Miami", "Broward", "Orlando", "Tampa", "Thanksgiving", "Christmas", "Hanukkah",
  "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
]);

// Names of more than one word. Their words only count as proper nouns together.
const PROPER_PHRASES = [
  "Bridal Team", "South Florida", "Fort Lauderdale", "Palm Beach", "Boca Raton",
  "Valentine's Day", "Mother's Day", "Father's Day", "New Year's Eve", "New Year's Day", "New Year",
];
const PHRASE_RE = new RegExp(`\\b(${PROPER_PHRASES.join("|")})\\b`, "gi");
const restorePhrases = (text) => text.replace(PHRASE_RE, (m) => PROPER_PHRASES.find((p) => p.toLowerCase() === m.toLowerCase()) ?? m);

// Short words a Title Case headline leaves in lower case.
const SMALL_WORDS = new Set("a an the and or but nor to of in on at by for from with as vs vs. per".split(" "));

/**
 * True for a line written like a headline: "How to Make Your Wedding Cake
 * Tasting Count". Proper nouns don't count, so "Happy Thanksgiving from Bridal
 * Team." passes.
 */
export function isTitleCase(line) {
  // A mailing address or a short name sign-off is capitalized for good reason.
  if (/\b[A-Z]{2} \d{5}\b|#\d/.test(line)) return false;
  const words = line.replace(PHRASE_RE, "").trim().match(/[A-Za-z][\w'-]*/g) ?? [];
  if (words.length < 4) return false;
  const counted = words.slice(1).filter((w) => !SMALL_WORDS.has(w.toLowerCase()) && !PROPER_NOUNS.has(w));
  const capitalized = counted.filter((w) => /^[A-Z]/.test(w));
  return capitalized.length >= 3 && capitalized.length / counted.length >= 0.75;
}

/**
 * "How to Make Your Wedding Cake Tasting Count" -> "How to make your wedding
 * cake tasting count". Keeps proper nouns and acronyms, and capitalizes the
 * first word of each sentence.
 */
export function toSentenceCase(line) {
  let start = true;
  const out = line.replace(/\b(?:vs|e\.g|i\.e)\.|[A-Za-z0-9$][\w'$,-]*|[.?!]/g, (token) => {
    if (/^(vs|e\.g|i\.e)\.$/i.test(token)) return token.toLowerCase();
    if (/^[0-9$]/.test(token)) {
      start = false;
      return token;
    }
    if (/^[.?!]$/.test(token)) {
      start = true;
      return token;
    }
    const keep = PROPER_NOUNS.has(token) || /^[A-Z0-9]{2,}s?$/.test(token);
    const cased = start ? token[0].toUpperCase() + (keep ? token.slice(1) : token.slice(1).toLowerCase()) : keep ? token : token.toLowerCase();
    start = false;
    return cased;
  });
  return restorePhrases(out);
}

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/gu;

/**
 * Finds the tells in a message.
 * @param {string} text
 * @returns {Tell[]}
 */
export function findTells(text) {
  /** @type {Tell[]} */
  const tells = [];
  const lines = text.split("\n");
  const lineOf = (index) => text.slice(0, index).split("\n").length;
  const add = (level, rule, match, index, hint) => tells.push({ level, rule, match, line: lineOf(index), hint });

  for (const m of text.matchAll(EMOJI)) {
    add("fix", "emoji", m[0], m.index, "Cut it. People sending a real note rarely use them, and models use them everywhere.");
  }
  for (const m of text.matchAll(/—|(?<=\s)–(?=\s)/g)) {
    add("fix", "dash", m[0], m.index, "Use a period, comma, colon or parentheses.");
  }
  for (const [source, hint] of STOCK_PHRASES) {
    for (const m of text.matchAll(new RegExp(`\\b(${source})\\b`, "gi"))) add("fix", "stock-phrase", m[0], m.index, hint);
  }
  for (const [re, rule, level, hint] of PATTERNS) {
    for (const m of text.matchAll(re)) add(level, rule, m[0].trim(), m.index, hint);
  }
  for (const m of text.matchAll(/!{2,}/g)) add("fix", "exclamations", m[0], m.index, "One at most.");
  for (const m of text.matchAll(/\*\*[^*\n]+\*\*|__[^_\n]+__/g)) {
    add("fix", "markdown", m[0], m.index, "Facebook and email don't render markdown; it shows as asterisks.");
  }
  for (const m of text.matchAll(/^#{1,6} /gm)) add("fix", "markdown", m[0].trim(), m.index, "No headings in a message.");

  const bangs = (text.match(/!/g) ?? []).length;
  if (bangs > 2) add("look", "exclamations", `${bangs} exclamation marks`, 0, "Keep one or two.");
  const tags = text.match(/(^|\s)#[A-Za-z]\w*/g) ?? [];
  if (tags.length > 2) add("look", "hashtags", tags.map((t) => t.trim()).join(" "), 0, "Two at most, or none.");
  let offset = 0;
  for (const line of lines) {
    if (/^\s*([•▪◦●✓✔]|[-*] )/.test(line)) add("look", "bullets", line.trim(), offset, "Fine for a real checklist. Otherwise write it as sentences.");
    if (isTitleCase(line)) add("fix", "title-case", line.trim(), offset, "A headline in Title Case reads like a pasted blog title. Write it in sentence case.");
    offset += line.length + 1;
  }
  return tells;
}

/** The text to check in a file: a post.json's message, or the whole file. */
export async function textOf(file) {
  const raw = file === "-" ? await readStdin() : await readFile(file, "utf8");
  if (file.endsWith(".json")) {
    const json = JSON.parse(raw);
    return typeof json.message === "string" ? json.message : "";
  }
  return raw;
}

async function readStdin() {
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

/** One line per tell, for terminals and for error messages. */
export function formatTells(tells) {
  return tells.map((t) => `  ${t.level === "fix" ? "✗" : "?"} line ${t.line} ${t.rule}: "${t.match}". ${t.hint}`).join("\n");
}

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("usage: node scripts/human-voice.mjs <file>... | -");
    process.exit(1);
  }
  let fixes = 0;
  for (const file of files) {
    const tells = findTells(await textOf(file));
    fixes += tells.filter((t) => t.level === "fix").length;
    const name = file === "-" ? "stdin" : path.relative(process.cwd(), file);
    console.log(tells.length ? `${name}\n${formatTells(tells)}` : `✓ ${name}`);
  }
  if (fixes) process.exit(1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}

