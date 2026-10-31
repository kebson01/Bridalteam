import { describe, expect, it } from "vitest";
import { buildTemplateSite, sanitizeBrief, THEME_IDS } from "@/lib/custom-site/templates";

describe("sanitizeBrief", () => {
  it("defaults an unknown theme and bounds every field", () => {
    const b = sanitizeBrief({
      theme: "neon",
      headline: "x".repeat(500),
      schedule: Array.from({ length: 30 }, (_, i) => ({ time: "4pm", title: `E${i}` })),
      faq: [{ q: "Kids?", a: "Adults only" }, { q: "", a: "dropped" }],
      accent: "red",
    });
    expect(b.theme).toBe("classic");
    expect(b.headline).toHaveLength(120);
    expect(b.schedule).toHaveLength(10);
    expect(b.faq).toEqual([{ q: "Kids?", a: "Adults only" }]);
    expect(b.accent).toBeNull();
  });

  it("survives junk", () => {
    expect(sanitizeBrief(null).theme).toBe("classic");
    expect(sanitizeBrief("x").schedule).toEqual([]);
  });
});

describe("buildTemplateSite", () => {
  it("builds every theme with the live placeholders", () => {
    for (const theme of THEME_IDS) {
      const html = buildTemplateSite(sanitizeBrief({ theme }));
      expect(html.startsWith("<!doctype html>")).toBe(true);
      for (const p of ["names", "date", "location", "countdown", "cover", "registry", "rsvp", "welcome"]) {
        expect(html, `${theme} missing ${p}`).toContain(`data-bt="${p}"`);
      }
    }
  });

  it("escapes everything the brief supplies", () => {
    const html = buildTemplateSite(
      sanitizeBrief({
        theme: "tropical",
        headline: '<img src=x onerror="alert(1)">',
        story: "<script>alert(2)</script>",
        faq: [{ q: "<b>q</b>", a: "a & b" }],
      }),
    );
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<script>alert(2)");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(html).toContain("a &amp; b");
  });

  it("only links sections that exist", () => {
    const bare = buildTemplateSite(sanitizeBrief({ theme: "modern" }));
    expect(bare).not.toContain('href="#day"');
    const full = buildTemplateSite(sanitizeBrief({ theme: "modern", schedule: [{ title: "Ceremony" }] }));
    expect(full).toContain('href="#day"');
    expect(full).toContain('id="day"');
  });
});
