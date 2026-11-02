import { describe, expect, it } from "vitest";
import { findTells, isTitleCase, toSentenceCase } from "./human-voice.mjs";

const fixes = (text: string) => findTells(text).filter((t) => t.level === "fix").map((t) => t.rule);

describe("findTells", () => {
  it("passes a plain note a person would write", () => {
    const note =
      "Congratulations! A June wedding in Fort Lauderdale gives you time to book the venue first.\n\n" +
      "If it helps, you can set up a free wedding page with RSVPs whenever you're ready: https://bridalteam.com/wedding-website";
    expect(findTells(note)).toEqual([]);
  });

  it.each([
    ["Engaged this season? 💍", "emoji"],
    ["Book the venue first — everything else follows.", "dash"],
    ["I hope this email finds you well.", "stock-phrase"],
    ["Let's delve into the details.", "stock-phrase"],
    ["Start your wedding planning journey today.", "stock-phrase"],
    ["Don't hesitate to reply.", "stock-phrase"],
    ["It's not just a website, it's your story.", "not-x-but-y"],
    ["Not just a checklist, but a whole plan.", "not-x-but-y"],
    ["We did it!!", "exclamations"],
    ["This is **free** for couples.", "markdown"],
    ["How to Make Your Wedding Cake Tasting Count\n\nTaste first.", "title-case"],
  ])("flags %j as %s", (text, rule) => {
    expect(fixes(text)).toContain(rule);
  });

  it("leaves hyphens, ranges and a single exclamation alone", () => {
    expect(fixes("A 6-month plan, 100-150 guests, family-style dinner. Congrats!")).toEqual([]);
  });

  it("marks bullets and hashtags for a second look, not as errors", () => {
    const tells = findTells("Bring:\n• photos\n• your palette\n\n#wedding #bride #engaged");
    expect(tells.map((t) => t.level)).not.toContain("fix");
    expect(tells.map((t) => t.rule)).toEqual(expect.arrayContaining(["bullets", "hashtags"]));
  });

  it("reports the line a tell is on", () => {
    expect(findTells("Hi there,\n\nSee you soon 🎉")[0].line).toBe(3);
  });
});

describe("isTitleCase", () => {
  it.each([
    ["How to Make Your Wedding Cake Tasting Count", true],
    ["6 Questions to Ask Your Wedding DJ or Band Before You Book", true],
    ["Happy Thanksgiving from Bridal Team.", false],
    ["Merry Christmas from Bridal Team.", false],
    ["How to make your wedding cake tasting count", false],
    ["Engagement season starts now in South Florida.", false],
  ])("%j -> %s", (line, expected) => {
    expect(isTitleCase(line)).toBe(expected);
  });
});

describe("toSentenceCase", () => {
  it.each([
    ["How to Make Your Wedding Cake Tasting Count", "How to make your wedding cake tasting count"],
    ["6 Questions to Ask Your Wedding DJ or Band Before You Book", "6 questions to ask your wedding DJ or band before you book"],
    ["Save-the-Dates vs. Invitations: When to Send Each", "Save-the-dates vs. invitations: when to send each"],
    ["Cinematic or Documentary? How to Choose Your Wedding Video Style", "Cinematic or documentary? How to choose your wedding video style"],
    ["4 Ways to Keep Your Wedding Day on Time", "4 ways to keep your wedding day on time"],
    ["Happy Valentine's Day From Bridal Team", "Happy Valentine's Day from Bridal Team"],
    ["Wedding Budget Calculator: A $30,000 Budget by Category", "Wedding budget calculator: a $30,000 budget by category"],
  ])("%j", (line, expected) => {
    expect(toSentenceCase(line)).toBe(expected);
  });
});

describe("isTitleCase leaves capitalized non-headlines alone", () => {
  it.each(["Kebson St. Charles", "Bridal Team, 123 Main St #4, Fort Lauderdale, FL 33301", "Hi Sunrise Photo team,"])("%j", (line) => {
    expect(isTitleCase(line)).toBe(false);
  });
});
