import { describe, expect, it } from "vitest";
import { buildSiteData, injectRuntime, scriptSafeJson } from "@/lib/custom-site/runtime";

const data = buildSiteData({
  partner_one: "Ana",
  partner_two: "Ben",
  event_date: "2027-06-05",
  venue: "The Grove",
  city: "Coral Springs",
  region: "FL",
  welcome_message: "Hi!",
  cover_image_url: "https://cdn.example.com/a.jpg",
  registry: [
    { label: "Zola", url: "https://zola.com/x" },
    { label: "Evil", url: "javascript:alert(1)" },
  ],
});

describe("buildSiteData", () => {
  it("joins names and location and writes the date out", () => {
    expect(data.names).toBe("Ana & Ben");
    expect(data.location).toBe("The Grove · Coral Springs · FL");
    expect(data.date_display).toBe("Saturday, June 5, 2027");
  });

  it("drops registry links and cover photos that aren't http(s)", () => {
    expect(data.registry).toEqual([{ label: "Zola", url: "https://zola.com/x" }]);
    expect(buildSiteData({ cover_image_url: "javascript:x" }).cover_image_url).toBeNull();
  });
});

describe("scriptSafeJson", () => {
  it("can't close the script tag or break the literal", () => {
    const out = scriptSafeJson({ s: "</script><script>alert(1)</script> " });
    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
    expect(out).not.toContain(" ");
    expect(JSON.parse(out)).toEqual({ s: "</script><script>alert(1)</script> " });
  });
});

describe("injectRuntime", () => {
  it("puts the runtime first in <head>, not inside <header>", () => {
    const out = injectRuntime("<!doctype html><html><head><title>x</title></head><body><header>h</header></body></html>", data);
    expect(out.indexOf("window.bridalTeam")).toBeGreaterThan(out.indexOf("<head>"));
    expect(out.indexOf("window.bridalTeam")).toBeLessThan(out.indexOf("<title>"));
    expect(out).toContain("<header>h</header>");
  });

  it("wraps a fragment in a full document", () => {
    const out = injectRuntime('<h1 data-bt="names"></h1>', data);
    expect(out.startsWith("<!doctype html><html><head>")).toBe(true);
    expect(out).toContain('<body><h1 data-bt="names"></h1></body>');
  });

  it("adds a head when there is only an <html> tag", () => {
    const out = injectRuntime('<html lang="en"><body>x</body></html>', data);
    expect(out).toMatch(/^<html lang="en"><head>.*window\.bridalTeam/);
  });

  it("fills data-bt placeholders when run", () => {
    document.documentElement.innerHTML =
      '<head></head><body><h1 data-bt="names"></h1><p data-bt="date"></p><div data-bt="registry"></div><img data-bt="cover"></body>';
    const script = injectRuntime("<p></p>", data).match(/<script>([\s\S]*?)<\/script>/)![1];
    // eslint-disable-next-line no-new-func
    new Function(script)();
    expect(document.querySelector('[data-bt="names"]')!.textContent).toBe("Ana & Ben");
    expect(document.querySelector('[data-bt="date"]')!.textContent).toBe("Saturday, June 5, 2027");
    const links = document.querySelectorAll<HTMLAnchorElement>(".bt-registry-link");
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe("https://zola.com/x");
    expect(links[0].target).toBe("_blank");
    expect(document.querySelector<HTMLImageElement>('[data-bt="cover"]')!.src).toBe("https://cdn.example.com/a.jpg");
  });
});
