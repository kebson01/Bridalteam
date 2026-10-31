import { describe, expect, it } from "vitest";
import { restoreEmail, searchTerm, takedownEmail } from "@/lib/custom-site/moderation-email";

describe("admin search", () => {
  it("pulls the address out of a pasted guest link", () => {
    expect(searchTerm("https://bridalteam.com/wedding/Gene-and-John?ref=x")).toBe("gene-and-john");
    expect(searchTerm("bridalteam.com/wedding/ana-ben-2027")).toBe("ana-ben-2027");
  });
  it("keeps names but strips filter syntax", () => {
    expect(searchTerm("O'Brien")).toBe("o'brien");
    expect(searchTerm("ana),id.eq.1")).toBe("anaideq1");
  });
});

describe("couple emails", () => {
  it("gives the reason, escaped, and links to the builder", () => {
    const { subject, html } = takedownEmail({ weddingId: "w1", names: "Ana <b>", reason: "Scam <script>" });
    expect(subject).toBe("Your wedding website has been taken down");
    expect(html).toContain("/w/w1/builder");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<b>");
  });
  it("tells them they can publish again", () => {
    expect(restoreEmail({ weddingId: "w1", names: "" }).html).toContain("/w/w1/website");
  });
});
