import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { BADGE_IMAGES, badgeHtml } from "./vendor-badge";
import { SITE_URL } from "./site";

const ID = "a7208e5b-468a-4715-bfff-db284dda1c8f";

describe("vendor badge", () => {
  it("links to the vendor's own profile with a followed link and the badge image", () => {
    const html = badgeHtml(ID, "DJ Mike Cooley");
    expect(html).toContain(`href="${SITE_URL}/v/${ID}"`);
    expect(html).not.toMatch(/nofollow/);
    expect(html).toContain(`src="${SITE_URL}/badges/bridal-team-badge.svg"`);
    expect(html).toContain('alt="Find us on Bridal Team"');
    expect(html).toContain('width="200" height="56"');
  });

  it("uses the dark image when asked", () => {
    expect(badgeHtml(ID, "X", "dark")).toContain("bridal-team-badge-dark.svg");
  });

  it("escapes the business name so it can't break the snippet", () => {
    const html = badgeHtml(ID, 'A "quoted" <b>name</b> & co');
    expect(html).toContain('title="A &quot;quoted&quot; &lt;b&gt;name&lt;/b&gt; &amp; co on Bridal Team"');
  });

  it("ships both images", () => {
    for (const p of Object.values(BADGE_IMAGES)) expect(existsSync(join(process.cwd(), "public", p)), p).toBe(true);
  });
});
