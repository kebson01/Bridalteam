/**
 * Guest website addresses (bridalteam.com/wedding/<slug>).
 *
 * The database decides (public.wedding_slug_problem in migration
 * 20261101120000_custom_site_policy_and_retention.sql): 3–40 lowercase
 * letters, numbers and single hyphens; not reserved, offensive, or using the
 * Bridal Team name; not in use; not held. This file turns a couple's typing
 * into a candidate and the database's answer into a sentence.
 */

export type SlugProblem = "format" | "reserved" | "blocked" | "taken" | "held";

export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
}

/** The address a couple would most likely want: "gene-and-john". */
export function namesSlug(a: string | null, b: string | null): string {
  const names = [a, b].map((n) => (n ?? "").trim().split(/\s+/)[0]).filter(Boolean);
  return toSlug(names.join(" and ")) || "our-wedding";
}

export function slugProblemMessage(problem: string): string {
  switch (problem as SlugProblem) {
    case "format":
      return "Use 3–40 letters, numbers and single hyphens, starting and ending with a letter or number.";
    case "reserved":
      return "That address is reserved. Try adding your names or wedding year.";
    case "blocked":
      return "That address isn't allowed. Please choose another.";
    case "taken":
      return "Another couple is already using that address. Try adding your wedding year, like gene-and-john-2027.";
    case "held":
      return "That address belonged to a wedding that recently ended and frees up within 30 days. Try another for now.";
    default:
      return "Couldn't use that address. Please try another.";
  }
}

/** Alternatives to offer when the names are taken, best first. */
export function slugCandidates(a: string | null, b: string | null, eventDate: string | null): string[] {
  const base = namesSlug(a, b);
  const year = eventDate?.slice(0, 4);
  const list = [base, year && `${base}-${year}`, `${base}-wedding`, year && `${base}-wedding-${year}`];
  return [...new Set(list.filter((s): s is string => Boolean(s)).map((s) => toSlug(s)))];
}

export function randomSuffixSlug(base: string): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  const suffix = Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `${toSlug(base).slice(0, 34) || "our-wedding"}-${suffix}`;
}
