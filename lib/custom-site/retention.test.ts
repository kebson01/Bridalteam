import { describe, expect, it } from "vitest";
import { siteEndsOn, retentionNote } from "@/lib/custom-site/retention";
import { reminderEmail } from "@/lib/custom-site/retention-email";

describe("siteEndsOn", () => {
  // Expected values come from public.wedding_site_ends_on() in Postgres,
  // which clamps to the end of shorter months.
  it.each([
    ["2026-08-31", "2027-02-28"],
    ["2027-08-29", "2028-02-29"],
    ["2027-08-30", "2028-02-29"],
    ["2026-12-31", "2027-06-30"],
    ["2027-06-06", "2027-12-06"],
    ["2026-02-28", "2026-08-28"],
  ])("6 months after a wedding on %s is %s", (wedding, ends) => {
    expect(siteEndsOn(wedding, "2026-01-01T00:00:00Z")).toBe(ends);
  });

  it("falls back to 24 months after the wedding was created when there's no date", () => {
    expect(siteEndsOn(null, "2026-10-31T23:30:00Z")).toBe("2028-10-31");
  });

  it("tells couples the date in words", () => {
    expect(retentionNote("2027-06-06", "2026-01-01T00:00:00Z")).toContain("December 6, 2027, 6 months after your wedding");
    expect(retentionNote(null, "2026-10-31T00:00:00Z")).toContain("Add your wedding date");
  });
});

describe("reminderEmail", () => {
  it("says when, links to the Website tab and escapes names", () => {
    const { subject, html } = reminderEmail({
      wedding_id: "w1",
      days: 30,
      ends_on: "2027-12-06",
      names: "Ana <script> & Ben",
      emails: ["a@example.com"],
    });
    expect(subject).toBe("Your wedding website comes down on December 6, 2027");
    expect(html).toContain("/w/w1/website");
    expect(html).toContain("Download my site");
    expect(html).not.toContain("<script>");
  });

  it("counts down in the last week", () => {
    expect(reminderEmail({ wedding_id: "w1", days: 7, ends_on: "2027-12-06", names: "", emails: [] }).subject).toBe(
      "Your wedding website comes down in 7 days",
    );
  });
});
