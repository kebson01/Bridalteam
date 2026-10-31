import { describe, expect, it } from "vitest";
import {
  categoryFromPlaceTypes,
  dedupeLeads,
  formatPhone,
  jsonToLeads,
  leadsToSql,
  mapCategory,
  nameKey,
  parseCsv,
  parseMap,
  phone10,
  placesToLeads,
  rowsToLeads,
  siteDomain,
  tidyCity,
} from "./vendor-leads.mjs";
import { CATEGORY_ORDER } from "@/lib/categories";

// The same cases the migration's SQL functions were checked against, so the
// script and the database agree on what counts as the same business.
describe("matching keys", () => {
  it("phone10 keeps the last ten digits and refuses partial numbers", () => {
    expect(phone10("+1 (954) 721-9911")).toBe("9547219911");
    expect(phone10("954.721.9911")).toBe("9547219911");
    expect(phone10("721-9911")).toBeNull();
    expect(phone10(null)).toBeNull();
  });

  it("siteDomain strips scheme, www and path, and refuses directories", () => {
    expect(siteDomain("https://www.Example.com/about?x=1")).toBe("example.com");
    expect(siteDomain("example.com")).toBe("example.com");
    expect(siteDomain("https://facebook.com/foo")).toBeNull();
    expect(siteDomain("https://www.theknot.com/marketplace/x")).toBeNull();
    expect(siteDomain("linktr.ee/x")).toBeNull();
    expect(siteDomain("")).toBeNull();
  });

  it("nameKey drops case, punctuation, a leading 'the' and a legal suffix", () => {
    expect(nameKey("The Marry Me, LLC")).toBe("marry me");
    expect(nameKey("Bliss & Co Events Inc.")).toBe("bliss and co events");
    // Not merged: different businesses that share a word.
    expect(nameKey("Bliss Events")).not.toBe(nameKey("Bliss Photography"));
  });

  it("formatPhone matches how listings store numbers", () => {
    expect(formatPhone("954-721-9911")).toBe("(954) 721-9911");
    expect(formatPhone("123")).toBeNull();
  });
});

describe("mapCategory", () => {
  it.each([
    ["Photo Booth Rental", "Photo booth"],
    ["Wedding Photographer", "Photography"],
    ["FLORIST", "Florist"],
    ["Mobile Caterer", "Caterer"],
    ["DJ Services", "DJ"],
    ["Bridal Shop", "Bridal salon"],
    ["Limousine Service", "Transportation"],
    ["Party Rentals", "Rentals"],
    ["Banquet Hall", "Venue"],
    ["Wedding Planner", "Wedding planner"],
  ])("%s -> %s", (text, label) => {
    expect(mapCategory(text)).toBe(label);
  });

  it("does not file a tax roll's non-wedding trades as wedding vendors", () => {
    expect(mapCategory("Financial Planner")).toBeNull();
    expect(mapCategory("Interior Decorator")).toBeNull();
    expect(mapCategory("Car Rentals")).toBeNull();
    expect(mapCategory("Plumbing Contractor")).toBeNull();
    expect(mapCategory("")).toBeNull();
  });

  it("only ever returns a label the directory uses", () => {
    const samples = ["photo booth", "photography", "videography", "florist", "catering", "dj", "officiant",
      "makeup", "cake", "wedding planner", "bridal boutique", "limo", "party rental", "band", "jewelry",
      "alterations", "invitations", "event lighting", "event decor", "bartending", "valet",
      "dance studio", "travel agency", "venue"];
    for (const s of samples) expect(CATEGORY_ORDER).toContain(mapCategory(s));
    for (const t of ["florist", "wedding_venue", "photographer", "catering_service"]) {
      expect(CATEGORY_ORDER).toContain(categoryFromPlaceTypes([t]));
    }
  });
});

