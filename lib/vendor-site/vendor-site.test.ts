// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { buildVendorSiteData, injectVendorRuntime, type VendorSitePayload } from "./runtime";
import { buildVendorTemplateSite, sanitizeVendorBrief } from "./templates";
import { buildVendorDesignerPrompt } from "./ai";
import { reviewSite } from "@/lib/custom-site/policy";

const ORG = "10000000-0000-0000-0000-0000000000a1";
const payload: VendorSitePayload = {
  org_id: ORG,
  business_name: "Keb Tech <script>alert(1)</script>",
  category: "DJ",
  description: "Club-caliber sound.\nBilingual MC.",
  city: "Miami",
  region: "Florida",
  phone: "(305) 555-0192",
  email: "bookings@kebtech.com",
  website: "javascript:alert(1)",
  social_links: { instagram: "https://www.instagram.com/kebtech" },
  price_tier: 3,
  highlights: [{ icon: "star", title: "Bilingual", detail: "English & Spanish" }],
  packages: [
    { name: "Silver", price: 900, description: null, includes: ["4 hours"], featured: false },
    { name: "Gold <b>", price: null, description: "Everything", includes: ["6 hours", "Uplighting"], featured: true },
  ],
  faqs: [{ q: "Do you travel?", a: "Yes, all of Florida." }],
  gallery: [
    { image_url: "https://cdn.example.com/a.jpg", title: "Setup", media_type: "photo", media_url: null },
    { image_url: "not-a-url", title: "Bad", media_type: "photo", media_url: null },
  ],
  reviews: { count: 2, average: "4.5", items: [{ author_name: "Ana", rating: 5, body: "Amazing night" }] },
};

describe("buildVendorSiteData", () => {
  const d = buildVendorSiteData(payload, new Date("2026-11-15T12:00:00Z"));

  it("shapes the listing for the page", () => {
    expect(d.location).toBe("Miami, Florida");
    expect(d.price_range).toBe("$$$");
    expect(d.rating).toBe("4.5 ★ · 2 reviews");
    expect(d.packages.map((p) => [p.name, p.price])).toEqual([
      ["Gold <b>", "Ask for a quote"],
      ["Silver", "From $900"],
    ]);
    expect(d.listing_url).toMatch(new RegExp(`/v/${ORG}$`));
    expect(d.contact_url).toBe(`${d.listing_url}#contact`);
    expect(d.socials).toEqual([{ label: "Instagram", url: "https://www.instagram.com/kebtech" }]);
    expect(d.year).toBe(2026);
  });

  it("drops unsafe links and bad images", () => {
    expect(d.website).toBeNull();
    expect(d.gallery).toHaveLength(1);
    expect(d.cover_url).toBe("https://cdn.example.com/a.jpg");
  });
});

describe("vendor runtime on a themed page", () => {
  function render(p: VendorSitePayload) {
    const html = injectVendorRuntime(buildVendorTemplateSite(sanitizeVendorBrief({ theme: "modern" })), buildVendorSiteData(p));
    document.open();
    document.write(html);
    document.close();
    // The runtime script runs on write in jsdom only if scripts are enabled; run it by hand.
    const script = [...document.querySelectorAll("script")].find((s) => s.textContent?.includes("window.bridalTeam="));
    // eslint-disable-next-line no-new-func
    new Function(script!.textContent!)();
    return document;
  }

  it("fills listing details as text, never as markup", () => {
    const doc = render(payload);
    const h1 = doc.querySelector("h1")!;
    expect(h1.textContent).toBe("Keb Tech <script>alert(1)</script>");
    expect(h1.querySelector("script")).toBeNull();
    expect(doc.querySelectorAll(".bt-package")).toHaveLength(2);
    expect(doc.querySelector(".bt-package.bt-featured h3")!.textContent).toBe("Gold <b>");
    expect(doc.querySelector(".bt-package h3 b")).toBeNull();
    expect(doc.querySelectorAll(".bt-faq")).toHaveLength(1);
    expect(doc.querySelectorAll(".bt-gallery-item img")).toHaveLength(1);
    expect(doc.querySelector(".bt-review cite")!.textContent).toBe("Ana · ★★★★★");
    expect((doc.querySelector('a[data-bt="phone"]') as HTMLAnchorElement).getAttribute("href")).toBe("tel:3055550192");
    expect((doc.querySelector('a[data-bt="contact"]') as HTMLAnchorElement).getAttribute("href")).toMatch(/\/v\/.+#contact$/);
  });

  it("hides sections the listing doesn't have", () => {
    const doc = render({ org_id: ORG, business_name: "New Co" });
    expect((doc.getElementById("packages") as HTMLElement).style.display).toBe("none");
    expect((doc.getElementById("reviews") as HTMLElement).style.display).toBe("none");
    expect((doc.getElementById("contact") as HTMLElement).style.display).toBe("");
    expect((doc.querySelector('a[data-bt="website"]') as HTMLElement).style.display).toBe("none");
  });
});

describe("templates and AI brief", () => {
  it("escapes the headline and falls back to a known theme", () => {
    const brief = sanitizeVendorBrief({ theme: "nope", headline: '<img src=x onerror="1">Hi' });
    expect(brief.theme).toBe("classic");
    const html = buildVendorTemplateSite(brief);
    expect(html).toContain("&lt;img src=x onerror=&quot;1&quot;&gt;Hi");
    expect(html).not.toContain("<img src=x");
  });

  it("tells the designer what the listing has, and to link contact buttons", () => {
    const { system, user } = buildVendorDesignerPrompt({ data: buildVendorSiteData(payload), request: "Dark and moody", current: null });
    expect(system).toContain('data-bt="contact"');
    expect(system).toContain("Never invent facts");
    expect(user).toContain("Packages");
    expect(user).toContain("Dark and moody");
  });
});

describe("content check for business sites", () => {
  it("uses the business policy, which allows promoting their own services", async () => {
    const seen: string[] = [];
    const verdict = await reviewSite(
      "<p>Book our Gold package today</p>",
      async (system) => {
        seen.push(system);
        return { ok: true, text: '{"allowed": true}' };
      },
      "business",
    );
    expect(verdict).toEqual({ status: "pass" });
    expect(seen[0]).toContain("wedding vendors' business websites");
    expect(seen[0]).toContain("advertising for products or businesses other than this vendor's own");
    expect(seen[0]).toContain("Normal business content is ALLOWED");
    expect(seen[0]).toContain("asking visitors for passwords");
  });

  it("leaves the wedding policy as it was", async () => {
    const seen: string[] = [];
    await reviewSite("<p>hi</p>", async (system) => {
      seen.push(system);
      return { ok: true, text: '{"allowed": true}' };
    });
    expect(seen[0]).toContain("couples' wedding websites");
    expect(seen[0]).toContain("Normal wedding content is ALLOWED");
  });
});