describe("csv sources", () => {
  const csv =
    'ACCOUNT,BUSINESS NAME,BUSINESS TYPE,CITY,PHONE,STATUS\n' +
    '1001,"Petals, Inc.",FLORIST,FORT LAUDERDALE,9545551234,ACTIVE\n' +
    '1002,Joe\'s Plumbing,PLUMBING CONTRACTOR,MIAMI,3055550000,ACTIVE\n' +
    '1003,Old Cakes,BAKERY,MIAMI,3055551111,INACTIVE\n' +
    '1004,"Say ""Cheese"" Studio",PHOTOGRAPHER,Coral Gables,,ACTIVE\n';

  it("parses quoted fields and doubled quotes", () => {
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(4);
    expect(rows[0]["BUSINESS NAME"]).toBe("Petals, Inc.");
    expect(rows[3]["BUSINESS NAME"]).toBe('Say "Cheese" Studio');
  });

  it("maps, filters and categorises rows", () => {
    const leads = rowsToLeads(parseCsv(csv), {
      source: "county_btr",
      map: parseMap("name=BUSINESS NAME,city=CITY,phone=PHONE,type=BUSINESS TYPE,ref=ACCOUNT"),
      where: [["STATUS", "active"]],
    });
    expect(leads.map((l) => l.business_name)).toEqual(["Petals, Inc.", 'Say "Cheese" Studio']);
    expect(leads[0]).toMatchObject({
      source: "county_btr",
      source_ref: "1001",
      category: "Florist",
      city: "Fort Lauderdale",
      phone: "(954) 555-1234",
    });
    expect(leads[1].city).toBe("Coral Gables");
    expect(leads[1].phone).toBeNull();
  });

  it("--category forces one category, for single-type licence files", () => {
    const leads = rowsToLeads(parseCsv(csv), {
      source: "dbpr",
      map: parseMap("name=BUSINESS NAME,city=CITY"),
      category: "Caterer",
    });
    expect(leads).toHaveLength(4);
    expect(leads.every((l) => l.category === "Caterer")).toBe(true);
  });
});

describe("research json and dedupe", () => {
  it("keeps one lead per business by phone, domain or name", () => {
    const leads = dedupeLeads([
      { business_name: "A", phone: "954-555-0001", website: null },
      { business_name: "B", phone: "(954) 555-0001", website: null },
      { business_name: "C", phone: null, website: "https://c.com" },
      { business_name: "D", phone: null, website: "http://www.c.com/x" },
      { business_name: "The E, LLC", phone: null, website: null },
      { business_name: "E", phone: null, website: null },
    ]);
    expect(leads.map((l) => l.business_name)).toEqual(["A", "C", "The E, LLC"]);
  });

  it("takes a per-item source and falls back to the flag", () => {
    const leads = jsonToLeads(
      [
        { business_name: "X", source: "venue_preferred", source_ref: "Leu Gardens", phone: "4075551212" },
        { business_name: "Y", source: "bogus", phone: "4075551213" },
        { business_name: "  " },
      ],
      { source: "web_search" },
    );
    expect(leads.map((l) => [l.business_name, l.source, l.phone])).toEqual([
      ["X", "venue_preferred", "(407) 555-1212"],
      ["Y", "web_search", "(407) 555-1213"],
    ]);
  });
});

describe("google places", () => {
  it("keeps the place_id, name, city and category -- never Google's phone or website", () => {
    const leads = placesToLeads([
      {
        id: "abc",
        displayName: { text: "Naples Blooms" },
        types: ["florist", "store"],
        addressComponents: [{ longText: "Naples", types: ["locality"] }],
        nationalPhoneNumber: "(239) 555-0100",
        websiteUri: "https://naplesblooms.com",
        businessStatus: "OPERATIONAL",
      },
      { id: "gone", displayName: { text: "Closed Florist" }, types: ["florist"], businessStatus: "CLOSED_PERMANENTLY" },
      { id: "x", displayName: { text: "Hardware Store" }, types: ["hardware_store"] },
    ]);
    expect(leads).toHaveLength(1);
    expect(leads[0]).toMatchObject({
      source: "google_places",
      source_ref: "abc",
      business_name: "Naples Blooms",
      category: "Florist",
      city: "Naples",
      phone: null,
      website: null,
    });
  });
});

describe("leadsToSql", () => {
  it("escapes quotes and is safe to re-run", () => {
    const sql = leadsToSql([{ source: "web_search", business_name: "Joe's", category: "DJ", city: "Miami" }]);
    expect(sql).toContain("'Joe''s'");
    expect(sql).toContain("on conflict do nothing");
    expect(tidyCity("  ")).toBeNull();
  });
});
